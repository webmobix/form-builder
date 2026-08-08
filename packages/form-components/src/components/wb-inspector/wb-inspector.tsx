// biome-ignore lint/correctness/noUnusedImports: `h` is required by Stencil's JSX transform at runtime
import { Component, Event, type EventEmitter, h, Method, Prop, State } from '@stencil/core';
import type { FieldMeta, FieldSubtype, FieldType } from '../../core';

function displayName(type: FieldType, subtype?: FieldSubtype): string {
  if (type === 'select') return 'Dropdown';
  if (type === 'date') return 'Date';
  if (type === 'checkbox') return 'Checkbox';
  switch (subtype) {
    case 'email':
      return 'Email';
    case 'url':
      return 'URL';
    case 'number':
      return 'Number';
    case 'password':
      return 'Password';
    case 'tel':
      return 'Telephone';
    default:
      return 'Text input';
  }
}

@Component({
  tag: 'wb-inspector',
  styleUrl: 'wb-inspector.css',
  shadow: true,
})
export class WbInspector {
  @Prop({ mutable: true }) field: FieldMeta | null = null;
  @State() private localField: FieldMeta | null = null;
  @State() private labelError = '';

  @Event() wbFieldUpdated: EventEmitter<{ id: number; patch: Partial<FieldMeta> }>;

  @Method()
  async setField(field: FieldMeta | null) {
    this.field = field;
    this.localField = field ? { ...field } : null;
    this.labelError = '';
  }

  private emitPatch(patch: Partial<FieldMeta>) {
    if (!this.localField) return;
    this.wbFieldUpdated.emit({ id: this.localField.id, patch });
  }

  private onLabelInput = (e: Event) => {
    const value = (e.target as HTMLInputElement).value;
    if (!value.trim()) {
      this.labelError = 'Label cannot be empty';
      return;
    }
    this.labelError = '';
    this.localField = { ...this.localField!, label: value };
    this.emitPatch({ label: value });
  };

  private onRequiredChange = (e: Event) => {
    const required = (e.target as HTMLInputElement).checked;
    this.localField = { ...this.localField!, required };
    this.emitPatch({ required });
  };

  private onRestrictionInput = (key: string, e: Event) => {
    const value = (e.target as HTMLInputElement).value;
    const numVal = value === '' ? undefined : Number(value);
    const current = this.localField!.restrictions || {};
    const subtype = this.localField!.subtype || 'text';
    const restriction = subtype === 'number' ? { ...current.number, [key]: numVal } : { ...current.text, [key]: numVal };
    const patch: Partial<FieldMeta> = {
      restrictions: {
        ...current,
        [subtype]: restriction,
      },
    };
    this.localField = { ...this.localField!, restrictions: patch.restrictions };
    this.emitPatch(patch);
  };

  private onMultilineChange = (e: Event) => {
    const multiline = (e.target as HTMLInputElement).checked;
    const patch: Partial<FieldMeta> = multiline ? { multiline: true } : { multiline: false, initialLines: undefined, maxHeight: undefined };
    this.localField = { ...this.localField!, ...patch };
    this.emitPatch(patch);
  };

  private onInitialLinesInput = (e: Event) => {
    const value = (e.target as HTMLInputElement).value.trim();
    const patch: Partial<FieldMeta> = value === '' || Number.isNaN(Number(value)) ? { initialLines: 3 } : { initialLines: Number(value) };
    this.localField = { ...this.localField!, ...patch };
    this.emitPatch(patch);
  };

  private onMaxHeightInput = (e: Event) => {
    const value = (e.target as HTMLInputElement).value.trim();
    const patch: Partial<FieldMeta> = value === '' ? { maxHeight: undefined } : { maxHeight: Number(value) };
    this.localField = { ...this.localField!, ...patch };
    this.emitPatch(patch);
  };

  render() {
    if (!this.localField) {
      return (
        <div class="inspector">
          <div class="empty-state">Select a field to edit its settings</div>
        </div>
      );
    }

    const f = this.localField;
    const isText = f.type === 'text';
    const subtype = f.subtype || 'text';
    const restrictions = f.restrictions || {};

    return (
      <div class="inspector">
        <h3 class="title">Field Settings</h3>

        <label class="field-group">
          <span class="field-label">Label</span>
          <input class={{ input: true, 'input--error': !!this.labelError }} type="text" value={f.label} onInput={this.onLabelInput} />
          {this.labelError && <span class="error-text">{this.labelError}</span>}
        </label>

        <label class="field-group field-group--checkbox">
          <span class="field-label">Required</span>
          <input type="checkbox" class="checkbox" checked={!!f.required} onChange={this.onRequiredChange} />
        </label>

        <div class="field-group">
          <span class="field-label">Field</span>
          <span class="field-display">{displayName(f.type, f.subtype)}</span>
        </div>

        {isText && subtype === 'number' && (
          <div class="restrictions">
            <label class="field-group">
              <span class="field-label">Min</span>
              <input class="input" type="number" value={restrictions.number?.min ?? ''} onInput={e => this.onRestrictionInput('min', e)} />
            </label>
            <label class="field-group">
              <span class="field-label">Max</span>
              <input class="input" type="number" value={restrictions.number?.max ?? ''} onInput={e => this.onRestrictionInput('max', e)} />
            </label>
            <label class="field-group">
              <span class="field-label">Step</span>
              <input class="input" type="number" value={restrictions.number?.step ?? ''} onInput={e => this.onRestrictionInput('step', e)} />
            </label>
          </div>
        )}

        {isText && subtype !== 'number' && (
          <label class="field-group">
            <span class="field-label">Max Length</span>
            <input class="input" type="number" value={restrictions.text?.maxLength ?? ''} onInput={e => this.onRestrictionInput('maxLength', e)} />
          </label>
        )}

        {isText && subtype === 'text' && (
          <label class="field-group field-group--checkbox">
            <span class="field-label">Multiline</span>
            <input type="checkbox" class="checkbox" checked={!!f.multiline} onChange={this.onMultilineChange} />
          </label>
        )}

        {isText && subtype === 'text' && f.multiline && (
          <div class="restrictions">
            <label class="field-group">
              <span class="field-label">Initial Lines</span>
              <input class="input" type="number" value={f.initialLines ?? 3} onInput={this.onInitialLinesInput} />
            </label>
            <label class="field-group">
              <span class="field-label">Max Height (px)</span>
              <input class="input" type="number" value={f.maxHeight ?? ''} onInput={this.onMaxHeightInput} />
            </label>
          </div>
        )}
      </div>
    );
  }
}
