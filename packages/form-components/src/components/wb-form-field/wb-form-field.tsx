// biome-ignore lint/correctness/noUnusedImports: `h` is required by Stencil's JSX transform at runtime
import { AttachInternals, Component, h, Prop, State, Watch } from '@stencil/core';
import { Editor, type JSONContent } from '@tiptap/core';
import type { FieldSubtype, FieldType, Restrictions } from '../../core';
import { applyLink, buildExtensions, FULL_TOOLBAR_ACTIONS, isEmptyDoc, plainTextLength, removeLink, type ToolbarAction } from './richtext';

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
  @Prop() multiline = false;
  @Prop() initialLines?: number;
  @Prop() maxHeight?: number;
  /** Muted helper text shown while a richtext editor is empty (richtext only). */
  @Prop() placeholder?: string;
  /** When true, the control is rendered inert (not focusable/editable) but keeps its normal enabled appearance. */
  @Prop() disabled = false;

  @State() value = '';
  @State() checked = false;
  @State() private activeState: Record<string, boolean> = {};
  @State() private linkActive = false;
  @State() private linkEditing = false;
  @State() private linkError = '';

  private inputEl?: HTMLInputElement | HTMLTextAreaElement;
  private editor?: Editor;
  private editorHostEl?: HTMLDivElement;
  private linkInputEl?: HTMLInputElement;

  componentWillLoad() {
    this.sync();
  }

  componentDidLoad() {
    if (this.type === 'richtext' && !this.editor && this.editorHostEl) {
      this.editor = new Editor({
        element: this.editorHostEl,
        // Provider closure keeps placeholder edits (inspector) live after mount
        extensions: buildExtensions(() => this.placeholder ?? ''),
        editable: !this.disabled,
      });
      this.editor.on('transaction', () => {
        const next: Record<string, boolean> = {};
        for (const actionDef of FULL_TOOLBAR_ACTIONS) {
          next[actionDef.id] = actionDef.active(this.editor!);
        }
        this.activeState = next;
        this.linkActive = this.editor.isActive('link');
      });
      this.editor.on('update', () => this.sync());
    }
  }

  disconnectedCallback() {
    this.editor?.destroy();
    this.editor = undefined;
  }

  @Watch('value')
  @Watch('checked')
  @Watch('required')
  @Watch('restrictions')
  onValueChange() {
    this.sync();
  }

  @Watch('placeholder')
  onPlaceholderChange() {
    // The Placeholder extension caches decorations per doc/selection
    // transaction; force a re-scan so live edits to the prop show up.
    if (!this.editor) return;
    const { state } = this.editor;
    this.editor.view.dispatch(state.tr.setSelection(state.selection));
  }

  private sync() {
    let raw = this.type === 'checkbox' ? (this.checked ? 'on' : '') : this.value;
    let doc: JSONContent | undefined;
    if (this.type === 'richtext') {
      doc = this.editor?.getJSON() ?? { type: 'doc' };
      raw = isEmptyDoc(doc) ? '' : JSON.stringify(doc);
    }
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
        if (!Number.isNaN(num)) {
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

    // Rich text: overflow past maxLength is allowed while typing but flagged
    // as a custom error on every sync — plain-text count, markup excluded.
    if (raw && this.type === 'richtext' && doc) {
      const maxLength = this.restrictions?.text?.maxLength;
      if (maxLength !== undefined && plainTextLength(doc) > maxLength) {
        validity.customError = true;
        message = `${this.label} exceeds ${maxLength} characters`;
      }
    }

    if (typeof this.internals.setValidity === 'function') {
      const anchor = this.type === 'richtext' ? this.editorHostEl : this.inputEl;
      this.internals.setValidity(validity, message || undefined, anchor);
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
    if (this.type === 'richtext') {
      this.linkEditing = false;
      this.linkError = '';
      // clearContent triggers the editor's update → sync → setFormValue('');
      this.editor?.commands.clearContent();
    }
  }

  formDisabledCallback(disabled: boolean) {
    this.applyDisabled(disabled);
  }

  @Watch('disabled')
  onDisabledChange() {
    this.applyDisabled(this.disabled);
  }

  private applyDisabled(disabled: boolean) {
    this.disabled = disabled;
    if (this.type === 'richtext') {
      this.editor?.setEditable(!disabled);
      if (disabled) {
        this.linkEditing = false;
        this.linkError = '';
      }
    } else if (this.inputEl) {
      this.inputEl.disabled = disabled;
    }
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

  // ---- richtext -----------------------------------------------------------

  private runAction = (action: ToolbarAction) => {
    if (!this.editor || this.disabled) return;
    action.command(this.editor);
  };

  private openLinkInput = () => {
    if (!this.editor || this.disabled) return;
    this.linkError = '';
    this.linkEditing = true;
    queueMicrotask(() => this.linkInputEl?.focus());
  };

  private closeLinkInput = () => {
    this.linkEditing = false;
    this.linkError = '';
  };

  private onLinkApply = () => {
    if (!this.editor) return;
    const url = this.linkInputEl?.value ?? '';
    if (!applyLink(this.editor, url)) {
      this.linkError = 'Enter a valid URL';
      return;
    }
    this.closeLinkInput();
  };

  private onLinkRemove = () => {
    if (!this.editor) return;
    removeLink(this.editor);
    this.closeLinkInput();
  };

  private onLinkInputKeydown = (e: KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      this.onLinkApply();
    } else if (e.key === 'Escape') {
      e.preventDefault();
      this.closeLinkInput();
    }
  };

  private renderRichtext() {
    const currentHref = (this.editor?.getAttributes('link').href as string | undefined) ?? '';
    return (
      <div class="wb-field wb-field--richtext">
        <span class="wb-field__label">
          {this.label}
          {this.required && <span class="required-mark"> *</span>}
        </span>
        {/* Toolbar and linkbar stay mounted (hidden toggles) so the vdom diff
            never recreates the editor host div below and drops the Tiptap DOM. */}
        <div class="wb-richtext__toolbar" role="toolbar" hidden={this.disabled || undefined}>
          {FULL_TOOLBAR_ACTIONS.map(a => (
            <button type="button" key={a.id} title={a.title} class={{ 'wb-richtext__btn': true, 'is-active': !!this.activeState[a.id] }} onClick={() => this.runAction(a)}>
              {a.label}
            </button>
          ))}
          <button type="button" title="Link" class={{ 'wb-richtext__btn': true, 'is-active': this.linkActive }} onClick={this.openLinkInput}>
            Link
          </button>
        </div>
        <div class="wb-richtext__linkbar" hidden={!this.linkEditing || undefined}>
          <input type="text" placeholder="https://…" defaultValue={currentHref} ref={el => (this.linkInputEl = el)} onKeyDown={this.onLinkInputKeydown} />
          <button type="button" class="wb-richtext__btn" onClick={this.onLinkApply}>
            Apply
          </button>
          {this.linkActive && (
            <button type="button" class="wb-richtext__btn" onClick={this.onLinkRemove}>
              Remove
            </button>
          )}
          <button type="button" class="wb-richtext__btn" onClick={this.closeLinkInput}>
            Cancel
          </button>
          {this.linkError && <span class="wb-richtext__error">{this.linkError}</span>}
        </div>
        {/* Tiptap mounts itself into this div; Stencil never renders children into it */}
        <div class="wb-richtext__editor" ref={el => (this.editorHostEl = el)} />
      </div>
    );
  }

  render() {
    if (this.type === 'checkbox') {
      return (
        <label class="wb-field wb-field--checkbox">
          <input type="checkbox" ref={el => (this.inputEl = el)} checked={this.checked} disabled={this.disabled} onChange={this.onInput} />
          <span>
            {this.label}
            {this.required && <span class="required-mark"> *</span>}
          </span>
        </label>
      );
    }

    if (this.type === 'richtext') {
      return this.renderRichtext();
    }

    const inputType = this.getInputType();
    const isNumber = inputType === 'number';
    const r = isNumber ? this.restrictions?.number : undefined;
    const isMultiline = this.type === 'text' && (this.subtype || 'text') !== 'number' && this.multiline;
    const maxLength = !isNumber ? this.restrictions?.text?.maxLength : undefined;

    return (
      <label class="wb-field" htmlFor={this.name}>
        <span class="wb-field__label">
          {this.label}
          {this.required && <span class="required-mark"> *</span>}
        </span>
        {isMultiline ? (
          <textarea
            id={this.name}
            class="wb-field__textarea"
            ref={el => (this.inputEl = el)}
            rows={this.initialLines ?? 3}
            maxLength={maxLength}
            disabled={this.disabled}
            style={this.maxHeight ? { maxHeight: `${this.maxHeight}px` } : undefined}
            value={this.value}
            onInput={this.onInput}
          />
        ) : (
          <input
            id={this.name}
            type={inputType}
            ref={el => (this.inputEl = el)}
            min={r?.min !== undefined ? r.min : undefined}
            max={r?.max !== undefined ? r.max : undefined}
            step={r?.step !== undefined ? r.step : undefined}
            maxLength={maxLength}
            disabled={this.disabled}
            value={this.value}
            onInput={this.onInput}
          />
        )}
      </label>
    );
  }
}
