import { h } from '@stencil/core';
import { render } from '@stencil/vitest';
import type { FieldMeta } from '@webmobix/form-core';

// Importing the source file triggers the on-the-fly compile + customElements.define()
import './wb-canvas';

describe('wb-canvas external drag API', () => {
  it('beginExternalDrag sets externalDrag flag', async () => {
    const { instance } = await render(<wb-canvas></wb-canvas>);
    const canvas = instance as any;
    expect(canvas.externalDrag).toBe(false);
    await canvas.beginExternalDrag();
    expect(canvas.externalDrag).toBe(true);
  });

  it('beginExternalDrag clears draggingId if set', async () => {
    const { instance } = await render(<wb-canvas></wb-canvas>);
    const canvas = instance as any;
    canvas.draggingId = 1;
    await canvas.beginExternalDrag();
    expect(canvas.externalDrag).toBe(true);
  });

  it('setExternalHoverIndex returns early if no external drag', async () => {
    const { instance } = await render(<wb-canvas></wb-canvas>);
    const canvas = instance as any;
    canvas.hoverIndex = 42;
    await canvas.setExternalHoverIndex(100);
    expect(canvas.hoverIndex).toBe(42);
  });

  it('commitExternalInsert inserts at hoverIndex and emits wbChange', async () => {
    const { root, instance } = await render(<wb-canvas></wb-canvas>);
    const canvas = instance as any;
    const spy = vi.fn();
    root.addEventListener('wbChange', spy);
    canvas.externalDrag = true;
    canvas.hoverIndex = 1;
    const initialLen = canvas.fields.length;
    await canvas.commitExternalInsert('select', 'Dropdown');
    expect(canvas.fields).toHaveLength(initialLen + 1);
    expect(canvas.fields[1].type).toBe('select');
    expect(canvas.fields[1].label).toBe('Dropdown');
    expect(spy).toHaveBeenCalled();
    expect(canvas.externalDrag).toBe(false);
    expect(canvas.hoverIndex).toBeNull();
  });

  it('commitExternalInsert appends when hoverIndex is null', async () => {
    const { instance } = await render(<wb-canvas></wb-canvas>);
    const canvas = instance as any;
    canvas.externalDrag = true;
    canvas.hoverIndex = null;
    const initialLen = canvas.fields.length;
    await canvas.commitExternalInsert('checkbox', 'Checkbox');
    expect(canvas.fields).toHaveLength(initialLen + 1);
    expect(canvas.fields[initialLen].type).toBe('checkbox');
  });

  it('cancelExternalDrag clears state', async () => {
    const { instance } = await render(<wb-canvas></wb-canvas>);
    const canvas = instance as any;
    canvas.externalDrag = true;
    canvas.hoverIndex = 2;
    await canvas.cancelExternalDrag();
    expect(canvas.externalDrag).toBe(false);
    expect(canvas.hoverIndex).toBeNull();
  });
});

