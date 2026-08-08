// biome-ignore lint/correctness/noUnusedImports: `h` is required by Stencil's JSX transform at runtime
import { Component, Event, type EventEmitter, Fragment, h, Method, State } from '@stencil/core';
import type { FieldMeta } from '../../core';

let uid = 0;

/**
 * Reorderable field list. Ported from the standalone touch-drag spike.
 *
 * Key difference from that spike: rows are keyed by field id (`key={f.id}`
 * below), so Stencil's virtual-DOM diff reuses the same DOM node for a row
 * across re-renders instead of destroying/recreating it. That's what caused
 * the original bug (re-render killed the element mid-drag, silently ending
 * pointer capture) — keyed VDOM avoids it by construction, as long as the
 * key stays stable across the reorder.
 */
@Component({
  tag: 'wb-canvas',
  styleUrl: 'wb-canvas.css',
  shadow: true,
})
export class WbCanvas {
  @State() fields: FieldMeta[] = [
    { id: ++uid, type: 'text', label: 'Name' },
    { id: ++uid, type: 'text', label: 'Email' },
  ];
  @State() hoverIndex: number | null = null;
  @State() draggingId: number | null = null;
  @State() externalDrag = false;
  @State() selectedId: number | null = null;

  @Event() wbChange: EventEmitter<FieldMeta[]>;
  @Event() wbFieldSelected: EventEmitter<FieldMeta>;
  @Event() wbFieldDeselected: EventEmitter<void>;
  @Event() wbFieldUpdated: EventEmitter<{ id: number; patch: Partial<FieldMeta> }>;

  private listEl?: HTMLDivElement;
  private ghostEl?: HTMLDivElement;
  private scrollDir = 0;
  private raf: number | null = null;

  componentDidLoad() {
    this.wbChange.emit(this.fields);
  }

  @Method()
  async addField(type: FieldMeta['type'], label: string) {
    this.fields = [...this.fields, { id: ++uid, type, label }];
    this.wbChange.emit(this.fields);
  }

  @Method()
  async addFieldAfter(type: FieldMeta['type'], label: string) {
    const idx = this.selectedId !== null ? this.fields.findIndex(f => f.id === this.selectedId) + 1 : this.fields.length;
    const insertAt = idx > 0 ? idx : this.fields.length;
    const field = { id: ++uid, type, label };
    const next = [...this.fields];
    next.splice(insertAt, 0, field);
    this.fields = next;
    this.wbChange.emit(this.fields);
    this.selectedId = field.id;
    this.wbFieldSelected.emit(field);
  }

  @Method()
  async importState(fields: FieldMeta[]): Promise<void> {
    if (!Array.isArray(fields)) return;
    for (const f of fields) {
      if (typeof f.id !== 'number' || typeof f.type !== 'string' || typeof f.label !== 'string') {
        return;
      }
    }
    if (this.selectedId !== null) {
      this.selectedId = null;
      this.wbFieldDeselected.emit();
    }
    this.fields = fields;
    if (fields.length > 0) {
      uid = Math.max(...fields.map(f => f.id), uid);
    }
    this.wbChange.emit(this.fields);
  }

  @Method()
  async selectField(id: number | null) {
    this.selectedId = id;
  }

  @Method()
  async updateField(id: number, patch: Partial<FieldMeta>) {
    const idx = this.fields.findIndex(f => f.id === id);
    if (idx === -1) return;
    const next = [...this.fields];
    next[idx] = { ...next[idx], ...patch, id };
    this.fields = next;
    this.wbFieldUpdated.emit({ id, patch });
    this.wbChange.emit(this.fields);
  }

  @Method()
  async beginExternalDrag() {
    if (this.draggingId !== null) {
      this.cancelExternalDrag();
    }
    this.externalDrag = true;
  }

  @Method()
  async setExternalHoverIndex(y: number) {
    if (!this.externalDrag) return;
    if (!this.listEl) {
      this.hoverIndex = null;
      return;
    }
    const rect = this.listEl.getBoundingClientRect();
    if (y < rect.top || y > rect.bottom) {
      this.hoverIndex = null;
      return;
    }
    this.hoverIndex = this.getInsertionIndex(y);
    this.autoScrollCheck(y);
  }

  @Method()
  async commitExternalInsert(type: FieldMeta['type'], label: string) {
    const idx = this.hoverIndex !== null ? this.hoverIndex : this.fields.length;
    const next = [...this.fields];
    next.splice(idx, 0, { id: ++uid, type, label });
    this.fields = next;
    this.wbChange.emit(this.fields);
    this.externalDrag = false;
    this.hoverIndex = null;
  }

  @Method()
  async cancelExternalDrag() {
    this.externalDrag = false;
    this.scrollDir = 0;
    if (this.raf) cancelAnimationFrame(this.raf);
    this.raf = null;
    this.hoverIndex = null;
  }

