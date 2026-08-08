// biome-ignore lint/correctness/noUnusedImports: `h` is required by Stencil's JSX transform at runtime
import { Component, Element, Event, type EventEmitter, h, Method, Prop, State } from '@stencil/core';
import type { FieldMeta } from '../../core';

@Component({
  tag: 'wb-form-renderer',
  styleUrl: 'wb-form-renderer.css',
  shadow: true,
})
export class WbFormRenderer {
  @Element() el: HTMLElement;

  @Prop({ mutable: true }) fields: FieldMeta[] = [];
  // biome-ignore lint/correctness/noUnusedPrivateClassMembers: incremented in setFields to force a re-render on prop mutation
  @State() private shadow: number = 0;

  @Event() wbSubmit: EventEmitter<Record<string, string>>;

  @Method()
  async setFields(fields: FieldMeta[]) {
    this.fields = fields;
    this.shadow++;
  }

  private handleSubmit = (e: Event) => {
    e.preventDefault();
    const form = this.el.shadowRoot!.querySelector('form')!;
    const fd = new FormData(form);
    const data: Record<string, string> = {};
    fd.forEach((value, key) => {
      data[key] = String(value);
    });
    this.wbSubmit.emit(data);
  };

  render() {
    return (
      <form onSubmit={this.handleSubmit}>
        <div class="fields">
          {this.fields.map(entry => (
            <wb-form-field
              key={entry.id}
              name={`field.${entry.id}`}
              label={entry.label}
              type={entry.type}
              subtype={entry.subtype}
              required={!!entry.required}
              restrictions={entry.restrictions}
              multiline={!!entry.multiline}
              initialLines={entry.initialLines}
              maxHeight={entry.maxHeight}
            />
          ))}
        </div>
        <div class="form-actions">
          <button type="submit">Submit</button>
          <button type="reset">Reset</button>
        </div>
      </form>
    );
  }
}
