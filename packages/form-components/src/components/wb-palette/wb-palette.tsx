// biome-ignore lint/correctness/noUnusedImports: `h` is required by Stencil's JSX transform at runtime
import { Component, Event, type EventEmitter, h, State } from '@stencil/core';
import type { DesignType, ElementKind, FieldSubtype, FieldType } from '../../core';

export interface FieldTypeDef {
  type?: FieldType;
  label: string;
  subtype?: FieldSubtype;
  kind?: ElementKind;
  designType?: DesignType;
}

const FIELD_TYPES: FieldTypeDef[] = [
  { type: 'text', subtype: 'text', label: 'Text input' },
  { type: 'text', subtype: 'email', label: 'Email' },
  { type: 'text', subtype: 'url', label: 'URL' },
  { type: 'text', subtype: 'number', label: 'Number' },
  { type: 'text', subtype: 'password', label: 'Password' },
  { type: 'select', label: 'Dropdown' },
  { type: 'date', label: 'Date' },
  { type: 'checkbox', label: 'Checkbox' },
  { type: 'richtext', label: 'Rich text' },
  { kind: 'design', designType: 'heading', label: 'Title/Headline' },
  { kind: 'design', designType: 'paragraph', label: 'Paragraph' },
  { kind: 'design', designType: 'row', label: 'Row container' },
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
  private startX = 0;
  private startY = 0;

  private readonly DRAG_THRESHOLD = 5;

  private isFinePointer(e: PointerEvent): boolean {
    return e.pointerType === 'mouse' || matchMedia('(pointer: fine)').matches;
  }

  private beginDrag(e: PointerEvent, def: FieldTypeDef) {
    if (this.dragging) return;
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
  }

  private onPointerDown = (e: PointerEvent, def: FieldTypeDef) => {
    if (!this.isFinePointer(e)) return;
    e.preventDefault();
    const btn = e.currentTarget as HTMLElement;
    btn.setPointerCapture(e.pointerId);
    this.draggedDef = def;
    this.moved = false;
    this.dragging = false;
    this.suppressClick = false;
    this.startX = e.clientX;
    this.startY = e.clientY;

    const onMove = (ev: PointerEvent) => {
      ev.preventDefault();
      if (!this.dragging) {
        const dx = ev.clientX - this.startX;
        const dy = ev.clientY - this.startY;
        if (dx * dx + dy * dy < this.DRAG_THRESHOLD * this.DRAG_THRESHOLD) return;
        this.beginDrag(ev, def);
      }
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
      if (this.dragging) {
        if (this.moved && this.draggedDef) {
          this.wbPaletteDragEnd.emit({ ...this.draggedDef });
        } else {
          this.wbPaletteDragEnd.emit(null);
        }
      }
      this.dragging = false;
      this.draggedDef = undefined;
    };

    window.addEventListener('pointermove', onMove);
    window.addEventListener('pointerup', onEnd);
    window.addEventListener('pointercancel', onEnd);
  };

  render() {
    return (
      <div class="panel">
        {FIELD_TYPES.map(f => (
          <button
            type="button"
            class={{ item: true, dragging: this.dragging }}
            key={f.label}
            onClick={() => {
              if (this.suppressClick) return;
              this.wbAddField.emit(f);
            }}
            onPointerDown={e => this.onPointerDown(e, f)}
          >
            {f.label}
          </button>
        ))}
      </div>
    );
  }
}
