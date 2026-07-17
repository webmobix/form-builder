import { Component, Prop, State, AttachInternals, Watch, h } from '@stencil/core';

export type FieldType = 'text' | 'select' | 'date' | 'checkbox';

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

  @State() value = '';
  @State() checked = false;

  private inputEl?: HTMLInputElement;

  componentWillLoad() {
    this.sync();
  }

  @Watch('value')
  @Watch('checked')
  onValueChange() {
    this.sync();
  }

  private sync() {
    const raw = this.type === 'checkbox' ? (this.checked ? 'on' : '') : this.value;
    const fd = new FormData();
    fd.append(this.name, raw);
    this.internals.setFormValue(fd);

    if (this.required && !raw) {
      this.internals.setValidity({ valueMissing: true }, `${this.label} is required`, this.inputEl);
    } else {
      this.internals.setValidity({});
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
          <span>{this.label}</span>
        </label>
      );
    }

    return (
      <label class="wb-field">
        <span class="wb-field__label">{this.label}</span>
        <input
          type={this.type === 'date' ? 'date' : 'text'}
          ref={(el) => (this.inputEl = el)}
          value={this.value}
          onInput={this.onInput}
        />
      </label>
    );
  }
}
