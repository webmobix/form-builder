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
  @Event() wbFieldRemoved: EventEmitter<{ id: number }>;

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
  async importState(fieldsOrState: FieldMeta[] | { fields: FieldMeta[]; nextId?: number }): Promise<void> {
    const fields = Array.isArray(fieldsOrState) ? fieldsOrState : fieldsOrState?.fields;
    const nextId = !Array.isArray(fieldsOrState) ? fieldsOrState?.nextId : undefined;
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
    uid = Math.max(uid, this.maxFieldIdDeep(normalized), (Number.isFinite(nextId) ? nextId : 1) - 1);
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
   * Remove the field with `id` anywhere in the tree (top level or nested
   * inside row-container columns). Deleting a row container removes its whole
   * `children` subtree. No-op when no field with that id exists. Never
   * decrements the id counter, so removed ids are never reused; the next id
   * can be peeked via [[getNextElementId]].
   *
   * Emits, in order: `wbFieldDeselected` (only when the removed id or an id
   * inside a removed subtree was selected), `wbFieldRemoved` with `{ id }`,
   * then `wbChange` with the updated field list.
   */
  @Method()
  async removeField(id: number) {
    // Selection is cleared when the removed element itself was selected OR
    // when it lived inside a container subtree being removed wholesale.
    const selectionCleared = this.selectedId !== null && (this.selectedId === id || this.subtreeContains(this.fields, id, this.selectedId));
    if (!this.removeFieldFromTree(this.fields, id)) return;
    this.fields = [...this.fields];
    if (this.draggingId === id) this.draggingId = null;
    if (this.dropTarget?.kind === 'column' && this.dropTarget.containerId === id) this.dropTarget = null;
    this.hoverIndex = null;
    if (selectionCleared) {
      this.selectedId = null;
      this.wbFieldDeselected.emit();
    }
    this.wbFieldRemoved.emit({ id });
    this.wbChange.emit(this.fields);
  }

  /** True when `findId` is a field inside the (sub)tree rooted at the field with `rootId`, including the root itself. */
  private subtreeContains(fields: FieldMeta[], rootId: number, findId: number): boolean {
    for (const f of fields) {
      if (f.id === rootId) return this.elementContains(f, findId);
      if (f.designType === 'row' && f.children) {
        for (const col of f.children) {
          if (this.subtreeContains(col, rootId, findId)) return true;
        }
      }
    }
    return false;
  }

  /** True when the subtree rooted at `field` contains a field with `id`. */
  private elementContains(field: FieldMeta, id: number): boolean {
    if (field.id === id) return true;
    if (field.children) {
      for (const col of field.children) {
        if (col.some(c => this.elementContains(c, id))) return true;
      }
    }
    return false;
  }

  /** Highest id in `fields`, walking nested row-container `children` columns. 0 when empty. */
  private maxFieldIdDeep(fields: FieldMeta[]): number {
    let max = 0;
    for (const f of fields) {
      max = Math.max(max, f.id);
      if (f.children) {
        for (const col of f.children) {
          max = Math.max(max, this.maxFieldIdDeep(col));
        }
      }
    }
    return max;
  }

  /**
   * Remove the field with `id` from `fields` (top level) or from any row
   * container's `children` columns. Returns true if a field was removed,
   * false otherwise. Mutates the array structure it is given (caller re-sets
   * state). Mirrors [[applyFieldPatch]]'s recursive walk.
   */
  private removeFieldFromTree(fields: FieldMeta[], id: number): boolean {
    const idx = fields.findIndex(f => f.id === id);
    if (idx !== -1) {
      fields.splice(idx, 1);
      return true;
    }
    for (const f of fields) {
      if (f.designType === 'row' && f.children) {
        for (const col of f.children) {
          if (this.removeFieldFromTree(col, id)) return true;
        }
      }
    }
    return false;
  }

  /** Returns the id the next insertion will mint, without consuming it. */
  @Method()
  async getNextElementId(): Promise<number> {
    return uid + 1;
  }

  /** Finds a field by id anywhere in the tree (top level or nested). */
  private findFieldDeep(fields: FieldMeta[], id: number): FieldMeta | undefined {
    for (const f of fields) {
      if (f.id === id) return f;
      if (f.children) {
        for (const col of f.children) {
          const found = this.findFieldDeep(col, id);
          if (found) return found;
        }
      }
    }
    return undefined;
  }

  /**
   * Compute the effective drop target for an internal (existing-element)
   * drag. Column containers are first-class targets mirroring the palette
   * flow; the cycle guard rejects containers inside the dragged element's
   * own subtree so a row container can never be dropped into itself.
   */
  private resolveInternalDropTarget(x: number, y: number, draggedId: number): DropTarget {
    const draggedField = this.findFieldDeep(this.fields, draggedId);
    if (draggedField && draggedField.designType === 'row') {
      const columnTarget = this.computeColumnDropTarget(x, y);
      if (columnTarget && !this.subtreeContains(this.fields, draggedId, columnTarget.containerId)) {
        return columnTarget;
      }
      return this.topLevelTarget(y);
    }
    const columnTarget = this.computeColumnDropTarget(x, y);
    if (columnTarget) return columnTarget;
    return this.topLevelTarget(y);
  }

  private topLevelTarget(y: number): Extract<DropTarget, { kind: 'top' }> {
    const index = this.getInsertionIndex(y);
    return { kind: 'top', index };
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
      // Index access instead of NodeList.item(): mock-doc's querySelectorAll
      // returns a plain array in unit tests; real NodeLists support both.
      const container = containers[ci];
      const cRect = container.getBoundingClientRect();
      if (y < cRect.top || y > cRect.bottom) continue;
      const containerId = Number(container.getAttribute('data-container-id'));
      const columns = container.querySelectorAll<HTMLElement>('[data-column]');
      for (let j = 0; j < columns.length; j++) {
        const col = columns[j];
        const colRect = col.getBoundingClientRect();
        if (x < colRect.left || x > colRect.right) continue;
        const childEls = col.querySelectorAll<HTMLElement>('[data-element-id]');
        let index = childEls.length;
        for (let k = 0; k < childEls.length; k++) {
          const r = childEls[k].getBoundingClientRect();
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
    // The remove button is a real button that handles its own keys; never
    // let it double-fire element selection.
    if ((e.target as HTMLElement).closest('[data-remove-id]')) return;
    e.preventDefault();
    this.selectedId = f.id;
    this.wbFieldSelected.emit(f);
  };

  private onGripPointerDown = (f: FieldMeta, e: PointerEvent) => {
    e.stopPropagation();
    this.selectedId = f.id;
    this.wbFieldSelected.emit(f);
    // Any rendered element (top-level or nested inside a row-container
    // column) participates in the drag flow; select-on-press stays.
    this.startDrag(f, e);
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
    if (target.closest('[data-remove-id]')) return;
    e.preventDefault();
    if (this.selectedId !== null) {
      this.selectedId = null;
      this.wbFieldDeselected.emit();
    }
  };

  private onRemoveClick = (id: number, e: MouseEvent) => {
    e.stopPropagation();
    this.removeField(id);
  };

  private onRemovePointerDown = (e: PointerEvent) => {
    // Keep the remove press from starting a grip/element drag.
    e.stopPropagation();
  };

  private onRemoveKeyDown = (id: number, e: KeyboardEvent) => {
    if (e.key !== 'Enter' && e.key !== ' ') return;
    e.stopPropagation();
    e.preventDefault();
    this.removeField(id);
  };

  private startDrag = (field: FieldMeta, e: PointerEvent) => {
    const handle = e.currentTarget as HTMLElement;
    handle.setPointerCapture(e.pointerId);
    this.draggingId = field.id;
    // Clear stale state from a previous/external drag so no indicator can
    // flash at drag start.
    this.hoverIndex = null;
    this.dropTarget = null;

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
      const rect = this.listEl?.getBoundingClientRect();
      // Off the canvas row list: no indicator, nothing commits (mirrors the
      // palette flow's out-of-list behavior).
      if (!rect || ev.clientY < rect.top || ev.clientY > rect.bottom) {
        this.dropTarget = null;
        this.hoverIndex = null;
        return;
      }
      // Column containers are first-class drop targets during internal
      // drags, mirroring the palette flow (setExternalHoverIndex). The
      // cycle guard (inside resolveInternalDropTarget) rejects containers
      // nested in the dragged element's own subtree.
      const target = this.resolveInternalDropTarget(ev.clientX, ev.clientY, field.id);
      this.dropTarget = target;
      this.hoverIndex = target.kind === 'top' ? target.index : null;
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
        <button
          type="button"
          class="remove-btn"
          title="Delete"
          aria-label="Delete element"
          data-remove-id={f.id}
          onClick={e => this.onRemoveClick(f.id, e)}
          onPointerDown={this.onRemovePointerDown}
          onKeyDown={e => this.onRemoveKeyDown(f.id, e)}
        >
          ×
        </button>
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
    const target = this.dropTarget;
    if (target?.kind === 'column') {
      // Move the dragged element into the targeted row column: capture it,
      // remove it from wherever it lives, re-resolve the container from the
      // updated tree, then insert at the recorded position. The element
      // keeps its id (no uid increment) so consumers see a stable identity.
      const item = this.findFieldDeep(this.fields, id);
      if (!item) return this.clearDragState();
      // Source column location (before removal) for the same-column index
      // adjustment below. removeFieldFromTree splices the inner column
      // array in place, so the index must be captured up front.
      const sourceContainer = this.findContainerOf(this.fields, id);
      const fields = [...this.fields];
      const srcIdx = sourceContainer?.children?.[target.colIndex]?.findIndex(f => f.id === id) ?? -1;
      if (!this.removeFieldFromTree(fields, id)) return this.clearDragState();
      const container = this.findFieldDeep(fields, target.containerId);
      if (!container) return this.clearDragState();
      // Same-column move: the removal shifted earlier indices down by one,
      // so compensate before splicing; clamp to bounds afterward. A move
      // that is a no-op after adjustment still emits wbChange for
      // consistency with the reorder path.
      let index = target.index;
      if (sourceContainer?.id === target.containerId && srcIdx !== -1 && srcIdx < index) {
        index -= 1;
      }
      const columns = container.columns ?? defaultColumns;
      const children = container.children ? container.children.map(col => [...col]) : Array.from({ length: columns }, () => [] as FieldMeta[]);
      index = Math.max(0, Math.min(index, children[target.colIndex].length));
      children[target.colIndex].splice(index, 0, item);
      container.children = children;
      this.fields = fields;
      this.wbChange.emit(this.fields);
      return this.clearDragState();
    }
    if (this.hoverIndex !== null) {
      const item = this.findFieldDeep(this.fields, id);
      if (!item) return this.clearDragState();
      const next = [...this.fields];
      let adj = this.hoverIndex;
      const from = this.fields.findIndex(f => f.id === id);
      if (from !== -1) {
        // Top-level source: removal shifts later indices left by one.
        next.splice(from, 1);
        adj = this.hoverIndex > from ? this.hoverIndex - 1 : this.hoverIndex;
      } else {
        // Source lives inside a container: remove it from the subtree;
        // top-level indices are unaffected by the removal.
        if (!this.removeFieldFromTree(next, id)) return this.clearDragState();
      }
      next.splice(adj, 0, item);
      this.fields = next;
      this.wbChange.emit(this.fields);
    }
    this.clearDragState();
  }

  /** The row container whose column stack directly holds the field with `id`, or undefined for top-level fields. */
  private findContainerOf(fields: FieldMeta[], id: number): (FieldMeta & { children: FieldMeta[][] }) | undefined {
    for (const f of fields) {
      if (f.children) {
        for (const col of f.children) {
          if (col.some(c => c.id === id)) return f as FieldMeta & { children: FieldMeta[][] };
          const nested = this.findContainerOf(col, id);
          if (nested) return nested;
        }
      }
    }
    return undefined;
  }

  private clearDragState() {
    if (this.ghostEl) this.ghostEl.remove();
    this.ghostEl = undefined;
    this.hoverIndex = null;
    this.dropTarget = null;
    this.draggingId = null;
  }
}
