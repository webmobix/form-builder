import { expect, test } from 'vitest';

const mountInspector = async (attrs = '') => {
  document.body.innerHTML = `<wb-inspector ${attrs}></wb-inspector>`;
  const el = document.querySelector('wb-inspector')!;
  await window.customElements.whenDefined('wb-inspector');
  // Adopted stylesheets attach asynchronously; wait until :host rules are applied.
  await new Promise(r => setTimeout(r, 500));
  return el;
};

test('inspector uses default fallback values when no CSS vars are set', async () => {
  const el = await mountInspector();
  const styles = getComputedStyle(el);
  expect(styles.backgroundColor).toBe('rgb(255, 255, 255)');
  expect(styles.borderRadius).toBe('10px');
  expect(styles.paddingTop).toBe('16px');
  expect(styles.fontSize).toBe('14px');
});

test('inspector fills 100% width and has no min-width', async () => {
  const el = await mountInspector();
  const styles = getComputedStyle(el);
  expect(parseInt(styles.width, 10)).toBe(document.body.clientWidth);
  expect(styles.minWidth).toBe('0px');
});

test('inspector honors a width set on the host', async () => {
  const el = await mountInspector('style="width: 300px"');
  const styles = getComputedStyle(el);
  expect(styles.width).toBe('300px');
});

test('inspector honors a CSS custom property override', async () => {
  const el = await mountInspector('style="--wb-inspector-background: #f4f4f2"');
  const styles = getComputedStyle(el);
  expect(styles.backgroundColor).toBe('rgb(244, 244, 242)');
});
