import { Component, Prop, Method, Event, EventEmitter, State, h } from '@stencil/core';
import type { FieldMeta, FieldType, FieldSubtype } from '../../../../form-core/src/types';

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

  private onTypeChange = (e: Event) => {
    const type = (e.target as HTMLSelectElement).value as FieldType;
    const patch: Partial<FieldMeta> = { type };
    if (type !== 'text') {
      patch.subtype = undefined;
      patch.restrictions = undefined;
    }
    this.localField = { ...this.localField!, ...patch, type };
    this.emitPatch(patch);
  };

  private onSubtypeChange = (e: Event) => {
    const subtype = (e.target as HTMLSelectElement).value as FieldSubtype;
    const patch: Partial<FieldMeta> = { subtype };
    if (subtype === 'number') {
      patch.restrictions = { number: { min: undefined, max: undefined, step: undefined }, text: undefined };
    } else {
      patch.restrictions = { number: undefined, text: { maxLength: undefined } };
    }
    this.localField = { ...this.localField!, ...patch, subtype };
    this.emitPatch(patch);
  };

  private onRestrictionInput = (key: string, e: Event) => {
    const value = (e.target as HTMLInputElement).value;
    const numVal = value === '' ? undefined : Number(value);
    const current = this.localField!.restrictions || {};
    const subtype = this.localField!.subtype || 'text';
    const patch: Partial<FieldMeta> = {
      restrictions: {
        ...current,
        [subtype]: { ...(current as any)[subtype], [key]: numVal },
      },
    };
    this.localField = { ...this.localField!, restrictions: patch.restrictions as any };
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
          <input
            class={{ 'input': true, 'input--error': !!this.labelError }}
            type="text"
            value={f.label}
            onInput={this.onLabelInput}
          />
          {this.labelError && <span class="error-text">{this.labelError}</span>}
        </label>

        <label class="field-group">
          <span class="field-label">Type</span>
          <select class="select" onChange={this.onTypeChange}>
            {(['text', 'select', 'date', 'checkbox'] as FieldType[]).map((t) => (
              <option value={t} selected={f.type === t}>{t}</option>
            ))}
          </select>
        </label>

        {isText && (
          <label class="field-group">
            <span class="field-label">Subtype</span>
            <select class="select" onChange={this.onSubtypeChange}>
              {(['text', 'number', 'email', 'tel'] as FieldSubtype[]).map((s) => (
                <option value={s} selected={subtype === s}>{s}</option>
              ))}
            </select>
          </label>
        )}

        {isText && subtype === 'number' && (
          <div class="restrictions">
            <label class="field-group">
              <span class="field-label">Min</span>
              <input class="input" type="number" value={restrictions.number?.min ?? ''} onInput={(e) => this.onRestrictionInput('min', e)} />
            </label>
            <label class="field-group">
              <span class="field-label">Max</span>
              <input class="input" type="number" value={restrictions.number?.max ?? ''} onInput={(e) => this.onRestrictionInput('max', e)} />
            </label>
            <label class="field-group">
              <span class="field-label">Step</span>
              <input class="input" type="number" value={restrictions.number?.step ?? ''} onInput={(e) => this.onRestrictionInput('step', e)} />
            </label>
          </div>
        )}

        {isText && subtype === 'text' && (
          <label class="field-group">
            <span class="field-label">Max Length</span>
            <input class="input" type="number" value={restrictions.text?.maxLength ?? ''} onInput={(e) => this.onRestrictionInput('maxLength', e)} />
          </label>
        )}
      </div>
    );
  }
}
