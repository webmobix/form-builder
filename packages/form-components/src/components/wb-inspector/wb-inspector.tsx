// biome-ignore lint/correctness/noUnusedImports: `h` is required by Stencil's JSX transform at runtime
import { Component, Event, type EventEmitter, h, Method, Prop, State, Watch } from '@stencil/core';
import type { FieldMeta, InspectorCheckboxEntry, InspectorExtension } from '../../core';

function designDisplayName(designType?: FieldMeta['designType']): string {
  switch (designType) {
    case 'heading':
      return 'Title/Headline';
    case 'paragraph':
      return 'Paragraph';
    case 'row':
      return 'Row container';
    default:
      return 'Design element';
  }
}

@Component({
  tag: 'wb-inspector',
  styleUrl: 'wb-inspector.css',
  shadow: true,
})
export class WbInspector {
  @Prop({ mutable: true }) field: FieldMeta | null = null;
  @Prop() showDeleteFieldButton: boolean = true;
  /** Host-supplied per-element-kind extension controls. Set as a JS property or via `setExtension()`. */
  @Prop({ mutable: true }) extension?: InspectorExtension;
  @State() private localField: FieldMeta | null = null;
  @State() private labelError = '';

  @Event() wbFieldUpdated: EventEmitter<{ id: number; patch: Partial<FieldMeta> }>;
  @Event() wbInspectDelete: EventEmitter<{ id: number }>;

  @Method()
  async setField(field: FieldMeta | null) {
    this.field = field;
    this.localField = field ? { ...field } : null;
    this.labelError = '';
    this.seedMissingKeys();
  }

  @Method()
  async setExtension(shape?: InspectorExtension) {
    this.extension = shape;
  }

  @Watch('extension')
  onExtensionChange() {
    this.seedMissingKeys();
  }

  /**
   * Option A: on selection (and when the shape changes) seed every declared
   * checkbox key missing from `metadata` with its `defaultState`. Emits one
   * `wbFieldUpdated` with the complete map only when something was seeded.
   */
  private seedMissingKeys() {
    const f = this.localField;
    if (!f) return;
    const sections = this.declaredSections(f);
    if (sections.length === 0) return;
    const metadata = { ...(f.metadata ?? {}) };
    let changed = false;
    for (const section of sections) {
      for (const entry of section.fields) {
        if (entry.type !== 'checkbox') continue;
        if (metadata[entry.key] === undefined) {
          metadata[entry.key] = entry.defaultState ?? false;
          changed = true;
        }
      }
    }
    if (!changed) return;
    this.localField = { ...f, metadata };
    this.emitPatch({ metadata });
  }

  private declaredSections(f: FieldMeta) {
    const shape = this.extension;
    if (!shape) return [];
    return (f.kind === 'design' ? shape.design : shape.data) ?? [];
  }

  private checkboxChecked(entry: InspectorCheckboxEntry, f: FieldMeta): boolean {
    const value = f.metadata?.[entry.key];
    return value === undefined ? (entry.defaultState ?? false) : !!value;
  }

  private onExtensionToggle = (key: string, e: Event) => {
    const checked = (e.target as HTMLInputElement).checked;
    const metadata = { ...(this.localField?.metadata ?? {}), [key]: checked };
    this.localField = { ...this.localField!, metadata };
    this.emitPatch({ metadata });
  };

