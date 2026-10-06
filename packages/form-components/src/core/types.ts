// Minimal JSON Schema surface we rely on directly (full schemas can carry
// any valid JSON Schema keyword — ajv handles those; these are just the
// ones form-core reads to drive layout/labels without re-parsing ajv's
// internal representation).
export interface JsonSchema {
  type?: string;
  title?: string;
  properties?: Record<string, JsonSchema>;
  required?: string[];
  enum?: unknown[];
  [key: string]: unknown;
}

export type UiEffect = 'SHOW' | 'HIDE' | 'ENABLE' | 'DISABLE';

export interface UiRule {
  effect: UiEffect;
  condition: {
    /** JSON Pointer into the data, e.g. "/personal/country" */
    scope: string;
    schema: JsonSchema;
  };
}

export interface UiControl {
  type: 'Control';
  /** JSON Pointer into the data schema this control renders, e.g. "/personal/email" */
  scope: string;
  label?: string;
  rule?: UiRule;
}

export interface UiLayout {
  type: 'VerticalLayout' | 'HorizontalLayout';
  elements: UiSchemaElement[];
  rule?: UiRule;
}

export type UiSchemaElement = UiControl | UiLayout;

export interface FormDefinition {
  dataSchema: JsonSchema;
  uiSchema: UiSchemaElement;
}

export type FieldType = 'text' | 'select' | 'date' | 'checkbox' | 'richtext';

export type TextSubtype = 'text' | 'number' | 'email' | 'tel' | 'url' | 'password';

export type FieldSubtype = TextSubtype;

export interface NumberRestrictions {
  min?: number;
  max?: number;
  step?: number;
}

export interface TextRestrictions {
  maxLength?: number;
}

export interface Restrictions {
  number?: NumberRestrictions;
  text?: TextRestrictions;
}

export type ElementKind = 'data' | 'design';
export type DesignType = 'heading' | 'paragraph' | 'row';

export interface FieldMeta {
  id: number;
  kind?: ElementKind;
  type: FieldType;
  label: string;
  subtype?: FieldSubtype;
  required?: boolean;
  restrictions?: Restrictions;
  multiline?: boolean;
  initialLines?: number;
  maxHeight?: number;
  /**
   * Presentation-only hint text for all fillable data field types
   * (`text` in all subtypes, `select`, `date`, `checkbox`, `richtext`).
   * Rendered per control type (native attribute, hint option, or muted
   * helper text) and never participates in validation or the submit payload.
   */
  placeholder?: string;
  /** Ordered list of selectable choices for a `select` (Dropdown) field. The editor UI uses the same value for `key` and `label`. */
  options?: { key: string; label: string }[];
  designType?: DesignType;
  text?: string;
  columns?: number;
  children?: FieldMeta[][];
  /**
   * Presentation-only extension data owned by the host and keyed by each
   * `InspectorExtension` entry's `key`. It is ignored by validation and by
   * `wb-form-renderer`, does not change the submitted value, and is preserved
   * across canvas patches and export/import. Omitted for elements with no
   * extension values.
   */
  metadata?: Record<string, unknown>;
}

/**
 * A single host-declared inspector control. The `type` discriminator keeps the
 * union open: future entry kinds are added as new members without changing the
 * section or shape structure.
 */
export interface InspectorCheckboxEntry {
  type: 'checkbox';
  /** Metadata key this entry reads from and writes to (`metadata[key]`). */
  key: string;
  label: string;
  /** Value seeded when the key is missing; absent means `false` (unchecked). */
  defaultState?: boolean;
}

export type InspectorExtensionEntry = InspectorCheckboxEntry;

/** An ordered group of extension entries rendered under an optional heading. */
export interface InspectorExtensionSection {
  title?: string;
  fields: InspectorExtensionEntry[];
}

/** Host-supplied extension controls, split by element kind. */
export interface InspectorExtension {
  /** Sections rendered for data elements (`kind` absent or `'data'`). */
  data?: InspectorExtensionSection[];
  /** Sections rendered for design-only elements (`kind === 'design'`). */
  design?: InspectorExtensionSection[];
}

export const defaultColumns = 2;

export function isDesignElement(f: FieldMeta): f is FieldMeta & { kind: 'design' } {
  return f.kind === 'design';
}

export function isDataElement(f: FieldMeta): f is FieldMeta & { kind?: 'data' } {
  return f.kind !== 'design';
}
