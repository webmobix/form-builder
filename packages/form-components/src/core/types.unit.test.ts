import { describe, expect, it } from 'vitest';
import type { FieldMeta } from './types';

describe('FieldMeta options model', () => {
  it('accepts and carries options for a select field', () => {
    const field: FieldMeta = {
      id: 9,
      type: 'select',
      label: 'Country',
      options: [
        { key: 'us', label: 'US' },
        { key: 'ca', label: 'CA' },
        { key: 'mx', label: 'MX' },
      ],
    };
    expect(field.options).toHaveLength(3);
    expect(field.options?.[0]).toEqual({ key: 'us', label: 'US' });
    expect(field.options?.[2]).toEqual({ key: 'mx', label: 'MX' });
  });

  it('omits options for non-select fields', () => {
    const field: FieldMeta = { id: 10, type: 'text', label: 'Name' };
    expect(field.options).toBeUndefined();
  });

  it('omits options when not provided on a select field', () => {
    const field: FieldMeta = { id: 11, type: 'select', label: 'Country' };
    expect(field.options).toBeUndefined();
  });
});
