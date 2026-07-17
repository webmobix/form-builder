import { Component, Event, EventEmitter, h } from '@stencil/core';
import type { FieldType } from '../wb-form-field/wb-form-field';

interface FieldTypeDef {
  type: FieldType;
  label: string;
}

const FIELD_TYPES: FieldTypeDef[] = [
  { type: 'text', label: 'Text input' },
  { type: 'select', label: 'Dropdown' },
  { type: 'date', label: 'Date' },
  { type: 'checkbox', label: 'Checkbox' },
];

/**
 * Tap-to-add palette. This is the interaction validated in the mobile
 * FAB-and-sheet spike (tap a type, it's appended to the canvas) — it works
 * identically here whether triggered by a real FAB/sheet shell on mobile or
 * a plain click on desktop.
 *
 * Desktop drag-from-palette straight onto the canvas (the cross-shadow-
 * boundary drag validated in the first spike) is intentionally not wired up
 * yet — worth adding once the tap-to-add path is confirmed against real
 * form-core schema output, since it's an enhancement layered on the same
 * wbAddField event rather than a different data path.
 */
@Component({
  tag: 'wb-palette',
  styleUrl: 'wb-palette.css',
  shadow: true,
})
export class WbPalette {
  @Event() wbAddField: EventEmitter<FieldTypeDef>;

  render() {
    return (
      <div class="panel">
        {FIELD_TYPES.map((f) => (
          <button class="item" key={f.type} onClick={() => this.wbAddField.emit(f)}>
            {f.label}
          </button>
        ))}
      </div>
    );
  }
}
