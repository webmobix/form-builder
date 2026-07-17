import { h } from '@stencil/core';
import { newSpecPage } from '@stencil/core/testing';
import { WbCanvas } from './wb-canvas';

describe('wb-canvas external drag API', () => {
  it('beginExternalDrag sets externalDrag flag', async () => {
    const page = await newSpecPage({
      components: [WbCanvas],
      template: () => <wb-canvas></wb-canvas>,
    });
    const canvas = page.rootInstance as WbCanvas;
    expect((canvas as any).externalDrag).toBe(false);
    await canvas.beginExternalDrag();
    expect((canvas as any).externalDrag).toBe(true);
  });

  it('beginExternalDrag clears draggingId if set', async () => {
    const page = await newSpecPage({
      components: [WbCanvas],
      template: () => <wb-canvas></wb-canvas>,
    });
    const canvas = page.rootInstance as WbCanvas;
    (canvas as any).draggingId = 1;
    await canvas.beginExternalDrag();
    expect((canvas as any).externalDrag).toBe(true);
  });

  it('setExternalHoverIndex returns early if no external drag', async () => {
    const page = await newSpecPage({
      components: [WbCanvas],
      template: () => <wb-canvas></wb-canvas>,
    });
    const canvas = page.rootInstance as WbCanvas;
    (canvas as any).hoverIndex = 42;
    await canvas.setExternalHoverIndex(100);
    expect((canvas as any).hoverIndex).toBe(42);
  });

  it('commitExternalInsert inserts at hoverIndex and emits wbChange', async () => {
    const page = await newSpecPage({
      components: [WbCanvas],
      template: () => <wb-canvas></wb-canvas>,
    });
    const canvas = page.rootInstance as WbCanvas;
    const spy = jest.fn();
    page.root.addEventListener('wbChange', spy);
    (canvas as any).externalDrag = true;
    (canvas as any).hoverIndex = 1;
    const initialLen = (canvas as any).fields.length;
    await canvas.commitExternalInsert('select', 'Dropdown');
    expect((canvas as any).fields).toHaveLength(initialLen + 1);
    expect((canvas as any).fields[1].type).toBe('select');
    expect((canvas as any).fields[1].label).toBe('Dropdown');
    expect(spy).toHaveBeenCalled();
    expect((canvas as any).externalDrag).toBe(false);
    expect((canvas as any).hoverIndex).toBeNull();
  });

  it('commitExternalInsert appends when hoverIndex is null', async () => {
    const page = await newSpecPage({
      components: [WbCanvas],
      template: () => <wb-canvas></wb-canvas>,
    });
    const canvas = page.rootInstance as WbCanvas;
    (canvas as any).externalDrag = true;
    (canvas as any).hoverIndex = null;
    const initialLen = (canvas as any).fields.length;
    await canvas.commitExternalInsert('checkbox', 'Checkbox');
    expect((canvas as any).fields).toHaveLength(initialLen + 1);
    expect((canvas as any).fields[initialLen].type).toBe('checkbox');
  });

  it('cancelExternalDrag clears state', async () => {
    const page = await newSpecPage({
      components: [WbCanvas],
      template: () => <wb-canvas></wb-canvas>,
    });
    const canvas = page.rootInstance as WbCanvas;
    (canvas as any).externalDrag = true;
    (canvas as any).hoverIndex = 2;
    await canvas.cancelExternalDrag();
    expect((canvas as any).externalDrag).toBe(false);
    expect((canvas as any).hoverIndex).toBeNull();
  });
});

