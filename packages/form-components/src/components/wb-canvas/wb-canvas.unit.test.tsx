// biome-ignore lint/correctness/noUnusedImports: `h` is required by Stencil's JSX transform at runtime
import { h } from '@stencil/core';
import { render } from '@stencil/vitest';
import type { FieldMeta } from '../../core';

// Importing the source file triggers the on-the-fly compile + customElements.define()
import './wb-canvas';

/** Point events carry coordinates; mock-doc needs them defined explicitly. */
function createPointerEvent(type: string, init: Partial<PointerEventInit> = {}): Event {
  const event = new Event(type, { bubbles: true });
  Object.defineProperties(event, {
    pointerId: { value: init.pointerId ?? 1 },
    clientX: { value: init.clientX ?? 0 },
    clientY: { value: init.clientY ?? 0 },
  });
  return event;
}

function rect(top: number, bottom: number, left = 0, right = 200): DOMRect {
  return { top, bottom, left, right, width: right - left, height: bottom - top, x: left, y: top } as DOMRect;
}

/**
 * Realistic list rect with `rows` stacked rows of `height` each: the list
 * box and every top-level `[data-element-id]` row gets a matching rect.
 */
function stubLayout(canvas: any, rows: number, height = 60) {
  vi.spyOn(canvas.listEl, 'getBoundingClientRect').mockReturnValue(rect(0, rows * height));
  const rowEls = Array.from(canvas.listEl.querySelectorAll('[data-element-id]')) as HTMLElement[];
  rowEls.forEach((el, i) => {
    vi.spyOn(el, 'getBoundingClientRect').mockReturnValue(rect(i * height, (i + 1) * height, 0, 400));
  });
}

/**
 * Stub rects for a row container so computeColumnDropTarget can hit-test it:
 * container box, per-column boxes, and per-child boxes inside each column.
 */
