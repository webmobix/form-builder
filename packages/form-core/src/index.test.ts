import { describe, it, expect } from 'vitest';
import { FormValidator } from './validator';
import { evaluateRule } from './rules';
import type { JsonSchema, UiRule } from './types';

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
    expect(errors.some((e) => e.message?.includes('format'))).toBe(true);
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
