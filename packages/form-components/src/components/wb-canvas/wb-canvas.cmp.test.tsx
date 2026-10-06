import { expect, test } from 'vitest';
import { userEvent } from 'vitest/browser';

type CanvasEl = HTMLElement & {
  importState: (fields: unknown[]) => Promise<void>;
  addField: (type: string, label: string) => Promise<void>;
};

/**
 * Browser-level coverage for the canvas default slot. Unit tests assert the
 * `slot` exists in the shadow root, but mock-doc does not project light DOM
 * through slots, so real projection and the CSS sizing hook are validated here.
 */
const mountCanvas = async (lightDom = '', hostStyle = ''): Promise<CanvasEl> => {
  document.body.innerHTML = `<wb-canvas style="${hostStyle}">${lightDom}</wb-canvas>`;
  const el = document.querySelector('wb-canvas') as CanvasEl;
  await window.customElements.whenDefined('wb-canvas');
  await waitFor(() => !!el.shadowRoot?.querySelector('.wrap'));
  return el;
};

const waitFor = async (predicate: () => boolean, timeoutMs = 2000): Promise<void> => {
  const start = Date.now();
  while (!predicate()) {
    if (Date.now() - start > timeoutMs) throw new Error('waitFor timed out');
    await new Promise(r => setTimeout(r, 20));
  }
};

/**
 * The element actually under a viewport point, descending through open shadow
 * roots. `document.elementFromPoint` only returns the topmost shadow host, so
 * the recursive walk is needed to see whether `pointer-events: none` on an
 * ancestor removed an inner control from hit-testing.
 */
const deepElementFromPoint = (x: number, y: number): Element | null => {
  let el: Element | null = document.elementFromPoint(x, y);
  while (el?.shadowRoot) {
    const inner = el.shadowRoot.elementFromPoint(x, y);
    if (!inner || inner === el) break;
    el = inner;
  }
  return el;
};

const centerOf = (el: Element): { x: number; y: number } => {
  const r = el.getBoundingClientRect();
  return { x: r.left + r.width / 2, y: r.top + r.height / 2 };
};

/** Real browser click at an absolute viewport point, routed through the hit target. */
const clickAt = async (point: { x: number; y: number }): Promise<void> => {
  const hit = deepElementFromPoint(point.x, point.y);
  if (!hit) throw new Error(`no element at ${point.x},${point.y}`);
  const r = hit.getBoundingClientRect();
  await userEvent.click(hit, { position: { x: point.x - r.left, y: point.y - r.top } });
};

/** Waits for an element wrapper with `id` to render, then returns it. */
const waitForCanvasElement = async (el: CanvasEl, id: number): Promise<HTMLElement> => {
  await waitFor(() => !!el.shadowRoot!.querySelector(`[data-element-id="${id}"]`));
  return el.shadowRoot!.querySelector(`[data-element-id="${id}"]`) as HTMLElement;
};

/** Waits for the `wb-form-field` preview inside a wrapper and its shadow parts. */
const previewOf = async (canvasEl: HTMLElement): Promise<{ field: HTMLElement; label: HTMLElement; control: HTMLInputElement }> => {
  const field = canvasEl.querySelector('wb-form-field') as HTMLElement;
  await waitFor(() => !!field.shadowRoot?.querySelector('.wb-field__label'));
  const label = field.shadowRoot!.querySelector('.wb-field__label') as HTMLElement;
  const control = field.shadowRoot!.querySelector('input') as HTMLInputElement;
  return { field, label, control };
};

test('projects host children while empty and hides them once a field exists', async () => {
  const el = await mountCanvas('<div class="host-empty">Drop something here</div>');
  await el.importState([]);
  await waitFor(() => !!el.shadowRoot!.querySelector('.empty-state'));

  // A light-DOM child with no matching slot is not rendered and has no box;
  // once projected it lays out with a real height.
  const hostChild = el.querySelector('.host-empty') as HTMLElement;
  expect(hostChild.getBoundingClientRect().height).toBeGreaterThan(0);

  await el.addField('text', 'Name');
  await waitFor(() => !el.shadowRoot!.querySelector('.empty-state'));
  expect(el.shadowRoot!.querySelector('slot')).toBeNull();
  expect(hostChild.getBoundingClientRect().height).toBe(0);
});

