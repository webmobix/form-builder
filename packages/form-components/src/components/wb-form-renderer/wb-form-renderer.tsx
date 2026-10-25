// biome-ignore lint/correctness/noUnusedImports: `h` is required by Stencil's JSX transform at runtime
import { Component, Element, Event, type EventEmitter, h, Method, Prop, State, Watch } from '@stencil/core';
import { defaultColumns, type FieldMeta } from '../../core';

/** Submission name of a data field, matching the `wbSubmit` payload keys. */
const submissionName = (id: number) => `field.${id}`;

/**
 * Normalize a prefill object to the wire shape (`Record<string, string>`):
 * primitive non-strings are coerced with `String()`, while `null`/`undefined`
 * entries are treated as absent so they never render as the text "null".
 */
function normalizeValues(values?: Record<string, string>): Record<string, string> {
  const normalized: Record<string, string> = {};
  if (!values) return normalized;
  for (const [key, raw] of Object.entries(values)) {
    if (raw === null || raw === undefined) continue;
    normalized[key] = typeof raw === 'string' ? raw : String(raw);
  }
  return normalized;
}

/** Collects the submission names of every data field, row-container children included. */
function collectSubmissionNames(entries: FieldMeta[], names: Set<string>): void {
  for (const entry of entries) {
    if (entry.kind === 'design') {
      if (entry.designType === 'row') {
        for (const column of entry.children ?? []) collectSubmissionNames(column, names);
      }
      continue;
    }
    names.add(submissionName(entry.id));
  }
}

@Component({
  tag: 'wb-form-renderer',
  styleUrl: 'wb-form-renderer.css',
  shadow: true,
})
export class WbFormRenderer {
  @Element() el: HTMLElement;

  @Prop({ mutable: true }) fields: FieldMeta[] = [];
  /**
   * Prefill values keyed by each data field's submission name (`field.<id>`) —
   * the same shape `wbSubmit` emits, so a saved payload can be passed back
   * verbatim. Applied on first render and whenever this object changes.
   */
  @Prop({ mutable: true }) values?: Record<string, string>;
  // biome-ignore lint/correctness/noUnusedPrivateClassMembers: incremented in setFields to force a re-render on prop mutation
  @State() private shadow: number = 0;

  // Unknown prefill keys already reported for the current values object, so a
  // re-render never repeats a warning.
  private warnedKeys = new Set<string>();
  private warnedFor?: Record<string, string>;

  @Event() wbSubmit: EventEmitter<Record<string, string>>;

  @Method()
  async setFields(fields: FieldMeta[]) {
    this.fields = fields;
    this.shadow++;
  }

  /** Applies a prefill object imperatively, equivalent to setting `values`. */
  @Method()
  async setValues(values: Record<string, string>) {
    this.values = values;
    this.shadow++;
  }

  componentDidLoad() {
    this.reportIgnoredValues();
  }

  @Watch('values')
  onValuesChange() {
    this.reportIgnoredValues();
  }

  /**
   * Warn about prefill keys that match no rendered data field (unknown ids,
   * design elements, stale fields). Ignored keys never reach the form. Warning
   * output is deduplicated per prefill application and skipped while `fields`
   * is empty, so setting `values` before `fields` stays quiet.
   */
  private reportIgnoredValues() {
    if (this.values !== this.warnedFor) {
      this.warnedFor = this.values;
      this.warnedKeys.clear();
    }
    if (this.fields.length === 0) return;
    const known = new Set<string>();
    collectSubmissionNames(this.fields, known);
    for (const key of Object.keys(normalizeValues(this.values))) {
      if (known.has(key) || this.warnedKeys.has(key)) continue;
      this.warnedKeys.add(key);
      console.warn(`<wb-form-renderer>: ignoring prefill value for unknown field "${key}"`);
    }
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

  private renderEntry(entry: FieldMeta, values: Record<string, string>) {
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
                {(children[colIndex] ?? []).map(child => this.renderEntry(child, values))}
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
        name={submissionName(entry.id)}
        initialValue={values[submissionName(entry.id)]}
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
    const values = normalizeValues(this.values);
    return (
      <form onSubmit={this.handleSubmit}>
        <div class="fields">{this.fields.map(entry => this.renderEntry(entry, values))}</div>
        <div class="form-actions">
          <button type="submit">Submit</button>
          <button type="reset">Reset</button>
        </div>
      </form>
    );
  }
}
