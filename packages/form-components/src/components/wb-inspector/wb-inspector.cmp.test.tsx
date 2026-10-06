import { expect, test } from 'vitest';

const mountInspector = async (attrs = '') => {
  document.body.innerHTML = `<wb-inspector ${attrs}></wb-inspector>`;
  const el = document.querySelector('wb-inspector')!;
  await window.customElements.whenDefined('wb-inspector');
  // Adopted stylesheets attach asynchronously; wait until :host rules are applied.
  await new Promise(r => setTimeout(r, 500));
  return el;
};

const mountInspectorWithField = async (attrs = '', field: Record<string, unknown> = { id: 1, type: 'text', label: 'Name' }) => {
  document.body.innerHTML = `<wb-inspector ${attrs}></wb-inspector>`;
  const el = document.querySelector('wb-inspector') as any;
  await window.customElements.whenDefined('wb-inspector');
  await el.setField(field);
  // Let Stencil render and adopted stylesheets settle after the update.
  await new Promise(r => setTimeout(r, 500));
  return el;
};

const labelPair = (el: any) => {
  const stacked = el.shadowRoot!.querySelector('.field-group:not(.field-group--checkbox) .field-label') as HTMLElement;
  const checkbox = el.shadowRoot!.querySelector('.field-group--checkbox .field-label') as HTMLElement;
  return { stacked, checkbox };
};

test('stacked and checkbox labels differ in weight and letter-spacing by default', async () => {
  const el = await mountInspectorWithField();
  const { stacked, checkbox } = labelPair(el);
  expect(stacked).not.toBeNull();
  expect(checkbox).not.toBeNull();
  const stackedStyle = getComputedStyle(stacked);
  const checkboxStyle = getComputedStyle(checkbox);
  expect(stackedStyle.fontWeight).not.toBe(checkboxStyle.fontWeight);
  expect(stackedStyle.letterSpacing).not.toBe(checkboxStyle.letterSpacing);
});

test('--wb-inspector-field-label-color cascades to both label kinds', async () => {
  const el = await mountInspectorWithField('style="--wb-inspector-field-label-color: #ff0000"');
  const { stacked, checkbox } = labelPair(el);
  expect(getComputedStyle(stacked).color).toBe('rgb(255, 0, 0)');
  expect(getComputedStyle(checkbox).color).toBe('rgb(255, 0, 0)');
});

test('checkbox label properties override only the checkbox label', async () => {
  const el = await mountInspectorWithField(
    'style="--wb-inspector-field-label-color: #ff0000; --wb-inspector-checkbox-label-color: #00ff00; --wb-inspector-checkbox-label-font-weight: 700"',
  );
  const { stacked, checkbox } = labelPair(el);
  expect(getComputedStyle(stacked).color).toBe('rgb(255, 0, 0)');
  expect(getComputedStyle(checkbox).color).toBe('rgb(0, 255, 0)');
  expect(getComputedStyle(stacked).fontWeight).toBe('600');
  expect(getComputedStyle(checkbox).fontWeight).toBe('700');
});

test('extension section titles use the field label properties', async () => {
  document.body.innerHTML = `<wb-inspector style="--wb-inspector-field-label-color: #ff0000; --wb-inspector-field-label-font-weight: 700"></wb-inspector>`;
  const el = document.querySelector('wb-inspector') as any;
  await window.customElements.whenDefined('wb-inspector');
  await el.setExtension({ data: [{ title: 'Extras', fields: [{ type: 'checkbox', key: 'pii', label: 'PII' }] }] });
  await el.setField({ id: 1, type: 'text', label: 'Name' });
  await new Promise(r => setTimeout(r, 500));
  const title = el.shadowRoot!.querySelector('.extension-section__title') as HTMLElement;
  expect(title).not.toBeNull();
  const titleStyle = getComputedStyle(title);
  expect(titleStyle.color).toBe('rgb(255, 0, 0)');
  expect(titleStyle.fontWeight).toBe('700');
  expect(titleStyle.fontSize).toBe('14px');
});

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
