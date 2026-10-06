import { describe, expect, it } from 'vitest';
import type { FieldMeta, InspectorExtension } from './types';

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

describe('FieldMeta metadata model', () => {
  it('carries independent metadata on a data field and a design element', () => {
    const dataField: FieldMeta = { id: 21, type: 'text', label: 'Email', metadata: { pii: true } };
    const designElement: FieldMeta = { id: 22, kind: 'design', type: 'text', label: 'Heading', metadata: { emphasis: false } };
    expect(dataField.metadata).toEqual({ pii: true });
    expect(designElement.metadata).toEqual({ emphasis: false });
    dataField.metadata!.pii = false;
    expect(dataField.metadata).toEqual({ pii: false });
    expect(designElement.metadata).toEqual({ emphasis: false });
  });

  it('is optional and absent by default', () => {
    const field: FieldMeta = { id: 23, type: 'text', label: 'Name' };
    expect(field.metadata).toBeUndefined();
  });
});

describe('InspectorExtension shape model', () => {
  it('accepts data and design sections with a checkbox entry', () => {
    const extension: InspectorExtension = {
      data: [{ title: 'Analytics', fields: [{ type: 'checkbox', key: 'pii', label: 'Contains PII', defaultState: true }] }],
      design: [{ fields: [{ type: 'checkbox', key: 'decorative', label: 'Decorative' }] }],
    };
    expect(extension.data).toHaveLength(1);
    expect(extension.data?.[0].title).toBe('Analytics');
    expect(extension.data?.[0].fields[0]).toEqual({ type: 'checkbox', key: 'pii', label: 'Contains PII', defaultState: true });
    expect(extension.design?.[0].fields[0].type).toBe('checkbox');
    expect(extension.design?.[0].fields[0].key).toBe('decorative');
  });
});
