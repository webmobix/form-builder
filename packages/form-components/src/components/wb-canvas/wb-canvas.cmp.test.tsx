import { expect, test } from 'vitest';

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