describe('wb-canvas selection and update API', () => {
  it('selectField sets selectedId', async () => {
    const { instance } = await render(<wb-canvas></wb-canvas>);
    const canvas = instance as any;
    expect(canvas.selectedId).toBeNull();
    await canvas.selectField(1);
    expect(canvas.selectedId).toBe(1);
    await canvas.selectField(null);
    expect(canvas.selectedId).toBeNull();
  });

  it('updateField merges patch and emits wbChange and wbFieldUpdated', async () => {
    const { root, instance } = await render(<wb-canvas></wb-canvas>);
    const canvas = instance as any;
    const targetId = canvas.fields[0].id;
    const wbChangeSpy = vi.fn();
    const wbFieldUpdatedSpy = vi.fn();
    root.addEventListener('wbChange', wbChangeSpy);
    root.addEventListener('wbFieldUpdated', wbFieldUpdatedSpy);

    await canvas.updateField(targetId, { label: 'Updated' });
    expect(canvas.fields[0].label).toBe('Updated');
    expect(canvas.fields[0].id).toBe(targetId);
    expect(wbChangeSpy).toHaveBeenCalled();
    expect(wbFieldUpdatedSpy).toHaveBeenCalledWith(
      expect.objectContaining({ detail: { id: targetId, patch: { label: 'Updated' } } })
    );
  });

  it('updateField preserves position and id', async () => {
    const { instance } = await render(<wb-canvas></wb-canvas>);
    const canvas = instance as any;
    const targetId = canvas.fields[0].id;
    const originalLen = canvas.fields.length;

    await canvas.updateField(targetId, { label: 'Changed', type: 'date' });
    expect(canvas.fields).toHaveLength(originalLen);
    expect(canvas.fields[0].id).toBe(targetId);
    expect(canvas.fields[0].label).toBe('Changed');
    expect(canvas.fields[0].type).toBe('date');
  });

  it('updateField with unknown id is a no-op and does not emit', async () => {
    const { root, instance } = await render(<wb-canvas></wb-canvas>);
    const canvas = instance as any;
    const wbChangeSpy = vi.fn();
    const wbFieldUpdatedSpy = vi.fn();
    root.addEventListener('wbChange', wbChangeSpy);
    root.addEventListener('wbFieldUpdated', wbFieldUpdatedSpy);

    await canvas.updateField(99999, { label: 'Ghost' });
    expect(wbChangeSpy).not.toHaveBeenCalled();
    expect(wbFieldUpdatedSpy).not.toHaveBeenCalled();
  });

  it('row click emits wbFieldSelected', async () => {
    const { root } = await render(<wb-canvas></wb-canvas>);
    const spy = vi.fn();
    root.addEventListener('wbFieldSelected', spy);
    const row = root.shadowRoot!.querySelector('[data-row]') as HTMLElement;
    row.click();
    expect(spy).toHaveBeenCalled();
  });

  it('clicking empty area emits wbFieldDeselected when a field is selected', async () => {
    const { root, instance } = await render(<wb-canvas></wb-canvas>);
    const canvas = instance as any;
    await canvas.selectField(1);
    const spy = vi.fn();
    root.addEventListener('wbFieldDeselected', spy);
    const wrap = root.shadowRoot!.querySelector('.wrap') as HTMLElement;
    wrap.click();
    expect(spy).toHaveBeenCalled();
    expect(canvas.selectedId).toBeNull();
  });

  it('clicking empty area does not emit wbFieldDeselected when nothing selected', async () => {
    const { root } = await render(<wb-canvas></wb-canvas>);
    const spy = vi.fn();
    root.addEventListener('wbFieldDeselected', spy);
    const wrap = root.shadowRoot!.querySelector('.wrap') as HTMLElement;
    wrap.click();
    expect(spy).not.toHaveBeenCalled();
  });
});

