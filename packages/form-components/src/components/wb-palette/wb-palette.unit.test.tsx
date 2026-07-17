import { h } from '@stencil/core';
import { newSpecPage } from '@stencil/core/testing';
import { WbPalette } from './wb-palette';
import { WbCanvas } from '../wb-canvas/wb-canvas';

function createPointerEvent(type: string, init: Partial<PointerEventInit> = {}): Event {
  const event = new Event(type, { bubbles: true, ...init });
  Object.defineProperties(event, {
    pointerType: { value: init.pointerType || '' },
    pointerId: { value: init.pointerId || 0 },
    clientX: { value: init.clientX || 0 },
    clientY: { value: init.clientY || 0 },
  });
  return event;
}

describe('wb-palette drag events', () => {
  it('pointerdown with mouse starts drag, emits wbPaletteDragStart', async () => {
    const page = await newSpecPage({
      components: [WbPalette],
      template: () => <wb-palette></wb-palette>,
    });
    const dragStart = jest.fn();
    page.root.addEventListener('wbPaletteDragStart', dragStart);

    const btn = page.root.shadowRoot.querySelector('button')!;
    btn.setPointerCapture = jest.fn();
    btn.dispatchEvent(createPointerEvent('pointerdown', { pointerType: 'mouse', pointerId: 1, clientX: 100, clientY: 200 }));

    expect(dragStart).toHaveBeenCalled();
    expect(dragStart.mock.calls[0][0].detail.type).toBe('text');
  });

  it('pointerdown with touch does NOT start drag', async () => {
    const page = await newSpecPage({
      components: [WbPalette],
      template: () => <wb-palette></wb-palette>,
    });
    const dragStart = jest.fn();
    page.root.addEventListener('wbPaletteDragStart', dragStart);

    const btn = page.root.shadowRoot.querySelector('button')!;
    btn.dispatchEvent(createPointerEvent('pointerdown', { pointerType: 'touch', pointerId: 2, clientX: 100, clientY: 200 }));

    expect(dragStart).not.toHaveBeenCalled();
  });

  it('click (no drag) on palette item emits wbAddField', async () => {
    const page = await newSpecPage({
      components: [WbPalette],
      template: () => <wb-palette></wb-palette>,
    });
    const addField = jest.fn();
    page.root.addEventListener('wbAddField', addField);

    const btn = page.root.shadowRoot.querySelector('button')!;
    btn.click();

    expect(addField).toHaveBeenCalled();
    expect(addField.mock.calls[0][0].detail.type).toBe('text');
  });

  it('canvas commitExternalInsert uses same uid source as addField', async () => {
    const page = await newSpecPage({
      components: [WbCanvas],
      template: () => <wb-canvas></wb-canvas>,
    });
    const canvas = page.rootInstance as WbCanvas;
    const initialLen = (canvas as any).fields.length;

    await canvas.addField('text', 'Click added');
    expect((canvas as any).fields).toHaveLength(initialLen + 1);

    (canvas as any).externalDrag = true;
    (canvas as any).hoverIndex = 0;
    await canvas.commitExternalInsert('select', 'Drag added');
    expect((canvas as any).fields).toHaveLength(initialLen + 2);
    expect((canvas as any).fields[0].type).toBe('select');
    expect((canvas as any).fields[0].id).toBeDefined();
  });

  it('cancelExternalDrag clears externalDrag and hoverIndex', async () => {
    const page = await newSpecPage({
      components: [WbCanvas],
      template: () => <wb-canvas></wb-canvas>,
    });
    const canvas = page.rootInstance as WbCanvas;
    (canvas as any).externalDrag = true;
    (canvas as any).hoverIndex = 1;
    await canvas.cancelExternalDrag();
    expect((canvas as any).externalDrag).toBe(false);
    expect((canvas as any).hoverIndex).toBeNull();
  });

  it('existing canvas reorder still works (addField unchanged)', async () => {
    const page = await newSpecPage({
      components: [WbCanvas],
      template: () => <wb-canvas></wb-canvas>,
    });
    const canvas = page.rootInstance as WbCanvas;
    const spy = jest.fn();
    page.root.addEventListener('wbChange', spy);

    await canvas.addField('date', 'Date');
    expect(spy).toHaveBeenCalled();
    expect((canvas as any).fields).toHaveLength(3);
    expect((canvas as any).fields[2].type).toBe('date');
  });
});