test('empty-state adds no minimum height by default', async () => {
  const el = await mountCanvas('<div>Drop something here</div>');
  await el.importState([]);
  await waitFor(() => !!el.shadowRoot!.querySelector('.empty-state'));

  const emptyState = el.shadowRoot!.querySelector('.empty-state') as HTMLElement;
  expect(getComputedStyle(emptyState).minHeight).toBe('0px');
});

test('honors --wb-canvas-empty-min-height', async () => {
  const el = await mountCanvas('<div>Drop something here</div>', '--wb-canvas-empty-min-height: 240px');
  await el.importState([]);
  await waitFor(() => !!el.shadowRoot!.querySelector('.empty-state'));

  const emptyState = el.shadowRoot!.querySelector('.empty-state') as HTMLElement;
  expect(getComputedStyle(emptyState).minHeight).toBe('240px');
});

test('fills the available height and vertically centres default content', async () => {
  const el = await mountCanvas('<div class="centered">Centered</div>', 'height: 400px');
  await el.importState([]);
  await waitFor(() => !!el.shadowRoot!.querySelector('.empty-state'));

  const hostBox = el.getBoundingClientRect();
  const wrap = el.shadowRoot!.querySelector('.wrap') as HTMLElement;
  // The scroll surface fills the definite host height.
  expect(Math.abs(wrap.getBoundingClientRect().height - hostBox.height)).toBeLessThanOrEqual(1);

  // The projected default content sits at the vertical centre of the surface.
  const contentBox = (el.querySelector('.centered') as HTMLElement).getBoundingClientRect();
  const hostCenter = hostBox.top + hostBox.height / 2;
  const contentCenter = contentBox.top + contentBox.height / 2;
  expect(Math.abs(contentCenter - hostCenter)).toBeLessThanOrEqual(2);
});

test('keeps the field list top-aligned when the canvas is non-empty', async () => {
  const el = await mountCanvas('', 'height: 400px');
  await el.addField('text', 'First');
  await waitFor(() => !!el.shadowRoot!.querySelector('[data-element-id]'));

  const wrapBox = (el.shadowRoot!.querySelector('.wrap') as HTMLElement).getBoundingClientRect();
  const rowBox = (el.shadowRoot!.querySelector('[data-element-id]') as HTMLElement).getBoundingClientRect();
  // Row sits just below the surface's 12px padding, not centred in the 400px box.
  expect(rowBox.top - wrapBox.top).toBeLessThan(30);
});

// ---------------------------------------------------------------------------
// Consistent pointer affordance / click routing for inert element bodies.
// ---------------------------------------------------------------------------

test('a data field body is pointer-transparent while a row container body stays interactive', async () => {
  const el = await mountCanvas();
  // Ids beyond the mount-time defaults (1, 2) so waits only match the import.
  await el.importState([
    { id: 101, type: 'text', label: 'Name' },
    { id: 102, kind: 'design', type: 'text', label: 'Row', designType: 'row', columns: 2, children: [[], []] },
  ]);
  const dataEl = await waitForCanvasElement(el, 101);
  const rowEl = await waitForCanvasElement(el, 102);
  const dataBody = dataEl.querySelector('.element-body') as HTMLElement;
  const rowBody = rowEl.querySelector('.element-body') as HTMLElement;
  const preview = dataBody.querySelector('wb-form-field') as HTMLElement;

  // The leaf body (and everything inside it) drops out of hit-testing...
  expect(getComputedStyle(dataBody).pointerEvents).toBe('none');
  expect(getComputedStyle(preview).pointerEvents).toBe('none');
  // ...while the row container body keeps default pointer behavior so nested
  // elements stay hoverable and selectable.
  expect(getComputedStyle(rowBody).pointerEvents).toBe('auto');
});