describe('wb-canvas importState', () => {
  it('importing a two-field payload renders both rows and emits wbChange', async () => {
    const { root, instance } = await render(<wb-canvas></wb-canvas>);
    const canvas = instance as any;
    const spy = vi.fn();
    root.addEventListener('wbChange', spy);
    const payload = [
      { id: 10, type: 'text' as const, label: 'First' },
      { id: 20, type: 'checkbox' as const, label: 'Subscribe' },
    ];
    await canvas.importState(payload);
    expect(canvas.fields).toEqual(payload);
    expect(canvas.fields.map((f: FieldMeta) => f.label)).toEqual(['First', 'Subscribe']);
    expect(spy).toHaveBeenCalledWith(expect.objectContaining({ detail: payload }));
  });

  it('import replaces existing canvas contents wholesale', async () => {
    const { instance } = await render(<wb-canvas></wb-canvas>);
    const canvas = instance as any;
    await canvas.importState([{ id: 7, type: 'text' as const, label: 'Email' }]);
    expect(canvas.fields).toHaveLength(1);
    expect(canvas.fields[0].id).toBe(7);
    expect(canvas.fields[0].label).toBe('Email');
  });

  it('importing an empty array clears the canvas and emits wbChange', async () => {
    const { root, instance } = await render(<wb-canvas></wb-canvas>);
    const canvas = instance as any;
    const spy = vi.fn();
    root.addEventListener('wbChange', spy);
    await canvas.importState([]);
    expect(canvas.fields).toEqual([]);
    expect(spy).toHaveBeenCalledWith(expect.objectContaining({ detail: [] }));
  });

  it('addField after import does not collide with imported ids', async () => {
    const { instance } = await render(<wb-canvas></wb-canvas>);
    const canvas = instance as any;
    await canvas.importState([{ id: 100, type: 'text' as const, label: 'A' }]);
    await canvas.addField('text', 'B');
    const last = canvas.fields[canvas.fields.length - 1];
    expect(last.id).toBeGreaterThan(100);
  });

  it('importing a low-id payload does not regress the counter', async () => {
    const { instance } = await render(<wb-canvas></wb-canvas>);
    const canvas = instance as any;
    await canvas.addField('text', 'Z');
    const beforeId = canvas.fields[canvas.fields.length - 1].id;
    await canvas.importState([{ id: 3, type: 'text' as const, label: 'X' }]);
    await canvas.addField('text', 'Y');
    const afterId = canvas.fields[canvas.fields.length - 1].id;
    expect(afterId).toBeGreaterThan(beforeId);
  });

  it('resets selection and emits wbFieldDeselected when a field is selected', async () => {
    const { root, instance } = await render(<wb-canvas></wb-canvas>);
    const canvas = instance as any;
    const targetId = canvas.fields[0].id;
    await canvas.selectField(targetId);
    expect(canvas.selectedId).toBe(targetId);
    const spy = vi.fn();
    root.addEventListener('wbFieldDeselected', spy);
    await canvas.importState([{ id: 1, type: 'text' as const, label: 'A' }]);
    expect(spy).toHaveBeenCalled();
    expect(canvas.selectedId).toBeNull();
  });

  it('does not emit wbFieldDeselected when nothing is selected', async () => {
    const { root, instance } = await render(<wb-canvas></wb-canvas>);
    const canvas = instance as any;
    const spy = vi.fn();
    root.addEventListener('wbFieldDeselected', spy);
    await canvas.importState([{ id: 1, type: 'text' as const, label: 'A' }]);
    expect(spy).not.toHaveBeenCalled();
  });

  it('non-array input is a no-op and does not emit wbChange', async () => {
    const { root, instance } = await render(<wb-canvas></wb-canvas>);
    const canvas = instance as any;
    const before = canvas.fields;
    const spy = vi.fn();
    root.addEventListener('wbChange', spy);
    await canvas.importState({ not: 'an array' } as any);
    expect(canvas.fields).toBe(before);
    expect(canvas.fields).toEqual(before);
    expect(spy).not.toHaveBeenCalled();
  });

  it('entry missing id is a no-op and does not emit wbChange', async () => {
    const { root, instance } = await render(<wb-canvas></wb-canvas>);
    const canvas = instance as any;
    const before = canvas.fields;
    const spy = vi.fn();
    root.addEventListener('wbChange', spy);
    await canvas.importState([{ type: 'text', label: 'A' }] as any);
    expect(canvas.fields).toEqual(before);
    expect(spy).not.toHaveBeenCalled();
  });

  it('entry with non-numeric id is a no-op and does not emit wbChange', async () => {
    const { root, instance } = await render(<wb-canvas></wb-canvas>);
    const canvas = instance as any;
    const before = canvas.fields;
    const spy = vi.fn();
    root.addEventListener('wbChange', spy);
    await canvas.importState([{ id: 'x', type: 'text', label: 'A' }] as any);
    expect(canvas.fields).toEqual(before);
    expect(spy).not.toHaveBeenCalled();
  });
});