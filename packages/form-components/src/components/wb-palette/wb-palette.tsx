import { Component, Event, EventEmitter, h, State } from '@stencil/core';
import type { FieldType } from '@webmobix/form-core';

export interface FieldTypeDef {
  type: FieldType;
  label: string;
}

const FIELD_TYPES: FieldTypeDef[] = [
  { type: 'text', label: 'Text input' },
  { type: 'select', label: 'Dropdown' },
  { type: 'date', label: 'Date' },
  { type: 'checkbox', label: 'Checkbox' },
];

@Component({
  tag: 'wb-palette',
  styleUrl: 'wb-palette.css',
  shadow: true,
})
export class WbPalette {
  @Event() wbAddField: EventEmitter<FieldTypeDef>;
  @Event() wbPaletteDragStart: EventEmitter<FieldTypeDef>;
  @Event() wbPaletteDragMove: EventEmitter<{ clientX: number; clientY: number }>;
  @Event() wbPaletteDragEnd: EventEmitter<FieldTypeDef | null>;

  @State() dragging = false;

  private ghostEl?: HTMLDivElement;
  private draggedDef?: FieldTypeDef;
  private moved = false;
  private suppressClick = false;

  private isFinePointer(e: PointerEvent): boolean {
    return e.pointerType === 'mouse' || matchMedia('(pointer: fine)').matches;
  }

  private onPointerDown = (e: PointerEvent, def: FieldTypeDef) => {
    if (!this.isFinePointer(e)) return;
    e.preventDefault();
    const btn = e.currentTarget as HTMLElement;
    btn.setPointerCapture(e.pointerId);
    this.draggedDef = def;
    this.moved = false;
    this.dragging = true;
    this.suppressClick = true;

    const ghost = document.createElement('div');
    ghost.textContent = def.label;
    ghost.style.cssText =
      'position:fixed;left:0;top:0;pointer-events:none;z-index:999;background:#fff;' +
      'border:1px solid #2f6fed;border-radius:10px;padding:8px 12px;font-size:14px;' +
      `box-shadow:0 6px 16px rgba(0,0,0,0.2);transform:translate(${e.clientX - 20}px,${e.clientY - 16}px);`;
    document.body.appendChild(ghost);
    this.ghostEl = ghost;

    this.wbPaletteDragStart.emit(def);

    const onMove = (ev: PointerEvent) => {
      ev.preventDefault();
      this.moved = true;
      if (this.ghostEl) {
        this.ghostEl.style.transform = `translate(${ev.clientX - 20}px,${ev.clientY - 16}px)`;
      }
      this.wbPaletteDragMove.emit({ clientX: ev.clientX, clientY: ev.clientY });
    };

    const onEnd = () => {
      window.removeEventListener('pointermove', onMove);
      window.removeEventListener('pointerup', onEnd);
      window.removeEventListener('pointercancel', onEnd);
      if (this.ghostEl) this.ghostEl.remove();
      this.ghostEl = undefined;
      this.dragging = false;
      if (this.moved && this.draggedDef) {
        this.wbPaletteDragEnd.emit({ ...this.draggedDef });
      } else {
        this.wbPaletteDragEnd.emit(null);
      }
      this.draggedDef = undefined;
      setTimeout(() => { this.suppressClick = false; }, 0);
    };

    window.addEventListener('pointermove', onMove);
    window.addEventListener('pointerup', onEnd);
    window.addEventListener('pointercancel', onEnd);
  };

  render() {
    return (
      <div class="panel">
        {FIELD_TYPES.map((f) => (
          <button
            class={{ item: true, dragging: this.dragging }}
            key={f.type}
            onClick={() => { if (this.suppressClick) return; this.wbAddField.emit(f); }}
            onPointerDown={(e) => this.onPointerDown(e, f)}
          >
            {f.label}
          </button>
        ))}
      </div>
    );
  }
}