  private getInsertionIndex(y: number): number {
    if (!this.listEl) return this.fields.length;
    const rows = Array.from(this.listEl.querySelectorAll<HTMLElement>('[data-row]'));
    for (let i = 0; i < rows.length; i++) {
      const r = rows[i].getBoundingClientRect();
      if (y < r.top + r.height / 2) return i;
    }
    return rows.length;
  }

  private onRowClick = (field: FieldMeta) => {
    this.selectedId = field.id;
    this.wbFieldSelected.emit(field);
  };

  private onWrapClick = (e: MouseEvent) => {
    const target = e.target as HTMLElement;
    if (target.closest('[data-row]')) return;
    if (this.selectedId !== null) {
      this.selectedId = null;
      this.wbFieldDeselected.emit();
    }
  };

  private onWrapKeyDown = (e: KeyboardEvent) => {
    if (e.key !== 'Enter' && e.key !== ' ') return;
    const target = e.target as HTMLElement;
    if (target.closest('[data-row]')) return;
    e.preventDefault();
    if (this.selectedId !== null) {
      this.selectedId = null;
      this.wbFieldDeselected.emit();
    }
  };

  private startDrag = (field: FieldMeta, e: PointerEvent) => {
    const handle = e.currentTarget as HTMLElement;
    handle.setPointerCapture(e.pointerId);
    this.draggingId = field.id;

    const ghost = document.createElement('div');
    ghost.textContent = field.label;
    ghost.style.cssText =
      'position:fixed;left:0;top:0;pointer-events:none;z-index:999;background:#fff;' +
      'border:1px solid #2f6fed;border-radius:10px;padding:8px 12px;font-size:14px;' +
      `box-shadow:0 6px 16px rgba(0,0,0,0.2);transform:translate(${e.clientX - 20}px,${e.clientY - 16}px);`;
    document.body.appendChild(ghost);
    this.ghostEl = ghost;

    const onMove = (ev: PointerEvent) => {
      ev.preventDefault();
      if (this.ghostEl) {
        this.ghostEl.style.transform = `translate(${ev.clientX - 20}px,${ev.clientY - 16}px)`;
      }
      this.hoverIndex = this.getInsertionIndex(ev.clientY);
      this.autoScrollCheck(ev.clientY);
    };
    const onUp = () => {
      handle.removeEventListener('pointermove', onMove);
      handle.removeEventListener('pointerup', onUp);
      this.commitDrop(field.id);
    };
    handle.addEventListener('pointermove', onMove);
    handle.addEventListener('pointerup', onUp);
  };

  private autoScrollCheck(y: number) {
    if (!this.listEl) return;
    const rect = this.listEl.getBoundingClientRect();
    const dir = y < rect.top + 30 ? -1 : y > rect.bottom - 30 ? 1 : 0;
    if (dir === this.scrollDir) return;
    this.scrollDir = dir;
    if (this.raf) cancelAnimationFrame(this.raf);
    if (dir === 0) return;
    const tick = () => {
      if (this.listEl) this.listEl.scrollTop += this.scrollDir * 6;
      this.raf = requestAnimationFrame(tick);
    };
    this.raf = requestAnimationFrame(tick);
  }

  private commitDrop(id: number) {
    this.scrollDir = 0;
    if (this.raf) cancelAnimationFrame(this.raf);
    if (this.hoverIndex !== null) {
      const from = this.fields.findIndex(f => f.id === id);
      const next = [...this.fields];
      const [item] = next.splice(from, 1);
      const adj = this.hoverIndex > from ? this.hoverIndex - 1 : this.hoverIndex;
      next.splice(adj, 0, item);
      this.fields = next;
      this.wbChange.emit(this.fields);
    }
    if (this.ghostEl) this.ghostEl.remove();
    this.ghostEl = undefined;
    this.hoverIndex = null;
    this.draggingId = null;
  }

  render() {
    return (
      // biome-ignore lint/a11y/noStaticElementInteractions: container that deselects on empty-area click; rows are real buttons
      <div class="wrap" ref={el => (this.listEl = el)} onClick={this.onWrapClick} onKeyDown={this.onWrapKeyDown}>
        {this.fields.map((f, idx) => (
          // biome-ignore lint/correctness/useJsxKeyInIterable: Stencil Fragment takes no key; the keyed element is the row button below
          <Fragment>
            {this.hoverIndex === idx && <div class="indicator" />}
            <button
              type="button"
              class={{ row: true, dragging: this.draggingId === f.id, selected: this.selectedId === f.id }}
              data-row
              key={f.id}
              onClick={() => this.onRowClick(f)}
            >
              <span class="handle" onPointerDown={e => this.startDrag(f, e)}>
                ⠿
              </span>
              <span class="body">{f.label}</span>
              <span class="type">{f.type}</span>
            </button>
          </Fragment>
        ))}
        {this.hoverIndex === this.fields.length && <div class="indicator" />}
      </div>
    );
  }
}
