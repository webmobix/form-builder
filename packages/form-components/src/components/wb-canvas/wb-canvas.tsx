// biome-ignore lint/correctness/noUnusedImports: `h` is required by Stencil's JSX transform at runtime
import { Component, Event, type EventEmitter, Fragment, h, Method, State, type VNode } from '@stencil/core';
import { defaultColumns, type FieldMeta, type FieldSubtype } from '../../core';

let uid = 0;

type DropTarget = { kind: 'top'; index: number } | { kind: 'column'; containerId: number; colIndex: number; index: number } | null;

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
  @State() dropTarget: DropTarget = null;
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
  async addField(type: FieldMeta['type'], label: string, subtype?: FieldSubtype, design?: { kind: 'design'; designType: FieldMeta['designType'] }) {
    const field = this.buildField(type, label, subtype, design);
    this.fields = [...this.fields, field];
    this.wbChange.emit(this.fields);
  }

  @Method()
  async addFieldAfter(type: FieldMeta['type'], label: string, subtype?: FieldSubtype, design?: { kind: 'design'; designType: FieldMeta['designType'] }) {
    const field = this.buildField(type, label, subtype, design);
    // When the selected element is a row container, append to its first column.
    const selected = this.selectedId !== null ? this.fields.find(f => f.id === this.selectedId) : undefined;
    if (selected && selected.kind === 'design' && selected.designType === 'row') {
      const columns = selected.columns ?? defaultColumns;
      const children = selected.children ? selected.children.map(col => [...col]) : Array.from({ length: columns }, () => [] as FieldMeta[]);
      children[0].push(field);
      const next = [...this.fields];
      const selectedIdx = this.fields.findIndex(f => f.id === selected.id);
      next[selectedIdx] = { ...selected, children };
      this.fields = next;
      this.wbChange.emit(this.fields);
      this.selectedId = field.id;
      this.wbFieldSelected.emit(field);
      return;
    }
    const idx = this.selectedId !== null ? this.fields.findIndex(f => f.id === this.selectedId) + 1 : this.fields.length;
    const insertAt = idx > 0 ? idx : this.fields.length;
    const next = [...this.fields];
    next.splice(insertAt, 0, field);
    this.fields = next;
    this.wbChange.emit(this.fields);
    this.selectedId = field.id;
    this.wbFieldSelected.emit(field);
  }

  private buildField(type: FieldMeta['type'], label: string, subtype?: FieldSubtype, design?: { kind: 'design'; designType: FieldMeta['designType'] }): FieldMeta {
    if (design) {
      return {
        id: ++uid,
        kind: 'design',
        type: 'text',
        label,
        designType: design.designType,
        ...(design.designType === 'paragraph' ? { text: label } : {}),
        ...(design.designType === 'row' ? { columns: defaultColumns, children: Array.from({ length: defaultColumns }, () => [] as FieldMeta[]) } : {}),
      };
    }
    return { id: ++uid, type, label, ...(subtype ? { subtype } : {}) };
  }

  @Method()
  async importState(fields: FieldMeta[]): Promise<void> {
    if (!Array.isArray(fields)) return;
    const normalized: FieldMeta[] = [];
    for (const f of fields) {
      const kind = f.kind ?? 'data';
      const hasDataShape = typeof f.id === 'number' && typeof f.label === 'string' && (typeof f.type === 'string' || kind === 'design');
      if (!hasDataShape) return;
      if (kind === 'design' && typeof f.designType !== 'string') return;
      let entry: FieldMeta = { ...f, id: f.id, label: f.label };
      if (kind === 'design' && f.designType === 'row') {
        const columns = f.columns ?? defaultColumns;
        entry = { ...entry, kind: 'design', designType: f.designType, columns, children: f.children ?? Array.from({ length: columns }, () => [] as FieldMeta[]) };
      } else if (kind === 'design') {
        entry = { ...entry, kind: 'design', designType: f.designType };
      } else {
        entry = { ...entry };
      }
      normalized.push(entry);
    }
    if (this.selectedId !== null) {
      this.selectedId = null;
      this.wbFieldDeselected.emit();
    }
    this.fields = normalized;
    if (normalized.length > 0) {
      uid = Math.max(...normalized.map(f => f.id), uid);
    }
    this.wbChange.emit(this.fields);
  }

  @Method()
  async selectField(id: number | null) {
    this.selectedId = id;
  }

  @Method()
  async updateField(id: number, patch: Partial<FieldMeta>) {
    if (!this.applyFieldPatch(this.fields, id, patch)) return;
    this.fields = [...this.fields];
    this.wbFieldUpdated.emit({ id, patch });
    this.wbChange.emit(this.fields);
  }

  /**
   * Apply `patch` to the field with `id` anywhere in the tree (top level or
   * nested inside row containers). Returns true if found and applied, false
   * otherwise. Mutates the array structure it is given (caller re-sets state).
   */
  private applyFieldPatch(fields: FieldMeta[], id: number, patch: Partial<FieldMeta>): boolean {
    const idx = fields.findIndex(f => f.id === id);
    if (idx !== -1) {
      const current = fields[idx];
      let merged = { ...current, ...patch, id };
      if (current.kind === 'design' && current.designType === 'row' && typeof patch.columns === 'number') {
        const newColumns = Math.max(1, Math.min(4, patch.columns));
        const currentColumns = current.columns ?? defaultColumns;
        const children = current.children ? current.children.map(col => [...col]) : Array.from({ length: currentColumns }, () => [] as FieldMeta[]);
        if (newColumns < currentColumns) {
          const truncated = children.splice(newColumns);
          children[children.length - 1] = [...(children[children.length - 1] ?? []), ...truncated.flat()];
        } else if (newColumns > currentColumns) {
          while (children.length < newColumns) children.push([]);
        }
        merged = { ...merged, columns: newColumns, children };
      }
      fields[idx] = merged;
      return true;
    }
    for (const f of fields) {
      if (f.children) {
        for (const col of f.children) {
          if (this.applyFieldPatch(col, id, patch)) return true;
        }
      }
    }
    return false;
  }

  @Method()
  async beginExternalDrag() {
    if (this.draggingId !== null) {
      this.cancelExternalDrag();
    }
    this.externalDrag = true;
  }

  @Method()
  async setExternalHoverIndex(x: number, y: number) {
    if (!this.externalDrag) return;
    if (!this.listEl) {
      this.dropTarget = null;
      return;
    }
    const columnTarget = this.computeColumnDropTarget(x, y);
    if (columnTarget) {
      this.dropTarget = columnTarget;
      this.hoverIndex = null;
      return;
    }
    const rect = this.listEl.getBoundingClientRect();
    if (y < rect.top || y > rect.bottom) {
      this.dropTarget = null;
      this.hoverIndex = null;
      return;
    }
    const index = this.getInsertionIndex(y);
    this.dropTarget = { kind: 'top', index };
    this.hoverIndex = index;
    this.autoScrollCheck(y);
  }

  private computeColumnDropTarget(x: number, y: number): Extract<DropTarget, { kind: 'column' }> | null {
    if (!this.listEl) return null;
    const containers = this.listEl.querySelectorAll<HTMLElement>('[data-container-id]');
    for (let ci = 0; ci < containers.length; ci++) {
      const container = containers.item(ci);
      const cRect = container.getBoundingClientRect();
      if (y < cRect.top || y > cRect.bottom) continue;
      const containerId = Number(container.getAttribute('data-container-id'));
      const columns = container.querySelectorAll<HTMLElement>('[data-column]');
      for (let j = 0; j < columns.length; j++) {
        const col = columns.item(j);
        const colRect = col.getBoundingClientRect();
        if (x < colRect.left || x > colRect.right) continue;
        const childEls = col.querySelectorAll<HTMLElement>('[data-element-id]');
        let index = childEls.length;
        for (let k = 0; k < childEls.length; k++) {
          const r = childEls.item(k).getBoundingClientRect();
          if (y < r.top + r.height / 2) {
            index = k;
            break;
          }
        }
        return { kind: 'column', containerId, colIndex: j, index };
      }
    }
    return null;
  }

  @Method()
  async commitExternalInsert(type: FieldMeta['type'], label: string, subtype?: FieldSubtype, design?: { kind: 'design'; designType: FieldMeta['designType'] }) {
    const target = this.dropTarget;
    let field: FieldMeta;
    if (design) {
      field = {
        id: ++uid,
        kind: 'design',
        type: 'text',
        label,
        designType: design.designType,
        ...(design.designType === 'paragraph' ? { text: label } : {}),
        ...(design.designType === 'row' ? { columns: defaultColumns, children: Array.from({ length: defaultColumns }, () => [] as FieldMeta[]) } : {}),
      };
    } else {
      field = { id: ++uid, type, label, ...(subtype ? { subtype } : {}) };
    }

    if (target?.kind === 'column') {
      const containerIdx = this.fields.findIndex(f => f.id === target.containerId);
      if (containerIdx === -1) return;
      const container = this.fields[containerIdx];
      const columns = container.columns ?? defaultColumns;
      const children = container.children ? container.children.map(col => [...col]) : Array.from({ length: columns }, () => [] as FieldMeta[]);
      children[target.colIndex].splice(target.index, 0, field);
      const next = [...this.fields];
      next[containerIdx] = { ...container, children };
      this.fields = next;
      this.wbChange.emit(this.fields);
      this.selectedId = field.id;
      this.wbFieldSelected.emit(field);
      this.externalDrag = false;
      this.dropTarget = null;
      this.hoverIndex = null;
      return;
    }

    const idx = this.hoverIndex !== null ? this.hoverIndex : this.fields.length;
    const next = [...this.fields];
    next.splice(idx, 0, field);
    this.fields = next;
    this.wbChange.emit(this.fields);
    this.selectedId = field.id;
    this.wbFieldSelected.emit(field);
    this.externalDrag = false;
    this.dropTarget = null;
    this.hoverIndex = null;
  }

  @Method()
  async cancelExternalDrag() {
    this.externalDrag = false;
    this.scrollDir = 0;
    if (this.raf) cancelAnimationFrame(this.raf);
    this.raf = null;
    this.hoverIndex = null;
    this.dropTarget = null;
  }

  private getInsertionIndex(y: number): number {
    if (!this.listEl) return this.fields.length;
    // Top-level reorder only: nested row children must not be counted, since
    // commitDrop reorders the top-level `fields` array against this index.
    const rows = Array.from(this.listEl.querySelectorAll<HTMLElement>(':scope > [data-element-id]'));
    for (let i = 0; i < rows.length; i++) {
      const r = rows[i].getBoundingClientRect();
      if (y < r.top + r.height / 2) return i;
    }
    return rows.length;
  }

  private onElementClick = (f: FieldMeta, e: MouseEvent) => {
    e.stopPropagation();
    this.selectedId = f.id;
    this.wbFieldSelected.emit(f);
  };

  private onElementKeyDown = (f: FieldMeta, e: KeyboardEvent) => {
    if (e.key !== 'Enter' && e.key !== ' ') return;
    e.preventDefault();
    this.selectedId = f.id;
    this.wbFieldSelected.emit(f);
  };

  private onGripPointerDown = (f: FieldMeta, e: PointerEvent) => {
    e.stopPropagation();
    this.selectedId = f.id;
    this.wbFieldSelected.emit(f);
    // Only top-level fields participate in the reorder drag flow; nested
    // children select on grip press but do not reorder.
    if (this.fields.some(x => x.id === f.id)) {
      this.startDrag(f, e);
    }
  };

  private onWrapClick = (e: MouseEvent) => {
    const target = e.target as HTMLElement;
    if (target.closest('[data-element-id]')) return;
    if (this.selectedId !== null) {
      this.selectedId = null;
      this.wbFieldDeselected.emit();
    }
  };

  private onWrapKeyDown = (e: KeyboardEvent) => {
    if (e.key !== 'Enter' && e.key !== ' ') return;
    const target = e.target as HTMLElement;
    if (target.closest('[data-element-id]')) return;
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

  private rowTypeLabel(f: FieldMeta): string {
    if (f.kind !== 'design') {
      if (f.type === 'richtext') return 'Rich text';
      return f.type;
    }
    if (f.designType === 'heading') return 'Heading';
    if (f.designType === 'paragraph') return 'Paragraph';
    if (f.designType === 'row') return 'Row';
    return 'Design';
  }

  private renderFieldPreview(f: FieldMeta) {
    return (
      <wb-form-field
        name={`field.${f.id}`}
        label={f.label}
        type={f.type}
        subtype={f.subtype}
        required={!!f.required}
        restrictions={f.restrictions}
        multiline={!!f.multiline}
        initialLines={f.initialLines}
        maxHeight={f.maxHeight}
        placeholder={f.placeholder}
        options={f.options}
        disabled
      />
    );
  }

  private renderElement(f: FieldMeta): VNode {
    const isRow = f.kind === 'design' && f.designType === 'row';
    const isTarget = this.dropTarget?.kind === 'column' && this.dropTarget.containerId === f.id;
    const targetCol = isTarget ? (this.dropTarget as Extract<DropTarget, { kind: 'column' }>).colIndex : -1;
    const targetIndex = isTarget ? (this.dropTarget as Extract<DropTarget, { kind: 'column' }>).index : -1;

    let body: VNode;
    if (f.kind !== 'design') {
      body = this.renderFieldPreview(f);
    } else if (f.designType === 'heading') {
      body = <h2 class="preview-heading">{f.label}</h2>;
    } else if (f.designType === 'paragraph') {
      body = <p class="preview-paragraph">{f.text ?? f.label}</p>;
    } else if (f.designType === 'row') {
      const columns = f.columns ?? defaultColumns;
      const children = f.children ?? [];
      body = (
        <div class="row-container" data-container-id={f.id}>
          {Array.from({ length: columns }, (_, colIndex) => {
            const stack = children[colIndex] ?? [];
            const isColTarget = isTarget && colIndex === targetCol;
            const items: VNode[] = [];
            stack.forEach((child, childIdx) => {
              if (isColTarget && childIdx === targetIndex) items.push(<span class="drop-line" />);
              items.push(this.renderElement(child));
            });
            if (isColTarget && targetIndex >= stack.length) items.push(<span class="drop-line" />);
            if (stack.length === 0 && !isColTarget) {
              items.push(<span class="empty-slot" />);
            }
            return (
              // biome-ignore lint/suspicious/noArrayIndexKey: columns are a fixed-size flex layout; column index is the stable identity
              <div class={{ column: true, 'drop-active': isColTarget }} data-column={colIndex} key={colIndex}>
                {items}
              </div>
            );
          })}
        </div>
      );
    } else {
      body = <span class="body">{f.label}</span>;
    }

    return (
      // biome-ignore lint/a11y/useSemanticElements: element is a grouping container that holds nested interactive previews; a real <button> cannot contain buttons
      // biome-ignore lint/a11y/useFocusableInteractive: div is made keyboard-focusable via tabindex and Enter/Space handlers
      <div
        role="button"
        tabindex="0"
        class={{
          'canvas-element': true,
          'canvas-element--row': isRow,
          dragging: this.draggingId === f.id,
          selected: this.selectedId === f.id,
        }}
        data-element-id={f.id}
        key={f.id}
        onClick={e => this.onElementClick(f, e)}
        onKeyDown={e => this.onElementKeyDown(f, e)}
      >
        <span class="grip" title="Drag to move" onPointerDown={e => this.onGripPointerDown(f, e)}>
          <svg viewBox="0 0 16 16" width="12" height="12" aria-hidden="true">
            <circle cx="5" cy="4" r="1.4" fill="currentColor" />
            <circle cx="11" cy="4" r="1.4" fill="currentColor" />
            <circle cx="5" cy="8" r="1.4" fill="currentColor" />
            <circle cx="11" cy="8" r="1.4" fill="currentColor" />
            <circle cx="5" cy="12" r="1.4" fill="currentColor" />
            <circle cx="11" cy="12" r="1.4" fill="currentColor" />
          </svg>
        </span>
        <span class="type-tag">{this.rowTypeLabel(f)}</span>
        <div class="element-body">{body}</div>
      </div>
    );
  }

  render() {
    return (
      // biome-ignore lint/a11y/noStaticElementInteractions: container that deselects on empty-area click; elements are real buttons
      <div class="wrap" ref={el => (this.listEl = el)} onClick={this.onWrapClick} onKeyDown={this.onWrapKeyDown}>
        {this.fields.map((f, idx) => (
          // biome-ignore lint/correctness/useJsxKeyInIterable: Stencil Fragment takes no key; the keyed element is the row below
          <Fragment>
            {this.dropTarget?.kind === 'top' && this.dropTarget.index === idx && <div class="indicator" />}
            {this.renderElement(f)}
          </Fragment>
        ))}
        {this.dropTarget?.kind === 'top' && this.dropTarget.index === this.fields.length && <div class="indicator" />}
      </div>
    );
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
}
