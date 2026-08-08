import Ajv from 'ajv';
import type { UiRule } from './types';

const ajv = new Ajv({ strict: false });

/** Resolves a JSON Pointer ("/a/b") against a data object. */
function resolvePointer(data: unknown, pointer: string): unknown {
  if (!pointer || pointer === '/') return data;
  return pointer
    .split('/')
    .filter(Boolean)
    .reduce<unknown>((acc, key) => (acc && typeof acc === 'object' ? (acc as Record<string, unknown>)[key] : undefined), data);
}

/**
 * Returns whether the ruled element should currently be shown/enabled.
 * HIDE/DISABLE rules invert the condition's match; SHOW/ENABLE rules
 * match it directly. No rule => always visible/enabled.
 */
export function evaluateRule(rule: UiRule | undefined, data: unknown): boolean {
  if (!rule) return true;
  const value = resolvePointer(data, rule.condition.scope);
  const validate = ajv.compile(rule.condition.schema);
  const matches = validate(value);

  switch (rule.effect) {
    case 'SHOW':
    case 'ENABLE':
      return matches;
    case 'HIDE':
    case 'DISABLE':
      return !matches;
  }
}