describe('wb-canvas selection and update API', () => {
  it('selectField sets selectedId', async () => {
    const page = await newSpecPage({
      components: [WbCanvas],
      template: () => <wb-canvas></wb-canvas>,
    });
    const canvas = page.rootInstance as WbCanvas;
    expect((canvas as any).selectedId).toBeNull();
    await canvas.selectField(1);
    expect((canvas as any).selectedId).toBe(1);
    await canvas.selectField(null);
    expect((canvas as any).selectedId).toBeNull();
  });

  it('updateField merges patch and emits wbChange and wbFieldUpdated', async () => {
    const page = await newSpecPage({
      components: [WbCanvas],
      template: () => <wb-canvas></wb-canvas>,
    });
    const canvas = page.rootInstance as WbCanvas;
    const fields: any[] = (canvas as any).fields;
    const targetId = fields[0].id;
    const wbChangeSpy = jest.fn();
    const wbFieldUpdatedSpy = jest.fn();
    page.root.addEventListener('wbChange', wbChangeSpy);
    page.root.addEventListener('wbFieldUpdated', wbFieldUpdatedSpy);

    await canvas.updateField(targetId, { label: 'Updated' });
    expect((canvas as any).fields[0].label).toBe('Updated');
    expect((canvas as any).fields[0].id).toBe(targetId);
    expect(wbChangeSpy).toHaveBeenCalled();
    expect(wbFieldUpdatedSpy).toHaveBeenCalledWith(
      expect.objectContaining({ detail: { id: targetId, patch: { label: 'Updated' } } })
    );
  });

  it('updateField preserves position and id', async () => {
    const page = await newSpecPage({
      components: [WbCanvas],
      template: () => <wb-canvas></wb-canvas>,
    });
    const canvas = page.rootInstance as WbCanvas;
    const fields: any[] = (canvas as any).fields;
    const targetId = fields[0].id;
    const originalLen = fields.length;

    await canvas.updateField(targetId, { label: 'Changed', type: 'date' });
    expect((canvas as any).fields).toHaveLength(originalLen);
    expect((canvas as any).fields[0].id).toBe(targetId);
    expect((canvas as any).fields[0].label).toBe('Changed');
    expect((canvas as any).fields[0].type).toBe('date');
  });

  it('updateField with unknown id is a no-op and does not emit', async () => {
    const page = await newSpecPage({
      components: [WbCanvas],
      template: () => <wb-canvas></wb-canvas>,
    });
    const canvas = page.rootInstance as WbCanvas;
    const wbChangeSpy = jest.fn();
    const wbFieldUpdatedSpy = jest.fn();
    page.root.addEventListener('wbChange', wbChangeSpy);
    page.root.addEventListener('wbFieldUpdated', wbFieldUpdatedSpy);

    await canvas.updateField(99999, { label: 'Ghost' });
    expect(wbChangeSpy).not.toHaveBeenCalled();
    expect(wbFieldUpdatedSpy).not.toHaveBeenCalled();
  });

  it('row click emits wbFieldSelected', async () => {
    const page = await newSpecPage({
      components: [WbCanvas],
      template: () => <wb-canvas></wb-canvas>,
    });
    const spy = jest.fn();
    page.root.addEventListener('wbFieldSelected', spy);
    const row = page.root.shadowRoot!.querySelector('[data-row]') as HTMLElement;
    row.click();
    expect(spy).toHaveBeenCalled();
  });

  it('clicking empty area emits wbFieldDeselected when a field is selected', async () => {
    const page = await newSpecPage({
      components: [WbCanvas],
      template: () => <wb-canvas></wb-canvas>,
    });
    const canvas = page.rootInstance as WbCanvas;
    await canvas.selectField(1);
    const spy = jest.fn();
    page.root.addEventListener('wbFieldDeselected', spy);
    const wrap = page.root.shadowRoot!.querySelector('.wrap') as HTMLElement;
    wrap.click();
    expect(spy).toHaveBeenCalled();
    expect((canvas as any).selectedId).toBeNull();
  });

  it('clicking empty area does not emit wbFieldDeselected when nothing selected', async () => {
    const page = await newSpecPage({
      components: [WbCanvas],
      template: () => <wb-canvas></wb-canvas>,
    });
    const spy = jest.fn();
    page.root.addEventListener('wbFieldDeselected', spy);
    const wrap = page.root.shadowRoot!.querySelector('.wrap') as HTMLElement;
    wrap.click();
    expect(spy).not.toHaveBeenCalled();
  });
});
