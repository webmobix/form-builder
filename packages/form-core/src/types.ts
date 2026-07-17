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

export type FieldType = 'text' | 'select' | 'date' | 'checkbox';

export type TextSubtype = 'text' | 'number' | 'email' | 'tel';

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

export interface FieldMeta {
  id: number;
  type: FieldType;
  label: string;
  subtype?: FieldSubtype;
  restrictions?: Restrictions;
}
