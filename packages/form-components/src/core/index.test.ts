import { describe, expect, it } from 'vitest';
import { evaluateRule } from './rules';
import type { FieldMeta, FieldSubtype, FieldType, JsonSchema, NumberRestrictions, Restrictions, TextRestrictions, TextSubtype, UiRule } from './types';
import { FormValidator } from './validator';

describe('FieldMeta model', () => {
  it('has the required base fields', () => {
    const field: FieldMeta = { id: 1, type: 'text', label: 'Name' };
    expect(field.id).toBe(1);
    expect(field.type).toBe('text');
    expect(field.label).toBe('Name');
  });

  it('accepts optional subtype and restrictions', () => {
    const field: FieldMeta = {
      id: 2,
      type: 'text',
      label: 'Age',
      subtype: 'number',
      restrictions: { number: { min: 0, max: 120, step: 1 } },
    };
    expect(field.subtype).toBe('number');
    expect(field.restrictions?.number?.min).toBe(0);
    expect(field.restrictions?.number?.max).toBe(120);
    expect(field.restrictions?.number?.step).toBe(1);
  });

  it('supports text restrictions with maxLength', () => {
    const field: FieldMeta = {
      id: 3,
      type: 'text',
      label: 'Email',
      subtype: 'text',
      restrictions: { text: { maxLength: 255 } },
    };
    expect(field.restrictions?.text?.maxLength).toBe(255);
  });

  it('maps number restrictions to JSON Schema keywords', () => {
    const nr: NumberRestrictions = { min: 1, max: 10, step: 2 };
    const schema = {
      minimum: nr.min,
      maximum: nr.max,
      multipleOf: nr.step,
    };
    expect(schema.minimum).toBe(1);
    expect(schema.maximum).toBe(10);
    expect(schema.multipleOf).toBe(2);
  });

  it('maps text maxLength to JSON Schema maxLength', () => {
    const tr: TextRestrictions = { maxLength: 100 };
    expect(tr.maxLength).toBe(100);
  });

  it('FieldType is one of the four base types', () => {
    const types: FieldType[] = ['text', 'select', 'date', 'checkbox'];
    expect(types).toHaveLength(4);
  });

  it('TextSubtype includes text, number, email, tel', () => {
    const subtypes: TextSubtype[] = ['text', 'number', 'email', 'tel'];
    expect(subtypes).toHaveLength(4);
  });

  it('FieldSubtype is assignable from TextSubtype', () => {
    const fs: FieldSubtype = 'number';
    expect(fs).toBe('number');
  });

  it('Restrictions can be empty', () => {
    const r: Restrictions = {};
    expect(r.number).toBeUndefined();
    expect(r.text).toBeUndefined();
  });

  it('accepts optional multiline presentation fields', () => {
    const field: FieldMeta = {
      id: 4,
      type: 'text',
      label: 'Notes',
      multiline: true,
      initialLines: 5,
      maxHeight: 200,
    };
    expect(field.multiline).toBe(true);
    expect(field.initialLines).toBe(5);
    expect(field.maxHeight).toBe(200);
  });

  it('defaults multiline options to undefined when omitted', () => {
    const field: FieldMeta = { id: 5, type: 'text', label: 'Name' };
    expect(field.multiline).toBeUndefined();
    expect(field.initialLines).toBeUndefined();
    expect(field.maxHeight).toBeUndefined();
  });
});

describe('FormValidator', () => {
  const schema: JsonSchema = {
    type: 'object',
    properties: {
      personal: {
        type: 'object',
        properties: {
          email: { type: 'string', format: 'email' },
          country: { type: 'string' },
        },
        required: ['email'],
      },
    },
  };

  it('passes valid data', () => {
    const v = new FormValidator(schema);
    const errors = v.validate({ personal: { email: 'a@b.com', country: 'CH' } });
    expect(errors).toEqual([]);
  });

  it('reports a missing required field', () => {
    const v = new FormValidator(schema);
    const errors = v.validate({ personal: { country: 'CH' } });
    expect(errors.length).toBeGreaterThan(0);
    expect(errors[0].path).toBe('/personal/email');
  });

  it('reports a bad format', () => {
    const v = new FormValidator(schema);
    const errors = v.validate({ personal: { email: 'not-an-email' } });
    expect(errors.some(e => e.message?.includes('format'))).toBe(true);
  });
});

describe('evaluateRule', () => {
  const rule: UiRule = {
    effect: 'SHOW',
    condition: { scope: '/personal/country', schema: { const: 'CH' } },
  };

  it('shows when condition matches', () => {
    expect(evaluateRule(rule, { personal: { country: 'CH' } })).toBe(true);
  });

  it('hides when condition does not match', () => {
    expect(evaluateRule(rule, { personal: { country: 'DE' } })).toBe(false);
  });

  it('is always true with no rule', () => {
    expect(evaluateRule(undefined, {})).toBe(true);
  });
});