  private renderExtensionSections(f: FieldMeta) {
    const sections = this.declaredSections(f);
    if (sections.length === 0) return null;
    return sections.map((section, sectionIndex) => (
      // biome-ignore lint/suspicious/noArrayIndexKey: section titles are optional and may duplicate
      <div class="extension-section" key={sectionIndex}>
        {section.title && <h4 class="extension-section__title">{section.title}</h4>}
        {section.fields.map(entry =>
          entry.type === 'checkbox' ? (
            <label class="field-group field-group--checkbox" key={entry.key}>
              <input type="checkbox" class="checkbox" checked={this.checkboxChecked(entry, f)} onChange={e => this.onExtensionToggle(entry.key, e)} />
              <span class="field-label field-label--checkbox">{entry.label}</span>
            </label>
          ) : null,
        )}
      </div>
    ));
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

  private onPlaceholderInput = (e: Event) => {
    const value = (e.target as HTMLInputElement).value;
    const patch: Partial<FieldMeta> = value === '' ? { placeholder: undefined } : { placeholder: value };
    this.localField = { ...this.localField!, placeholder: patch.placeholder };
    this.emitPatch(patch);
  };

  private onParagraphTextInput = (e: Event) => {
    const value = (e.target as HTMLTextAreaElement).value;
    this.localField = { ...this.localField!, text: value };
    this.emitPatch({ text: value });
  };

  private onColumnsInput = (e: Event) => {
    const value = (e.target as HTMLInputElement).value.trim();
    const num = value === '' ? 1 : Number(value);
    const clamped = Math.max(1, Math.min(4, Number.isNaN(num) ? 1 : num));
    this.localField = { ...this.localField!, columns: clamped };
    this.emitPatch({ columns: clamped });
  };

  private updateOptions(options: { key: string; label: string }[]) {
    this.localField = { ...this.localField!, options };
    this.emitPatch({ options });
  }

  private onOptionLabelInput = (index: number, e: Event) => {
    const label = (e.target as HTMLInputElement).value;
    const options = (this.localField?.options ?? []).map((option, i) => (i === index ? { key: label, label } : option));
    this.updateOptions(options);
  };

  private onAddOption = () => {
    const options = [...(this.localField?.options ?? []), { key: '', label: '' }];
    this.updateOptions(options);
  };

  private onRemoveOption = (index: number) => {
    const options = (this.localField?.options ?? []).filter((_, i) => i !== index);
    this.updateOptions(options);
  };

  /**
   * Signal delete intent for the selected field. The inspector never mutates
   * canvas state; the host orchestrator forwards this to `canvas.removeField`.
   */
  private onDeleteClick = () => {
    if (!this.localField) return;
    this.wbInspectDelete.emit({ id: this.localField.id });
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
    if (f.kind === 'design') {
      return (
        <div class="inspector">
          <h3 class="title">Design Element Settings</h3>

          <label class="field-group">
            <span class="field-label">Label</span>
            <input class={{ input: true, 'input--error': !!this.labelError }} type="text" value={f.label} onInput={this.onLabelInput} />
            {this.labelError && <span class="error-text">{this.labelError}</span>}
          </label>

          <div class="field-group">
            <span class="field-label">Element</span>
            <span class="field-display">{designDisplayName(f.designType)}</span>
          </div>

          {f.designType === 'paragraph' && (
            <label class="field-group">
              <span class="field-label">Text</span>
              <textarea class="input" value={f.text ?? ''} onInput={this.onParagraphTextInput} />
            </label>
          )}

          {f.designType === 'row' && (
            <label class="field-group">
              <span class="field-label">Columns</span>
              <input class="input" type="number" min="1" max="4" value={f.columns ?? 2} onInput={this.onColumnsInput} />
            </label>
          )}

          {this.renderExtensionSections(f)}

          {this.showDeleteFieldButton !== false && (
            <button type="button" class="delete-btn" onClick={this.onDeleteClick}>
              Delete
            </button>
          )}
        </div>
      );
    }

    const isText = f.type === 'text';
    const isRichtext = f.type === 'richtext';
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
          <input type="checkbox" class="checkbox" checked={!!f.required} onChange={this.onRequiredChange} />
          <span class="field-label field-label--checkbox">Required</span>
        </label>

        {f.type === 'select' && (
          <div class="options-editor">
            <span class="field-label">Options</span>
            {(f.options ?? []).map((option, index) => (
              // biome-ignore lint/suspicious/noArrayIndexKey: option keys can be empty or duplicated while editing, so the index is the stable identity
              <div class="options-editor__row" key={index}>
                <input class="input" type="text" placeholder="Option label" value={option.label} onInput={e => this.onOptionLabelInput(index, e)} />
                <button type="button" class="options-editor__remove" title="Remove option" onClick={() => this.onRemoveOption(index)}>
                  Remove
                </button>
              </div>
            ))}
            <button type="button" class="options-editor__add" onClick={this.onAddOption}>
              Add option
            </button>
          </div>
        )}

        <label class="field-group">
          <span class="field-label">Placeholder</span>
          <input class="input" type="text" value={f.placeholder ?? ''} onInput={this.onPlaceholderInput} />
        </label>

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

        {((isText && subtype !== 'number') || isRichtext) && (
          <label class="field-group">
            <span class="field-label">Max Length</span>
            <input class="input" type="number" value={restrictions.text?.maxLength ?? ''} onInput={e => this.onRestrictionInput('maxLength', e)} />
          </label>
        )}

        {isText && subtype === 'text' && (
          <label class="field-group field-group--checkbox">
            <input type="checkbox" class="checkbox" checked={!!f.multiline} onChange={this.onMultilineChange} />
            <span class="field-label field-label--checkbox">Multiline</span>
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

        {this.renderExtensionSections(f)}

        {this.showDeleteFieldButton !== false && (
          <button type="button" class="delete-btn" onClick={this.onDeleteClick}>
            Delete
          </button>
        )}
      </div>
    );
  }
}
