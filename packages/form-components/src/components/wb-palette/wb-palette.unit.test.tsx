// biome-ignore lint/correctness/noUnusedImports: `h` is required by Stencil's JSX transform at runtime
import { h } from '@stencil/core';
import { render } from '@stencil/vitest';

// Importing the source files triggers the on-the-fly compile + customElements.define()
import './wb-palette';
import '../wb-canvas/wb-canvas';

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
    const { root } = await render(<wb-palette></wb-palette>);
    const dragStart = vi.fn();
    root.addEventListener('wbPaletteDragStart', dragStart);

    const btn = root.shadowRoot!.querySelector('button')!;
    btn.setPointerCapture = vi.fn();
    btn.dispatchEvent(createPointerEvent('pointerdown', { pointerType: 'mouse', pointerId: 1, clientX: 100, clientY: 200 }));
    window.dispatchEvent(createPointerEvent('pointermove', { pointerType: 'mouse', pointerId: 1, clientX: 130, clientY: 200 }));

    expect(dragStart).toHaveBeenCalled();
    expect(dragStart.mock.calls[0][0].detail.type).toBe('text');
  });

  it('pointerdown with touch does NOT start drag', async () => {
    const { root } = await render(<wb-palette></wb-palette>);
    const dragStart = vi.fn();
    root.addEventListener('wbPaletteDragStart', dragStart);

    const btn = root.shadowRoot!.querySelector('button')!;
    btn.dispatchEvent(createPointerEvent('pointerdown', { pointerType: 'touch', pointerId: 2, clientX: 100, clientY: 200 }));

    expect(dragStart).not.toHaveBeenCalled();
  });

  it('click without drag movement does NOT start drag and emits wbAddField', async () => {
    const { root } = await render(<wb-palette></wb-palette>);
    const dragStart = vi.fn();
    const addField = vi.fn();
    root.addEventListener('wbPaletteDragStart', dragStart);
    root.addEventListener('wbAddField', addField);

    const btn = root.shadowRoot!.querySelector('button')!;
    btn.setPointerCapture = vi.fn();
    btn.dispatchEvent(createPointerEvent('pointerdown', { pointerType: 'mouse', pointerId: 1, clientX: 100, clientY: 200 }));
    window.dispatchEvent(createPointerEvent('pointermove', { pointerType: 'mouse', pointerId: 1, clientX: 101, clientY: 200 }));
    window.dispatchEvent(createPointerEvent('pointerup', { pointerType: 'mouse', pointerId: 1, clientX: 101, clientY: 200 }));
    btn.click();

    expect(dragStart).not.toHaveBeenCalled();
    expect(addField).toHaveBeenCalled();
    expect(addField.mock.calls[0][0].detail.type).toBe('text');
  });

  it('click (no drag) on palette item emits wbAddField', async () => {
    const { root } = await render(<wb-palette></wb-palette>);
    const addField = vi.fn();
    root.addEventListener('wbAddField', addField);

    const btn = root.shadowRoot!.querySelector('button')!;
    btn.click();

    expect(addField).toHaveBeenCalled();
    expect(addField.mock.calls[0][0].detail.type).toBe('text');
  });

  it('canvas commitExternalInsert uses same uid source as addField', async () => {
    const { instance } = await render(<wb-canvas></wb-canvas>);
    const canvas = instance as any;
    const initialLen = canvas.fields.length;

    await canvas.addField('text', 'Click added');
    expect(canvas.fields).toHaveLength(initialLen + 1);

    canvas.externalDrag = true;
    canvas.hoverIndex = 0;
    await canvas.commitExternalInsert('select', 'Drag added');
    expect(canvas.fields).toHaveLength(initialLen + 2);
    expect(canvas.fields[0].type).toBe('select');
    expect(canvas.fields[0].id).toBeDefined();
  });

  it('cancelExternalDrag clears externalDrag and hoverIndex', async () => {
    const { instance } = await render(<wb-canvas></wb-canvas>);
    const canvas = instance as any;
    canvas.externalDrag = true;
    canvas.hoverIndex = 1;
    await canvas.cancelExternalDrag();
    expect(canvas.externalDrag).toBe(false);
    expect(canvas.hoverIndex).toBeNull();
  });

  it('existing canvas reorder still works (addField unchanged)', async () => {
    const { root, instance } = await render(<wb-canvas></wb-canvas>);
    const canvas = instance as any;
    const spy = vi.fn();
    root.addEventListener('wbChange', spy);

    await canvas.addField('date', 'Date');
    expect(spy).toHaveBeenCalled();
    expect(canvas.fields).toHaveLength(3);
    expect(canvas.fields[2].type).toBe('date');
  });
});
