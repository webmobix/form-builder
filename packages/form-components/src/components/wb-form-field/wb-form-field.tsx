import { Component, Prop, State, AttachInternals, Watch, h } from '@stencil/core';
import type { FieldType, FieldSubtype, Restrictions } from '@webmobix/form-core';

/**
 * Renders ONE field from the JSON Schema / UI Schema pair and participates
 * natively in an ancestor <form> via ElementInternals — confirmed working
 * inside shadow DOM (including native validation-bubble anchoring) in the
 * standalone spike this replaces.
 *
 * Multiple fields are namespaced by `name`, which should be the JSON
 * Pointer path from the schema (e.g. "personal.email"), not a bare label —
 * see the collision risk noted after the ElementInternals spike.
 */
@Component({
  tag: 'wb-form-field',
  styleUrl: 'wb-form-field.css',
  shadow: true,
  formAssociated: true,
})
export class WbFormField {
  @AttachInternals() internals: ElementInternals;

  /** JSON Pointer path used as the form-submission key, e.g. "personal.email" */
  @Prop() name!: string;
  @Prop() type: FieldType = 'text';
  @Prop() label!: string;
  @Prop() required = false;
  @Prop() subtype?: FieldSubtype;
  @Prop() restrictions?: Restrictions;

  @State() value = '';
  @State() checked = false;

  private inputEl?: HTMLInputElement;

  componentWillLoad() {
    this.sync();
  }

  @Watch('value')
  @Watch('checked')
  @Watch('required')
  onValueChange() {
    this.sync();
  }

  private sync() {
    const raw = this.type === 'checkbox' ? (this.checked ? 'on' : '') : this.value;
    const fd = new FormData();
    fd.append(this.name, raw);
    if (typeof this.internals.setFormValue === 'function') {
      this.internals.setFormValue(fd);
    }

    const validity: ValidityStateFlags = {};
    let message = '';

    if (this.required && !raw) {
      validity.valueMissing = true;
      message = `${this.label} is required`;
    }

    if (raw && this.type === 'text') {
      const subtype = this.subtype || 'text';
      if (subtype === 'number' && this.restrictions?.number) {
        const num = Number(raw);
        const r = this.restrictions.number;
        if (!isNaN(num)) {
          if (r.min !== undefined && num < r.min) {
            validity.rangeUnderflow = true;
            message = `${this.label} must be at least ${r.min}`;
          }
          if (r.max !== undefined && num > r.max) {
            validity.rangeOverflow = true;
            message = `${this.label} must be at most ${r.max}`;
          }
        }
      }
    }

    if (typeof this.internals.setValidity === 'function') {
      this.internals.setValidity(validity, message || undefined, this.inputEl);
    }
  }

  private onInput = (e: Event) => {
    const target = e.target as HTMLInputElement;
    if (this.type === 'checkbox') this.checked = target.checked;
    else this.value = target.value;
  };

  formResetCallback() {
    this.value = '';
    this.checked = false;
  }

  formDisabledCallback(disabled: boolean) {
    if (this.inputEl) this.inputEl.disabled = disabled;
  }

  private getInputType(): string {
    if (this.type === 'date') return 'date';
    if (this.type === 'checkbox') return 'checkbox';
    if (this.type === 'text') {
      const subtype = this.subtype || 'text';
      if (subtype === 'number') return 'number';
      return subtype;
    }
    return 'text';
  }

  render() {
    if (this.type === 'checkbox') {
      return (
        <label class="wb-field wb-field--checkbox">
          <input
            type="checkbox"
            ref={(el) => (this.inputEl = el)}
            checked={this.checked}
            onChange={this.onInput}
          />
          <span>{this.label}{this.required && <span class="required-mark"> *</span>}</span>
        </label>
      );
    }

    const inputType = this.getInputType();
    const isNumber = inputType === 'number';
    const r = isNumber ? this.restrictions?.number : undefined;

    return (
      <label class="wb-field">
        <span class="wb-field__label">{this.label}{this.required && <span class="required-mark"> *</span>}</span>
        <input
          type={inputType}
          ref={(el) => (this.inputEl = el)}
          min={r?.min !== undefined ? r.min : undefined}
          max={r?.max !== undefined ? r.max : undefined}
          step={r?.step !== undefined ? r.step : undefined}
          maxLength={!isNumber ? this.restrictions?.text?.maxLength : undefined}
          value={this.value}
          onInput={this.onInput}
        />
      </label>
    );
  }
}