test('the pointer cursor covers a data field label and its disabled control, and hover still outlines the element', async () => {
  const el = await mountCanvas();
  await el.importState([{ id: 101, type: 'text', label: 'Name' }]);
  const dataEl = await waitForCanvasElement(el, 101);
  const { label, control } = await previewOf(dataEl);

  const borderCursor = getComputedStyle(dataEl).cursor;
  expect(borderCursor).toBe('pointer');

  const labelPoint = centerOf(label);
  const labelHit = deepElementFromPoint(labelPoint.x, labelPoint.y)!;
  expect(getComputedStyle(labelHit).cursor).toBe(borderCursor);

  const controlPoint = centerOf(control);
  const controlHit = deepElementFromPoint(controlPoint.x, controlPoint.y)!;
  expect(getComputedStyle(controlHit).cursor).toBe(borderCursor);

  // Hovering the (inert) body still raises the element-level hover outline.
  await userEvent.hover(dataEl);
  await waitFor(() => getComputedStyle(dataEl).boxShadow.includes('157, 185, 245'));
});

test('the grip keeps its grab cursor and the delete button its pointer cursor over a pointer-transparent body', async () => {
  const el = await mountCanvas();
  await el.importState([{ id: 101, type: 'text', label: 'Name' }]);
  const dataEl = await waitForCanvasElement(el, 101);

  const body = dataEl.querySelector('.element-body') as HTMLElement;
  const grip = dataEl.querySelector('.grip') as HTMLElement;
  const remove = dataEl.querySelector('.remove-btn') as HTMLElement;

  expect(getComputedStyle(body).pointerEvents).toBe('none');
  expect(getComputedStyle(grip).cursor).toBe('grab');
  expect(getComputedStyle(remove).cursor).toBe('pointer');

  // Both are siblings of the body, so the grip stays its own hit target.
  const gripPoint = centerOf(grip);
  const gripHit = deepElementFromPoint(gripPoint.x, gripPoint.y)!;
  expect(grip.contains(gripHit)).toBe(true);
});

test('clicking a data field label or its disabled control selects the element without changing its value', async () => {
  const el = await mountCanvas();
  await el.importState([{ id: 101, type: 'text', label: 'Name' }]);
  const dataEl = await waitForCanvasElement(el, 101);
  const { label, control } = await previewOf(dataEl);

  const selected: number[] = [];
  el.addEventListener('wbFieldSelected', e => selected.push((e as CustomEvent).detail.id));

  await clickAt(centerOf(label));
  await waitFor(() => dataEl.classList.contains('selected'));
  expect(selected).toContain(101);
  expect(control.value).toBe('');

  selected.length = 0;
  await clickAt(centerOf(control));
  expect(selected).toContain(101);
  expect(control.value).toBe('');
  expect(control.disabled).toBe(true);
});

test('a field nested in a row column keeps pointer cursors, selects itself, and leaves the row body interactive', async () => {
  const el = await mountCanvas();
  await el.importState([
    {
      id: 101,
      kind: 'design',
      type: 'text',
      label: 'Row',
      designType: 'row',
      columns: 2,
      children: [[{ id: 102, type: 'text', label: 'Child' }], []],
    },
  ]);
  const rowEl = await waitForCanvasElement(el, 101);
  const childEl = await waitForCanvasElement(el, 102);
  const rowBody = rowEl.querySelector('.element-body') as HTMLElement;
  const childBody = childEl.querySelector('.element-body') as HTMLElement;
  const { label, control } = await previewOf(childEl);

  // The row body was not made pointer-transparent; only the nested leaf body was.
  expect(getComputedStyle(rowBody).pointerEvents).toBe('auto');
  expect(getComputedStyle(childBody).pointerEvents).toBe('none');

  const borderCursor = getComputedStyle(childEl).cursor;
  expect(borderCursor).toBe('pointer');
  const labelPoint = centerOf(label);
  expect(getComputedStyle(deepElementFromPoint(labelPoint.x, labelPoint.y)!).cursor).toBe(borderCursor);
  const controlPoint = centerOf(control);
  expect(getComputedStyle(deepElementFromPoint(controlPoint.x, controlPoint.y)!).cursor).toBe(borderCursor);

  const selected: number[] = [];
  el.addEventListener('wbFieldSelected', e => selected.push((e as CustomEvent).detail.id));
  await clickAt(centerOf(label));
  await waitFor(() => childEl.classList.contains('selected'));
  expect(selected).toEqual([102]);
  expect(rowEl.classList.contains('selected')).toBe(false);
});
