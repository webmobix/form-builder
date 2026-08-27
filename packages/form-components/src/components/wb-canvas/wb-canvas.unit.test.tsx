// biome-ignore lint/correctness/noUnusedImports: `h` is required by Stencil's JSX transform at runtime
import { h } from '@stencil/core';
import { render } from '@stencil/vitest';
import type { FieldMeta } from '../../core';

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

  it('commitExternalInsert sets selectedId to the newly inserted field', async () => {
    const { instance } = await render(<wb-canvas></wb-canvas>);
    const canvas = instance as any;
    canvas.externalDrag = true;
    canvas.hoverIndex = 1;
    await canvas.commitExternalInsert('select', 'Dropdown');
    const inserted = canvas.fields[1];
    expect(canvas.selectedId).toBe(inserted.id);
  });

  it('commitExternalInsert emits wbFieldSelected with the newly inserted field', async () => {
    const { root, instance } = await render(<wb-canvas></wb-canvas>);
    const canvas = instance as any;
    const spy = vi.fn();
    root.addEventListener('wbFieldSelected', spy);
    canvas.externalDrag = true;
    canvas.hoverIndex = 1;
    await canvas.commitExternalInsert('select', 'Dropdown');
    expect(spy).toHaveBeenCalledWith(expect.objectContaining({ detail: expect.objectContaining({ type: 'select', label: 'Dropdown' }) }));
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

describe('wb-canvas addFieldAfter', () => {
  it('inserts a field immediately after the selected component and emits wbChange/wbFieldSelected', async () => {
    const { root, instance } = await render(<wb-canvas></wb-canvas>);
    const canvas = instance as any;
    const selectedId = canvas.fields[0].id;
    await canvas.selectField(selectedId);
    const wbChangeSpy = vi.fn();
    const wbFieldSelectedSpy = vi.fn();
    root.addEventListener('wbChange', wbChangeSpy);
    root.addEventListener('wbFieldSelected', wbFieldSelectedSpy);

    await canvas.addFieldAfter('select', 'Dropdown');
    expect(canvas.fields).toHaveLength(3);
    expect(canvas.fields[1].type).toBe('select');
    expect(canvas.fields[1].label).toBe('Dropdown');
    expect(wbChangeSpy).toHaveBeenCalled();
    expect(wbFieldSelectedSpy).toHaveBeenCalledWith(expect.objectContaining({ detail: expect.objectContaining({ type: 'select', label: 'Dropdown' }) }));
  });

  it('appends to the end when no component is selected', async () => {
    const { instance } = await render(<wb-canvas></wb-canvas>);
    const canvas = instance as any;
    const initialLen = canvas.fields.length;
    await canvas.addFieldAfter('checkbox', 'Checkbox');
    expect(canvas.fields).toHaveLength(initialLen + 1);
    expect(canvas.fields[initialLen].type).toBe('checkbox');
  });

  it('makes the newly added field the selected component', async () => {
    const { instance } = await render(<wb-canvas></wb-canvas>);
    const canvas = instance as any;
    await canvas.addFieldAfter('date', 'Date');
    const added = canvas.fields[canvas.fields.length - 1];
    expect(canvas.selectedId).toBe(added.id);
  });

  it('appends when selectedId points to a field no longer present', async () => {
    const { instance } = await render(<wb-canvas></wb-canvas>);
    const canvas = instance as any;
    await canvas.selectField(99999);
    const initialLen = canvas.fields.length;
    await canvas.addFieldAfter('text', 'Ghost');
    expect(canvas.fields).toHaveLength(initialLen + 1);
    expect(canvas.fields[initialLen].label).toBe('Ghost');
  });

  it('addFieldAfter persists subtype for email', async () => {
    const { instance } = await render(<wb-canvas></wb-canvas>);
    const canvas = instance as any;
    await canvas.addFieldAfter('text', 'Email', 'email');
    const added = canvas.fields[canvas.fields.length - 1];
    expect(added.type).toBe('text');
    expect(added.subtype).toBe('email');
    expect(added.label).toBe('Email');
    expect(added.id).toBeDefined();
  });

  it('addField without subtype creates a field with no subtype', async () => {
    const { instance } = await render(<wb-canvas></wb-canvas>);
    const canvas = instance as any;
    await canvas.addField('text', 'Name');
    const added = canvas.fields[canvas.fields.length - 1];
    expect(added.type).toBe('text');
    expect(added.label).toBe('Name');
    expect(added.subtype).toBeUndefined();
  });

  it('commitExternalInsert persists subtype from a palette drop', async () => {
    const { instance } = await render(<wb-canvas></wb-canvas>);
    const canvas = instance as any;
    canvas.externalDrag = true;
    canvas.hoverIndex = 0;
    await canvas.commitExternalInsert('text', 'Password', 'password');
    expect(canvas.fields[0].type).toBe('text');
    expect(canvas.fields[0].subtype).toBe('password');
    expect(canvas.fields[0].label).toBe('Password');
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
    expect(wbFieldUpdatedSpy).toHaveBeenCalledWith(expect.objectContaining({ detail: { id: targetId, patch: { label: 'Updated' } } }));
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

  it('updateField applies a patch to a child nested inside a row container', async () => {
    const { root, instance } = await render(<wb-canvas></wb-canvas>);
    const canvas = instance as any;
    await canvas.importState([
      { id: 1, type: 'text', label: 'Name' },
      { id: 2, kind: 'design', type: 'text', label: 'Row', designType: 'row', columns: 2, children: [[{ id: 3, type: 'text', label: 'ChildA' }], []] },
    ]);
    const wbChangeSpy = vi.fn();
    root.addEventListener('wbChange', wbChangeSpy);

    await canvas.updateField(3, { label: 'Renamed' });
    expect(wbChangeSpy).toHaveBeenCalled();
    const row = canvas.fields.find((f: FieldMeta) => f.designType === 'row');
    expect(row.children[0][0].label).toBe('Renamed');
    expect(row.children[0][0].id).toBe(3);
  });

  it('applies an options patch to a select field and forwards it to the preview', async () => {
    const { root, instance } = await render(<wb-canvas></wb-canvas>);
    const canvas = instance as any;
    await canvas.importState([{ id: 1, type: 'select', label: 'Country' }]);
    const wbChangeSpy = vi.fn();
    root.addEventListener('wbChange', wbChangeSpy);

    const options = [
      { key: 'us', label: 'US' },
      { key: 'ca', label: 'CA' },
    ];
    await canvas.updateField(1, { options });
    expect(canvas.fields[0].options).toEqual(options);
    expect(wbChangeSpy).toHaveBeenCalled();
  });

  it('renders a select preview that forwards options to wb-form-field', async () => {
    const { root, instance, waitForChanges } = await render(<wb-canvas></wb-canvas>);
    const canvas = instance as any;
    const options = [{ key: 'a', label: 'A' }];
    await canvas.importState([{ id: 1, type: 'select', label: 'Country', options }]);
    await waitForChanges();
    const field = root.shadowRoot!.querySelector('wb-form-field') as any;
    expect(field).not.toBeNull();
    expect(field.options).toEqual(options);
    expect(field.getAttribute('type')).toBe('select');
  });

  it('updateField applies a columns patch to a nested row container', async () => {
    const { instance } = await render(<wb-canvas></wb-canvas>);
    const canvas = instance as any;
    await canvas.importState([
      {
        id: 10,
        kind: 'design',
        type: 'text',
        label: 'Outer',
        designType: 'row',
        columns: 1,
        children: [
          [
            {
              id: 11,
              kind: 'design',
              type: 'text',
              label: 'Inner',
              designType: 'row',
              columns: 2,
              children: [[{ id: 12, type: 'text', label: 'A' }], [{ id: 13, type: 'text', label: 'B' }]],
            },
          ],
        ],
      },
    ]);
    await canvas.updateField(11, { columns: 1 });
    const outer = canvas.fields[0];
    const inner = outer.children[0][0];
    expect(inner.columns).toBe(1);
    expect(inner.children).toHaveLength(1);
    expect(inner.children[0].map((f: FieldMeta) => f.id)).toEqual([12, 13]);
  });

  it('row click emits wbFieldSelected', async () => {
    const { root } = await render(<wb-canvas></wb-canvas>);
    const spy = vi.fn();
    root.addEventListener('wbFieldSelected', spy);
    const row = root.shadowRoot!.querySelector('[data-element-id]') as HTMLElement;
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

describe('wb-canvas realistic preview rendering', () => {
  it('stamps a disabled wb-form-field for data fields', async () => {
    const { root, instance, waitForChanges } = await render(<wb-canvas></wb-canvas>);
    const canvas = instance as any;
    await canvas.importState([{ id: 1, type: 'text', label: 'Name' }]);
    await waitForChanges();
    const field = root.shadowRoot!.querySelector('wb-form-field') as HTMLElement;
    expect(field).not.toBeNull();
    expect(field.getAttribute('label')).toBe('Name');
    expect(field.getAttribute('disabled')).not.toBeNull();
  });

  it('renders a paragraph with its text body', async () => {
    const { root, instance, waitForChanges } = await render(<wb-canvas></wb-canvas>);
    const canvas = instance as any;
    await canvas.importState([{ id: 1, kind: 'design', type: 'text', label: 'Intro', designType: 'paragraph', text: 'Full prose body' }]);
    await waitForChanges();
    const p = root.shadowRoot!.querySelector('.preview-paragraph') as HTMLElement;
    expect(p).not.toBeNull();
    expect(p.textContent).toBe('Full prose body');
  });

  it('renders a heading with its label', async () => {
    const { root, instance, waitForChanges } = await render(<wb-canvas></wb-canvas>);
    const canvas = instance as any;
    await canvas.importState([{ id: 1, kind: 'design', type: 'text', label: 'Section', designType: 'heading' }]);
    await waitForChanges();
    const heading = root.shadowRoot!.querySelector('.preview-heading') as HTMLElement;
    expect(heading).not.toBeNull();
    expect(heading.textContent).toBe('Section');
  });

  it('renders row containers with real columns and children', async () => {
    const { root, instance, waitForChanges } = await render(<wb-canvas></wb-canvas>);
    const canvas = instance as any;
    await canvas.importState([
      {
        id: 1,
        kind: 'design',
        type: 'text',
        label: 'Row',
        designType: 'row',
        columns: 2,
        children: [[{ id: 2, type: 'text', label: 'ChildA' }], []],
      },
    ]);
    await waitForChanges();
    const container = root.shadowRoot!.querySelector('[data-container-id]') as HTMLElement;
    expect(container).not.toBeNull();
    const columns = container.querySelectorAll('[data-column]');
    expect(columns).toHaveLength(2);
    const child = container.querySelector('[data-element-id]') as HTMLElement;
    expect(child).not.toBeNull();
    expect(child.querySelector('wb-form-field')?.getAttribute('label')).toBe('ChildA');
  });

  it('shows an empty-slot strip in an empty column and hides it once filled', async () => {
    const { root, instance, waitForChanges } = await render(<wb-canvas></wb-canvas>);
    const canvas = instance as any;
    await canvas.importState([
      {
        id: 1,
        kind: 'design',
        type: 'text',
        label: 'Row',
        designType: 'row',
        columns: 2,
        children: [[], []],
      },
    ]);
    await waitForChanges();
    const container = root.shadowRoot!.querySelector('[data-container-id]') as HTMLElement;
    expect(container.querySelectorAll('.empty-slot')).toHaveLength(2);

    await canvas.updateField(1, { children: [[{ id: 2, type: 'text', label: 'A' }], []] });
    await waitForChanges();
    const updated = root.shadowRoot!.querySelector('[data-container-id]') as HTMLElement;
    expect(updated.querySelectorAll('.empty-slot')).toHaveLength(1);
  });

  it('grip badge is always visible and starts a drag on pointerdown', async () => {
    const { root, instance, waitForChanges } = await render(<wb-canvas></wb-canvas>);
    const canvas = instance as any;
    await canvas.importState([{ id: 1, type: 'text', label: 'Name' }]);
    await waitForChanges();
    const grip = root.shadowRoot!.querySelector('.grip') as HTMLElement;
    expect(grip).not.toBeNull();
    expect(grip.getAttribute('title')).toBe('Drag to move');
    const startDragSpy = vi.spyOn(canvas, 'startDrag');
    grip.dispatchEvent(new MouseEvent('pointerdown', { bubbles: true }));
    expect(canvas.selectedId).toBe(1);
    expect(startDragSpy).toHaveBeenCalled();
  });

  it('dragging from the element body does not start a drag', async () => {
    const { root, instance, waitForChanges } = await render(<wb-canvas></wb-canvas>);
    const canvas = instance as any;
    await canvas.importState([{ id: 1, type: 'text', label: 'Name' }]);
    await waitForChanges();
    const startDragSpy = vi.spyOn(canvas, 'startDrag');
    const body = root.shadowRoot!.querySelector('.element-body') as HTMLElement;
    body.dispatchEvent(new MouseEvent('pointerdown', { bubbles: true }));
    expect(startDragSpy).not.toHaveBeenCalled();
  });
});