function stubContainerLayout(
  canvas: any,
  containerId: number,
  cols: Array<{ left: number; right: number; top: number; bottom: number; children?: Array<{ id: number; top: number; bottom: number }> }>,
) {
  const containerEl = (canvas.listEl as HTMLElement).querySelector(`[data-container-id="${containerId}"]`) as HTMLElement;
  if (!containerEl) throw new Error(`container ${containerId} not rendered`);
  const top = Math.min(...cols.map(c => c.top));
  const bottom = Math.max(...cols.map(c => c.bottom));
  const left = Math.min(...cols.map(c => c.left));
  const right = Math.max(...cols.map(c => c.right));
  vi.spyOn(containerEl, 'getBoundingClientRect').mockReturnValue(rect(top, bottom, left, right));
  const columnEls = Array.from(containerEl.querySelectorAll('[data-column]')) as HTMLElement[];
  cols.forEach((c, i) => {
    const colEl = columnEls[i];
    if (!colEl) return;
    vi.spyOn(colEl, 'getBoundingClientRect').mockReturnValue(rect(c.top, c.bottom, c.left, c.right));
    for (const child of c.children ?? []) {
      const childEl = colEl.querySelector(`[data-element-id="${child.id}"]`) as HTMLElement;
      if (childEl) vi.spyOn(childEl, 'getBoundingClientRect').mockReturnValue(rect(child.top, child.bottom, c.left, c.right));
    }
  });
}

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

  it('forwards placeholder for a non-richtext data element to the preview', async () => {
    const { root, instance, waitForChanges } = await render(<wb-canvas></wb-canvas>);
    const canvas = instance as any;
    await canvas.importState([
      { id: 1, type: 'text', label: 'Name', placeholder: 'Jane Doe' },
      { id: 2, type: 'date', label: 'Birthday', placeholder: 'Your birthday' },
    ]);
    await waitForChanges();
    const fields = Array.from(root.shadowRoot!.querySelectorAll('wb-form-field')) as any[];
    expect(fields.length).toBe(2);
    expect(fields[0].getAttribute('placeholder')).toBe('Jane Doe');
    expect(fields[1].getAttribute('placeholder')).toBe('Your birthday');
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

describe('wb-canvas removeField', () => {
  const nestedRowState = () =>
    [
      {
        id: 2,
        kind: 'design',
        type: 'text',
        label: 'Outer row',
        designType: 'row',
        columns: 1,
        children: [[{ id: 3, kind: 'design', type: 'text', label: 'Inner row', designType: 'row', columns: 2, children: [[{ id: 4, type: 'text', label: 'Heading' }], []] }]],
      },
    ] as any[];

  it('removes a nested row container and its subtree', async () => {
    const { instance } = await render(<wb-canvas></wb-canvas>);
    const canvas = instance as any;
    await canvas.importState(nestedRowState());
    await canvas.removeField(3);
    const outer = canvas.fields[0];
    expect(outer.children[0]).toHaveLength(0);
  });

  it('deselects when the removed nested container held the selection', async () => {
    const { root, instance } = await render(<wb-canvas></wb-canvas>);
    const canvas = instance as any;
    await canvas.importState(nestedRowState());
    await canvas.selectField(4);
    const deselectedSpy = vi.fn();
    const removedSpy = vi.fn();
    const changeSpy = vi.fn();
    root.addEventListener('wbFieldDeselected', deselectedSpy);
    root.addEventListener('wbFieldRemoved', removedSpy);
    root.addEventListener('wbChange', changeSpy);
    await canvas.removeField(3);
    expect(canvas.selectedId).toBeNull();
    expect(deselectedSpy).toHaveBeenCalled();
    expect(removedSpy).toHaveBeenCalledWith(expect.objectContaining({ detail: { id: 3 } }));
    expect(changeSpy).toHaveBeenCalled();
  });

  it('does not deselect when an unrelated field is selected', async () => {
    const { root, instance } = await render(<wb-canvas></wb-canvas>);
    const canvas = instance as any;
    await canvas.importState([...nestedRowState(), { id: 9, type: 'text', label: 'Other' }]);
    await canvas.selectField(9);
    const deselectedSpy = vi.fn();
    root.addEventListener('wbFieldDeselected', deselectedSpy);
    await canvas.removeField(3);
    expect(canvas.selectedId).toBe(9);
    expect(deselectedSpy).not.toHaveBeenCalled();
  });

  it('deselects when the removed nested child held the selection', async () => {
    const { instance } = await render(<wb-canvas></wb-canvas>);
    const canvas = instance as any;
    await canvas.importState(nestedRowState());
    await canvas.selectField(4);
    await canvas.removeField(4);
    expect(canvas.selectedId).toBeNull();
  });

  it('no-op on unknown id without emitting', async () => {
    const { root, instance } = await render(<wb-canvas></wb-canvas>);
    const canvas = instance as any;
    await canvas.importState(nestedRowState());
    await canvas.selectField(4);
    const removedSpy = vi.fn();
    const changeSpy = vi.fn();
    root.addEventListener('wbFieldRemoved', removedSpy);
    root.addEventListener('wbChange', changeSpy);
    await canvas.removeField(999);
    expect(canvas.fields).toHaveLength(1);
    expect(canvas.selectedId).toBe(4);
    expect(removedSpy).not.toHaveBeenCalled();
    expect(changeSpy).not.toHaveBeenCalled();
  });

  it('clears draggingId and dropTarget when the dragged element is removed', async () => {
    const { instance } = await render(<wb-canvas></wb-canvas>);
    const canvas = instance as any;
    await canvas.importState(nestedRowState());
    canvas.draggingId = 3;
    canvas.dropTarget = { kind: 'column', containerId: 3, index: 0 };
    await canvas.removeField(3);
    expect(canvas.draggingId).toBeNull();
    expect(canvas.dropTarget).toBeNull();
  });

  it('importState with NaN nextId does not poison the id counter', async () => {
    const { instance } = await render(<wb-canvas></wb-canvas>);
    const canvas = instance as any;
    await canvas.importState({ fields: nestedRowState(), nextId: Number.NaN });
    await canvas.commitExternalInsert('text', 'Fresh');
    const fresh = canvas.fields.find((f: FieldMeta) => f.label === 'Fresh');
    expect(Number.isFinite(fresh.id)).toBe(true);
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

describe('wb-canvas reorder drag indicator', () => {
  /** Point events carry coordinates; mock-doc needs them defined explicitly. */
  function createPointerEvent(type: string, init: Partial<PointerEventInit> = {}): Event {
    const event = new Event(type, { bubbles: true });
    Object.defineProperties(event, {
      pointerId: { value: init.pointerId ?? 1 },
      clientX: { value: init.clientX ?? 0 },
      clientY: { value: init.clientY ?? 0 },
    });
    return event;
  }

  /** Start a grip drag and return listeners for driving the drag manually. */
  async function startGripDrag(root: any) {
    const grip = root.shadowRoot!.querySelector('.grip') as HTMLElement;
    (grip as any).setPointerCapture = vi.fn();
    grip.dispatchEvent(createPointerEvent('pointerdown', { pointerType: 'mouse', pointerId: 1, clientX: 10, clientY: 30 }));
    const handle = grip;
    return {
      move(clientY: number) {
        handle.dispatchEvent(createPointerEvent('pointermove', { pointerId: 1, clientY }));
      },
      up() {
        handle.dispatchEvent(createPointerEvent('pointerup', { pointerId: 1, clientY: 0 }));
      },
    };
  }

  it('startDrag resets stale hoverIndex and dropTarget', async () => {
    const { root, instance, waitForChanges } = await render(<wb-canvas></wb-canvas>);
    const canvas = instance as any;
    await canvas.importState([
      { id: 1, type: 'text', label: 'First' },
      { id: 2, type: 'text', label: 'Second' },
      { id: 3, type: 'text', label: 'Third' },
    ]);
    await waitForChanges();
    // Simulate stale state left over from a previous/external drag.
    canvas.hoverIndex = 2;
    canvas.dropTarget = { kind: 'top', index: 2 };
    await waitForChanges();
    expect(root.shadowRoot!.querySelectorAll('.indicator')).toHaveLength(1);
    await startGripDrag(root);
    expect(canvas.hoverIndex).toBeNull();
    expect(canvas.dropTarget).toBeNull();
    expect(canvas.draggingId).toBe(canvas.fields[0].id);
  });

  it('shows the insertion indicator at the index the pointer is over during a reorder drag', async () => {
    const { root, instance, waitForChanges } = await render(<wb-canvas></wb-canvas>);
    const canvas = instance as any;
    await canvas.importState([
      { id: 1, type: 'text', label: 'First' },
      { id: 2, type: 'text', label: 'Second' },
      { id: 3, type: 'text', label: 'Third' },
    ]);
    await waitForChanges();
    stubLayout(canvas, 3, 60);
    // getInsertionIndex uses :scope which mock-doc's selector engine does not
    // support; stub it with the same top-row logic the rects emulate.
    vi.spyOn(canvas, 'getInsertionIndex').mockImplementation((y: number) => Math.min(2, Math.max(0, Math.floor(y / 60))));
    const drag = await startGripDrag(root);
    drag.move(90); // between rows: index 1
    expect(canvas.dropTarget).toEqual({ kind: 'top', index: 1 });
    expect(canvas.hoverIndex).toBe(1);
    await waitForChanges();
    const indicators = root.shadowRoot!.querySelectorAll('.indicator');
    expect(indicators).toHaveLength(1);
    // Index 1 renders the line between rows 0 and 1: after First, before Second.
    expect((indicators[0].previousElementSibling as HTMLElement | null)?.getAttribute('data-element-id')).toBe('1');
    expect((indicators[0].nextElementSibling as HTMLElement | null)?.getAttribute('data-element-id')).toBe('2');
    drag.move(150); // further down: index 2
    await waitForChanges();
    expect(canvas.dropTarget).toEqual({ kind: 'top', index: 2 });
  });

  it('hides the insertion indicator when the pointer leaves the canvas row list', async () => {
    const { root, instance, waitForChanges } = await render(<wb-canvas></wb-canvas>);
    const canvas = instance as any;
    await canvas.importState([
      { id: 1, type: 'text', label: 'First' },
      { id: 2, type: 'text', label: 'Second' },
    ]);
    await waitForChanges();
    stubLayout(canvas, 2, 60);
    vi.spyOn(canvas, 'getInsertionIndex').mockImplementation((y: number) => Math.min(1, Math.max(0, Math.floor(y / 60))));
    const drag = await startGripDrag(root);
    drag.move(60); // over the list: indicator shows
    expect(canvas.dropTarget).toEqual({ kind: 'top', index: 1 });
    await waitForChanges();
    expect(root.shadowRoot!.querySelectorAll('.indicator')).toHaveLength(1);
    drag.move(500); // off the row list
    expect(canvas.dropTarget).toBeNull();
    expect(canvas.hoverIndex).toBeNull();
    await waitForChanges();
    expect(root.shadowRoot!.querySelectorAll('.indicator')).toHaveLength(0);
    // Moving back onto the list brings the indicator back.
    drag.move(30);
    expect(canvas.dropTarget).toEqual({ kind: 'top', index: 0 });
    await waitForChanges();
    expect(root.shadowRoot!.querySelectorAll('.indicator')).toHaveLength(1);
  });

  it('dragging a grip to the drop indicator position and releasing commits the element at that position', async () => {
    const { root, instance, waitForChanges } = await render(<wb-canvas></wb-canvas>);
    const canvas = instance as any;
    const wbChangeSpy = vi.fn();
    root.addEventListener('wbChange', wbChangeSpy);
    await canvas.importState([
      { id: 1, type: 'text', label: 'First' },
      { id: 2, type: 'text', label: 'Second' },
      { id: 3, type: 'text', label: 'Third' },
    ]);
    await waitForChanges();
    stubLayout(canvas, 3, 60);
    vi.spyOn(canvas, 'getInsertionIndex').mockReturnValue(2); // pointer between Second and Third
    const drag = await startGripDrag(root);
    drag.move(150); // indicator shows between Second and Third
    expect(canvas.dropTarget).toEqual({ kind: 'top', index: 2 });
    await waitForChanges();
    const indicators = root.shadowRoot!.querySelectorAll('.indicator');
    expect(indicators).toHaveLength(1);
    // The line sits between Second (id 2) and Third (id 3).
    expect((indicators[0].previousElementSibling as HTMLElement | null)?.getAttribute('data-element-id')).toBe('2');
    expect((indicators[0].nextElementSibling as HTMLElement | null)?.getAttribute('data-element-id')).toBe('3');
    drag.up(); // drop while the indicator is between Second and Third
    await waitForChanges();
    // Dragging 'First' to insertion index 2 => final order Second, First, Third
    expect(canvas.fields.map((f: FieldMeta) => f.label)).toEqual(['Second', 'First', 'Third']);
    expect(wbChangeSpy).toHaveBeenCalled();
    expect(canvas.dropTarget).toBeNull();
    expect(canvas.hoverIndex).toBeNull();
    expect(canvas.draggingId).toBeNull();
    await waitForChanges();
    expect(root.shadowRoot!.querySelectorAll('.indicator')).toHaveLength(0);
  });

  it('releasing the pointer off the canvas row list cancels the reorder', async () => {
    const { root, instance, waitForChanges } = await render(<wb-canvas></wb-canvas>);
    const canvas = instance as any;
    const wbChangeSpy = vi.fn();
    await canvas.importState([
      { id: 1, type: 'text', label: 'First' },
      { id: 2, type: 'text', label: 'Second' },
      { id: 3, type: 'text', label: 'Third' },
    ]);
    await waitForChanges();
    root.addEventListener('wbChange', wbChangeSpy);
    stubLayout(canvas, 3, 60);
    vi.spyOn(canvas, 'getInsertionIndex').mockReturnValue(2);
    const drag = await startGripDrag(root);
    drag.move(150); // indicator shows between Second and Third
    expect(canvas.dropTarget).toEqual({ kind: 'top', index: 2 });
    drag.move(500); // pointer leaves the row list: target cleared
    expect(canvas.dropTarget).toBeNull();
    expect(canvas.hoverIndex).toBeNull();
    drag.up(); // release off-list: no commit
    await waitForChanges();
    expect(canvas.fields.map((f: FieldMeta) => f.label)).toEqual(['First', 'Second', 'Third']);
    expect(wbChangeSpy).not.toHaveBeenCalled();
    expect(canvas.dropTarget).toBeNull();
    expect(canvas.hoverIndex).toBeNull();
    expect(canvas.draggingId).toBeNull();
  });
});

describe('wb-canvas nested-element drags', () => {
  /** Row container with a child in column 0. */
  const rowState = () =>
    [
      { id: 1, type: 'text', label: 'Top' },
      {
        id: 2,
        kind: 'design',
        type: 'text',
        label: 'Row',
        designType: 'row',
        columns: 2,
        children: [[{ id: 3, type: 'text', label: 'ChildA' }], [{ id: 4, type: 'text', label: 'ChildB' }]],
      },
    ] as any[];

  it('nested child grip pointerdown sets draggingId and creates a ghost', async () => {
    const { root, instance, waitForChanges } = await render(<wb-canvas></wb-canvas>);
    const canvas = instance as any;
    await canvas.importState(rowState());
    await waitForChanges();
    const grips = root.shadowRoot!.querySelectorAll('.grip');
    expect(grips.length).toBeGreaterThanOrEqual(3); // top-level + row + child
    const childGrip = root.shadowRoot!.querySelector('[data-element-id="3"] .grip') as HTMLElement;
    const startDragSpy = vi.spyOn(canvas, 'startDrag');
    (childGrip as any).setPointerCapture = vi.fn();
    childGrip.dispatchEvent(createPointerEvent('pointerdown', { pointerType: 'mouse', pointerId: 1, clientX: 10, clientY: 350 }));
    expect(canvas.selectedId).toBe(3);
    expect(startDragSpy).toHaveBeenCalled();
    expect(canvas.draggingId).toBe(3);
    const ghost = document.body.querySelector('div[style*="pointer-events: none"]') || document.body.querySelector('div[style*="pointer-events:none"]');
    expect(ghost).not.toBeNull();
    expect(ghost!.textContent).toBe('ChildA');
  });

  it('commitDrop clears drag state for a nested child drag', async () => {
    const { root, instance, waitForChanges } = await render(<wb-canvas></wb-canvas>);
    const canvas = instance as any;
    await canvas.importState(rowState());
    await waitForChanges();
    const childGrip = root.shadowRoot!.querySelector('[data-element-id="3"] .grip') as HTMLElement;
    (childGrip as any).setPointerCapture = vi.fn();
    childGrip.dispatchEvent(createPointerEvent('pointerdown', { pointerType: 'mouse', pointerId: 1, clientX: 10, clientY: 350 }));
    expect(canvas.draggingId).toBe(3);
    const grip = childGrip;
    grip.dispatchEvent(createPointerEvent('pointerup', { pointerId: 1, clientY: 350 }));
    await waitForChanges();
    expect(canvas.draggingId).toBeNull();
    expect(canvas.dropTarget).toBeNull();
    expect(canvas.hoverIndex).toBeNull();
  });

  it('moving a top-level element over a container column sets a column dropTarget and no top-level indicator renders', async () => {
    const { root, instance, waitForChanges } = await render(<wb-canvas></wb-canvas>);
    const canvas = instance as any;
    await canvas.importState(rowState());
    await waitForChanges();
    stubLayout(canvas, 2, 120);
    // mock-doc cannot evaluate :scope (used by getInsertionIndex); mirror the
    // stubbed row rects: midpoints at 60/180 => index 0 / 1 / 2.
    vi.spyOn(canvas, 'getInsertionIndex').mockImplementation((y: number) => (y < 60 ? 0 : y < 180 ? 1 : 2));
    // Row container occupies the second top-level slot; two columns side by side.
    stubContainerLayout(canvas, 2, [
      { left: 0, right: 200, top: 120, bottom: 240, children: [{ id: 3, top: 120, bottom: 180 }] },
      { left: 200, right: 400, top: 120, bottom: 240, children: [{ id: 4, top: 120, bottom: 180 }] },
    ]);
    const topGrip = root.shadowRoot!.querySelector('[data-element-id="1"] .grip') as HTMLElement;
    (topGrip as any).setPointerCapture = vi.fn();
    topGrip.dispatchEvent(createPointerEvent('pointerdown', { pointerType: 'mouse', pointerId: 1, clientX: 10, clientY: 30 }));
    topGrip.dispatchEvent(createPointerEvent('pointermove', { pointerId: 1, clientX: 100, clientY: 140 }));
    // Pointer inside column 0, above ChildA's midpoint => column target, index 0.
    expect(canvas.dropTarget).toEqual({ kind: 'column', containerId: 2, colIndex: 0, index: 0 });
    await waitForChanges();
    expect(root.shadowRoot!.querySelectorAll('.indicator')).toHaveLength(0); // no top-level line
    expect(root.shadowRoot!.querySelectorAll('.drop-line')).toHaveLength(1);
    expect(root.shadowRoot!.querySelectorAll('.column.drop-active')).toHaveLength(1);

    // Pointer over the top-level list but not inside a container => top-level target.
    topGrip.dispatchEvent(createPointerEvent('pointermove', { pointerId: 1, clientX: 100, clientY: 60 }));
    expect(canvas.dropTarget).toEqual({ kind: 'top', index: 1 });
    expect(canvas.hoverIndex).toBe(1);
    await waitForChanges();
    expect(root.shadowRoot!.querySelectorAll('.indicator')).toHaveLength(1);
    expect(root.shadowRoot!.querySelectorAll('.drop-line')).toHaveLength(0);

    // Pointer outside the list entirely => no indicator at all.
    topGrip.dispatchEvent(createPointerEvent('pointermove', { pointerId: 1, clientX: 100, clientY: 300 }));
    expect(canvas.dropTarget).toBeNull();
    expect(canvas.hoverIndex).toBeNull();
  });

  it('dragging a row container over a container nested in its own subtree shows no column target', async () => {
    const { root, instance, waitForChanges } = await render(<wb-canvas></wb-canvas>);
    const canvas = instance as any;
    // Outer row (id 2) contains inner row (id 3) in column 0; inner has a child (id 4).
    await canvas.importState([
      { id: 1, type: 'text', label: 'Top' },
      {
        id: 2,
        kind: 'design',
        type: 'text',
        label: 'Outer',
        designType: 'row',
        columns: 2,
        children: [[{ id: 3, kind: 'design', type: 'text', label: 'Inner', designType: 'row', columns: 2, children: [[{ id: 4, type: 'text', label: 'Leaf' }], []] }], []],
      },
    ]);
    await waitForChanges();
    vi.spyOn(canvas.listEl, 'getBoundingClientRect').mockReturnValue(rect(0, 480, 0, 400));
    // mock-doc cannot evaluate :scope; the fixed top-level index is enough to
    // prove the internal drag fell back to the top-level path.
    vi.spyOn(canvas, 'getInsertionIndex').mockReturnValue(1);
    stubContainerLayout(canvas, 2, [
      { left: 0, right: 200, top: 120, bottom: 360, children: [{ id: 3, top: 120, bottom: 240 }] },
      { left: 200, right: 400, top: 120, bottom: 360 },
    ]);
    stubContainerLayout(canvas, 3, [
      { left: 0, right: 100, top: 150, bottom: 240, children: [{ id: 4, top: 150, bottom: 200 }] },
      { left: 100, right: 200, top: 150, bottom: 240 },
    ]);
    const outerGrip = root.shadowRoot!.querySelector('[data-element-id="2"] .grip') as HTMLElement;
    (outerGrip as any).setPointerCapture = vi.fn();
    outerGrip.dispatchEvent(createPointerEvent('pointerdown', { pointerType: 'mouse', pointerId: 1, clientX: 10, clientY: 150 }));
    // Hovering the inner container's area resolves to the outer container's
    // column (dom-order hit test) — which is inside the dragged element's
    // subtree, so the cycle guard rejects it and the top-level target applies.
    outerGrip.dispatchEvent(createPointerEvent('pointermove', { pointerId: 1, clientX: 50, clientY: 180 }));
    expect(canvas.dropTarget).toEqual({ kind: 'top', index: 1 });
    await waitForChanges();
    expect(root.shadowRoot!.querySelectorAll('.column.drop-active')).toHaveLength(0);
    expect(root.shadowRoot!.querySelectorAll('.drop-line')).toHaveLength(0);
    expect(root.shadowRoot!.querySelectorAll('.indicator')).toHaveLength(1);
    outerGrip.dispatchEvent(createPointerEvent('pointerup', { pointerId: 1, clientY: 180 }));
    await waitForChanges();
    expect(canvas.draggingId).toBeNull();
    expect(canvas.dropTarget).toBeNull();
  });

  it('a non-container dragged over a nested container targets the enclosing outer column like palette drags', async () => {
    const { root, instance, waitForChanges } = await render(<wb-canvas></wb-canvas>);
    const canvas = instance as any;
    await canvas.importState([
      { id: 1, type: 'text', label: 'Top' },
      {
        id: 2,
        kind: 'design',
        type: 'text',
        label: 'Outer',
        designType: 'row',
        columns: 2,
        children: [[{ id: 3, kind: 'design', type: 'text', label: 'Inner', designType: 'row', columns: 2, children: [[{ id: 4, type: 'text', label: 'Leaf' }], []] }], []],
      },
    ]);
    await waitForChanges();
    vi.spyOn(canvas.listEl, 'getBoundingClientRect').mockReturnValue(rect(0, 480, 0, 400));
    stubContainerLayout(canvas, 2, [
      { left: 0, right: 200, top: 120, bottom: 360, children: [{ id: 3, top: 120, bottom: 240 }] },
      { left: 200, right: 400, top: 120, bottom: 360 },
    ]);
    const topGrip = root.shadowRoot!.querySelector('[data-element-id="1"] .grip') as HTMLElement;
    (topGrip as any).setPointerCapture = vi.fn();
    topGrip.dispatchEvent(createPointerEvent('pointerdown', { pointerType: 'mouse', pointerId: 1, clientX: 10, clientY: 30 }));
    // Pointer over the inner container's area but above its children's
    // midpoints: the outermost enclosing container (outer row, id 2) is the
    // column target, mirroring palette drags.
    topGrip.dispatchEvent(createPointerEvent('pointermove', { pointerId: 1, clientX: 50, clientY: 140 }));
    expect(canvas.dropTarget).toEqual({ kind: 'column', containerId: 2, colIndex: 0, index: 0 });
    await waitForChanges();
  });

  /** Drive a grip drag through move + drop and return the grip element. */
  async function dragAndDrop(
    root: any,
    canvas: any,
    gripSelector: string,
    move: { clientX: number; clientY: number },
    opts: { dropTarget?: any; drop?: { clientX: number; clientY: number } } = {},
  ) {
    const grip = root.shadowRoot!.querySelector(gripSelector) as HTMLElement;
    (grip as any).setPointerCapture = vi.fn();
    grip.dispatchEvent(createPointerEvent('pointerdown', { pointerType: 'mouse', pointerId: 1, clientX: 10, clientY: 30 }));
    grip.dispatchEvent(createPointerEvent('pointermove', { pointerId: 1, clientX: move.clientX, clientY: move.clientY }));
    if (opts.dropTarget) {
      // onMove always sets these together for top-level targets; commitDrop
      // reads hoverIndex on the top path, so mirror that pairing here.
      canvas.dropTarget = opts.dropTarget;
      if (opts.dropTarget.kind === 'top') canvas.hoverIndex = opts.dropTarget.index;
    }
    grip.dispatchEvent(createPointerEvent('pointerup', { pointerId: 1, clientX: opts.drop?.clientX ?? move.clientX, clientY: opts.drop?.clientY ?? move.clientY }));
    return grip;
  }

  it('commitDrop moves a top-level element into a targeted column, keeping its id, and emits wbChange', async () => {
    const { root, instance, waitForChanges } = await render(<wb-canvas></wb-canvas>);
    const canvas = instance as any;
    await canvas.importState(rowState());
    await waitForChanges();
    const wbChangeSpy = vi.fn();
    root.addEventListener('wbChange', wbChangeSpy);
    const originalId = canvas.fields[0].id; // 'Top' field, id 1
    stubLayout(canvas, 2, 120);
    stubContainerLayout(canvas, 2, [
      { left: 0, right: 200, top: 120, bottom: 240, children: [{ id: 3, top: 120, bottom: 180 }] },
      { left: 200, right: 400, top: 120, bottom: 240, children: [{ id: 4, top: 120, bottom: 180 }] },
    ]);
    await dragAndDrop(
      root,
      canvas,
      '[data-element-id="1"] .grip',
      { clientX: 100, clientY: 140 },
      {
        dropTarget: { kind: 'column', containerId: 2, colIndex: 1, index: 1 },
      },
    );
    await waitForChanges();
    expect(wbChangeSpy).toHaveBeenCalled();
    const row = canvas.fields.find((f: FieldMeta) => f.id === 2);
    expect(row.children[0].map((c: FieldMeta) => c.id)).toEqual([3]);
    expect(row.children[1].map((c: FieldMeta) => c.id)).toEqual([4, 1]); // inserted after ChildB
    expect(row.children[1][1].id).toBe(originalId); // identity preserved
    expect(row.children[1][1].label).toBe('Top');
    // No new uid was minted for the move.
    const nextId = await canvas.getNextElementId();
    expect(nextId).toBeGreaterThan(4);
    expect(canvas.draggingId).toBeNull();
    expect(canvas.dropTarget).toBeNull();
  });

  it('commitDrop moves a nested child out to the top level, keeping its id', async () => {
    const { root, instance, waitForChanges } = await render(<wb-canvas></wb-canvas>);
    const canvas = instance as any;
    await canvas.importState(rowState());
    await waitForChanges();
    const wbChangeSpy = vi.fn();
    root.addEventListener('wbChange', wbChangeSpy);
    // Drop with no active target while hovering top-level area: the
    // internal commit falls back to the top-level path via hoverIndex.
    vi.spyOn(canvas, 'getInsertionIndex').mockReturnValue(1);
    await dragAndDrop(root, canvas, '[data-element-id="3"] .grip', { clientX: 100, clientY: 60 }, { dropTarget: { kind: 'top', index: 1 } });
    await waitForChanges();
    expect(wbChangeSpy).toHaveBeenCalled();
    expect(canvas.fields.map((f: FieldMeta) => f.id)).toEqual([1, 3, 2]);
    const row = canvas.fields.find((f: FieldMeta) => f.id === 2);
    expect(row.children[0]).toHaveLength(0);
    expect(canvas.fields[1].id).toBe(3);
    expect(canvas.fields[1].label).toBe('ChildA');
  });

  it('commitDrop moves a child between columns of the same container', async () => {
    const { root, instance, waitForChanges } = await render(<wb-canvas></wb-canvas>);
    const canvas = instance as any;
    await canvas.importState(rowState());
    await waitForChanges();
    await dragAndDrop(
      root,
      canvas,
      '[data-element-id="3"] .grip',
      { clientX: 300, clientY: 150 },
      {
        dropTarget: { kind: 'column', containerId: 2, colIndex: 1, index: 1 }, // after ChildB
      },
    );
    const row = canvas.fields.find((f: FieldMeta) => f.id === 2);
    expect(row.children[0]).toHaveLength(0);
    expect(row.children[1].map((c: FieldMeta) => c.id)).toEqual([4, 3]);
    expect(row.children[1][1].id).toBe(3); // id preserved
  });

  it('commitDrop reorder within the same column (forward) shifts the target index', async () => {
    const { root, instance, waitForChanges } = await render(<wb-canvas></wb-canvas>);
    const canvas = instance as any;
    await canvas.importState([
      {
        id: 2,
        kind: 'design',
        type: 'text',
        label: 'Row',
        designType: 'row',
        columns: 1,
        children: [
          [
            { id: 3, type: 'text', label: 'A' },
            { id: 4, type: 'text', label: 'B' },
            { id: 5, type: 'text', label: 'C' },
          ],
        ],
      },
    ]);
    await waitForChanges();
    // Pointer indicated index 2 (between B and C) while dragging A (index 0).
    await dragAndDrop(
      root,
      canvas,
      '[data-element-id="3"] .grip',
      { clientX: 100, clientY: 150 },
      {
        dropTarget: { kind: 'column', containerId: 2, colIndex: 0, index: 2 },
      },
    );
    const row = canvas.fields[0];
    expect(row.children[0].map((c: FieldMeta) => c.id)).toEqual([4, 3, 5]);
  });

  it('commitDrop reorder within the same column (backward) keeps the target index', async () => {
    const { root, instance, waitForChanges } = await render(<wb-canvas></wb-canvas>);
    const canvas = instance as any;
    await canvas.importState([
      {
        id: 2,
        kind: 'design',
        type: 'text',
        label: 'Row',
        designType: 'row',
        columns: 1,
        children: [
          [
            { id: 3, type: 'text', label: 'A' },
            { id: 4, type: 'text', label: 'B' },
            { id: 5, type: 'text', label: 'C' },
          ],
        ],
      },
    ]);
    await waitForChanges();
    // Pointer indicated index 0 while dragging C (index 2).
    await dragAndDrop(
      root,
      canvas,
      '[data-element-id="5"] .grip',
      { clientX: 100, clientY: 40 },
      {
        dropTarget: { kind: 'column', containerId: 2, colIndex: 0, index: 0 },
      },
    );
    const row = canvas.fields[0];
    expect(row.children[0].map((c: FieldMeta) => c.id)).toEqual([5, 3, 4]);
  });

  it('dropping a row container over its own descendant is a no-op: no move, no wbChange', async () => {
    const { root, instance, waitForChanges } = await render(<wb-canvas></wb-canvas>);
    const canvas = instance as any;
    await canvas.importState([
      { id: 1, type: 'text', label: 'Top' },
      {
        id: 2,
        kind: 'design',
        type: 'text',
        label: 'Outer',
        designType: 'row',
        columns: 2,
        children: [[{ id: 3, kind: 'design', type: 'text', label: 'Inner', designType: 'row', columns: 2, children: [[{ id: 4, type: 'text', label: 'Leaf' }], []] }], []],
      },
    ]);
    await waitForChanges();
    const wbChangeSpy = vi.fn();
    root.addEventListener('wbChange', wbChangeSpy);
    // Force a stale/undetected column target: at commit time the only
    // reachable container is inside the dragged element's subtree (the
    // onMove guard rejects it), so the branch must still refuse to move.
    await dragAndDrop(
      root,
      canvas,
      '[data-element-id="2"] .grip',
      { clientX: 50, clientY: 180 },
      {
        dropTarget: { kind: 'column', containerId: 3, colIndex: 0, index: 0 },
      },
    );
    await waitForChanges();
    expect(wbChangeSpy).not.toHaveBeenCalled();
    expect(canvas.fields.map((f: FieldMeta) => f.id)).toEqual([1, 2]);
    const outer = canvas.fields[1];
    expect(outer.children[0][0].id).toBe(3);
    expect(outer.children[0][0].children[0][0].id).toBe(4);
    expect(canvas.draggingId).toBeNull();
    expect(canvas.dropTarget).toBeNull();
    expect(canvas.hoverIndex).toBeNull();
  });

  it('drop with a missing target container aborts cleanly and clears drag state', async () => {
    const { root, instance, waitForChanges } = await render(<wb-canvas></wb-canvas>);
    const canvas = instance as any;
    await canvas.importState(rowState());
    await waitForChanges();
    const wbChangeSpy = vi.fn();
    root.addEventListener('wbChange', wbChangeSpy);
    await dragAndDrop(
      root,
      canvas,
      '[data-element-id="1"] .grip',
      { clientX: 100, clientY: 140 },
      {
        dropTarget: { kind: 'column', containerId: 999, colIndex: 0, index: 0 },
      },
    );
    await waitForChanges();
    expect(wbChangeSpy).not.toHaveBeenCalled();
    // The dragged element must not have been removed.
    expect(canvas.fields.map((f: FieldMeta) => f.id)).toEqual([1, 2]);
    expect(canvas.draggingId).toBeNull();
    expect(canvas.dropTarget).toBeNull();
  });

  it('drop with no target leaves state unchanged', async () => {
    const { root, instance, waitForChanges } = await render(<wb-canvas></wb-canvas>);
    const canvas = instance as any;
    await canvas.importState(rowState());
    await waitForChanges();
    const wbChangeSpy = vi.fn();
    root.addEventListener('wbChange', wbChangeSpy);
    // Hover off the list: dropTarget stays null through the whole drag.
    const grip = root.shadowRoot!.querySelector('[data-element-id="1"] .grip') as HTMLElement;
    (grip as any).setPointerCapture = vi.fn();
    grip.dispatchEvent(createPointerEvent('pointerdown', { pointerType: 'mouse', pointerId: 1, clientX: 10, clientY: 30 }));
    grip.dispatchEvent(createPointerEvent('pointermove', { pointerId: 1, clientX: 100, clientY: 5000 }));
    expect(canvas.dropTarget).toBeNull();
    grip.dispatchEvent(createPointerEvent('pointerup', { pointerId: 1, clientX: 100, clientY: 5000 }));
    await waitForChanges();
    expect(wbChangeSpy).not.toHaveBeenCalled();
    expect(canvas.fields.map((f: FieldMeta) => f.id)).toEqual([1, 2]);
    expect(canvas.draggingId).toBeNull();
  });
});
