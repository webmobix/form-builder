// biome-ignore lint/correctness/noUnusedImports: `h` is required by Stencil's JSX transform at runtime
import { Component, Element, Event, type EventEmitter, h, Method, Prop, State } from '@stencil/core';
import { defaultColumns, type FieldMeta } from '../../core';

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

  private renderEntry(entry: FieldMeta) {
    if (entry.kind === 'design') {
      if (entry.designType === 'heading') {
        return <h2 key={entry.id}>{entry.label}</h2>;
      }
      if (entry.designType === 'paragraph') {
        return <p key={entry.id}>{entry.text ?? entry.label}</p>;
      }
      if (entry.designType === 'row') {
        const columns = entry.columns ?? defaultColumns;
        const children = entry.children ?? [];
        return (
          <div class="row-container" key={entry.id}>
            {Array.from({ length: columns }, (_, colIndex) => (
              // biome-ignore lint/suspicious/noArrayIndexKey: columns are a fixed-size flex layout; column index is the stable identity
              <div class="column" key={colIndex}>
                {(children[colIndex] ?? []).map(child => this.renderEntry(child))}
              </div>
            ))}
          </div>
        );
      }
      return null;
    }
    return (
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
        placeholder={entry.placeholder}
        options={entry.options}
      />
    );
  }

  render() {
    return (
      <form onSubmit={this.handleSubmit}>
        <div class="fields">{this.fields.map(entry => this.renderEntry(entry))}</div>
        <div class="form-actions">
          <button type="submit">Submit</button>
          <button type="reset">Reset</button>
        </div>
      </form>
    );
  }
}
