// biome-ignore lint/correctness/noUnusedImports: `h` is required by Stencil's JSX transform at runtime
import { h } from '@stencil/core';
import { render } from '@stencil/vitest';
import type { FieldMeta } from '../../core';

// Importing the source file triggers the on-the-fly compile + customElements.define()
import './wb-inspector';

describe('wb-inspector', () => {
  it('renders empty state when field is null', async () => {
    const { root } = await render(<wb-inspector></wb-inspector>);
    expect(root.shadowRoot!.textContent).toContain('Select a field to edit its settings');
  });

  it('renders field data when a field is loaded', async () => {
    const { root, instance, waitForChanges } = await render(<wb-inspector></wb-inspector>);
    const inspector = instance as any;
    await inspector.setField({ id: 1, type: 'text', label: 'Name' });
    await waitForChanges();
    const input = root.shadowRoot!.querySelector('input') as HTMLInputElement;
    expect(input.value).toBe('Name');
    expect(root.shadowRoot!.textContent).toContain('Field Settings');
  });

  it('rejects empty label with validation error', async () => {
    const { root, instance, waitForChanges } = await render(<wb-inspector></wb-inspector>);
    const inspector = instance as any;
    await inspector.setField({ id: 1, type: 'text', label: 'Name' });
    await waitForChanges();
    const input = root.shadowRoot!.querySelector('input') as HTMLInputElement;
    input.value = '';
    input.dispatchEvent(new Event('input', { bubbles: true }));
    await waitForChanges();
    expect(root.shadowRoot!.textContent).toContain('Label cannot be empty');
  });

  it('emits wbFieldUpdated on label change', async () => {
    const { root, instance, waitForChanges } = await render(<wb-inspector></wb-inspector>);
    const inspector = instance as any;
    const spy = vi.fn();
    root.addEventListener('wbFieldUpdated', spy);
    await inspector.setField({ id: 1, type: 'text', label: 'Name' });
    await waitForChanges();
    const input = root.shadowRoot!.querySelector('input') as HTMLInputElement;
    input.value = 'Full Name';
    input.dispatchEvent(new Event('input', { bubbles: true }));
    await waitForChanges();
    expect(spy).toHaveBeenCalledWith(expect.objectContaining({ detail: { id: 1, patch: { label: 'Full Name' } } }));
  });

  it('renders no type or subtype selectors', async () => {
    const { root, instance, waitForChanges } = await render(<wb-inspector></wb-inspector>);
    const inspector = instance as any;
    await inspector.setField({ id: 1, type: 'text', label: 'Name', subtype: 'email' });
    await waitForChanges();
    expect(root.shadowRoot!.querySelectorAll('select').length).toBe(0);
  });

  it('shows the read-only Field display name for each subtype', async () => {
    const { root, instance, waitForChanges } = await render(<wb-inspector></wb-inspector>);
    const inspector = instance as any;
    const cases: Array<[Partial<FieldMeta>, string]> = [
      [{ type: 'text', subtype: 'email' }, 'Email'],
      [{ type: 'text', subtype: 'password' }, 'Password'],
      [{ type: 'text', subtype: 'url' }, 'URL'],
      [{ type: 'text', subtype: 'number' }, 'Number'],
      [{ type: 'text', subtype: 'text' }, 'Text input'],
      [{ type: 'text' }, 'Text input'],
      [{ type: 'select' }, 'Dropdown'],
      [{ type: 'date' }, 'Date'],
      [{ type: 'checkbox' }, 'Checkbox'],
    ];
    for (const [field, expected] of cases) {
      await inspector.setField({ id: 1, label: 'X', ...field });
      await waitForChanges();
      const display = root.shadowRoot!.querySelector('.field-display') as HTMLElement;
      expect(display.textContent).toBe(expected);
    }
  });

  it('shows number restriction inputs for number subtype', async () => {
    const { root, instance, waitForChanges } = await render(<wb-inspector></wb-inspector>);
    const inspector = instance as any;
    await inspector.setField({ id: 1, type: 'text', label: 'Age', subtype: 'number' });
    await waitForChanges();
    const inputs = root.shadowRoot!.querySelectorAll('input[type="number"]');
    expect(inputs.length).toBe(3);
  });

  it('shows maxLength input for text-like subtypes', async () => {
    const { root, instance, waitForChanges } = await render(<wb-inspector></wb-inspector>);
    const inspector = instance as any;
    for (const subtype of ['text', 'email', 'url', 'password', 'tel']) {
      await inspector.setField({ id: 1, type: 'text', label: 'X', subtype });
      await waitForChanges();
      const inputs = root.shadowRoot!.querySelectorAll('input[type="number"]');
      expect(inputs.length).toBe(1);
    }
  });

  it('hides maxLength input for number subtype', async () => {
    const { root, instance, waitForChanges } = await render(<wb-inspector></wb-inspector>);
    const inspector = instance as any;
    await inspector.setField({ id: 1, type: 'text', label: 'Age', subtype: 'number' });
    await waitForChanges();
    const inputs = root.shadowRoot!.querySelectorAll('input[type="number"]');
    expect(inputs.length).toBe(3);
  });

  it('hides restriction inputs for non-text types', async () => {
    const { root, instance, waitForChanges } = await render(<wb-inspector></wb-inspector>);
    const inspector = instance as any;
    await inspector.setField({ id: 1, type: 'checkbox', label: 'Agree' });
    await waitForChanges();
    const inputs = root.shadowRoot!.querySelectorAll('input[type="number"]');
    expect(inputs.length).toBe(0);
  });

  it('emits wbFieldUpdated on restriction edit', async () => {
    const { root, instance, waitForChanges } = await render(<wb-inspector></wb-inspector>);
    const inspector = instance as any;
    const spy = vi.fn();
    root.addEventListener('wbFieldUpdated', spy);
    await inspector.setField({ id: 1, type: 'text', label: 'Age', subtype: 'number' });
    await waitForChanges();
    const inputs = root.shadowRoot!.querySelectorAll('input[type="number"]');
    const minInput = inputs[0] as HTMLInputElement;
    minInput.value = '0';
    minInput.dispatchEvent(new Event('input', { bubbles: true }));
    await waitForChanges();
    expect(spy).toHaveBeenCalledWith(
      expect.objectContaining({
        detail: expect.objectContaining({
          id: 1,
          patch: expect.objectContaining({
            restrictions: expect.objectContaining({
              number: expect.objectContaining({ min: 0 }),
            }),
          }),
        }),
      }),
    );
  });

  it('blank restriction values are treated as unset (undefined)', async () => {
    const { root, instance, waitForChanges } = await render(<wb-inspector></wb-inspector>);
    const inspector = instance as any;
    const spy = vi.fn();
    root.addEventListener('wbFieldUpdated', spy);
    await inspector.setField({ id: 1, type: 'text', label: 'Age', subtype: 'number', restrictions: { number: { min: 0, max: 100, step: 1 } } });
    await waitForChanges();
    const inputs = root.shadowRoot!.querySelectorAll('input[type="number"]');
    const minInput = inputs[0] as HTMLInputElement;
    minInput.value = '';
    minInput.dispatchEvent(new Event('input', { bubbles: true }));
    await waitForChanges();
    const call = spy.mock.calls[0][0].detail;
    expect(call.patch.restrictions.number.min).toBeUndefined();
  });
});

describe('wb-inspector multiline controls', () => {
  const multilineCheckbox = (root: HTMLElement) => {
    const labels = Array.from(root.shadowRoot!.querySelectorAll('.field-group--checkbox'));
    return labels.map(l => l.textContent).find(t => t?.includes('Multiline'));
  };

  it('shows the Multiline toggle for plain-text fields', async () => {
    const { root, instance, waitForChanges } = await render(<wb-inspector></wb-inspector>);
    const inspector = instance as any;
    await inspector.setField({ id: 1, type: 'text', label: 'Notes' });
    await waitForChanges();
    expect(multilineCheckbox(root)).toBeTruthy();
  });

  it('hides the Multiline toggle for non-text fields', async () => {
    const { root, instance, waitForChanges } = await render(<wb-inspector></wb-inspector>);
    const inspector = instance as any;
    await inspector.setField({ id: 1, type: 'checkbox', label: 'Agree' });
    await waitForChanges();
    expect(multilineCheckbox(root)).toBeFalsy();
  });

  it('hides the Multiline toggle for non-plain-text subtypes', async () => {
    const { root, instance, waitForChanges } = await render(<wb-inspector></wb-inspector>);
    const inspector = instance as any;
    await inspector.setField({ id: 1, type: 'text', label: 'Age', subtype: 'number' });
    await waitForChanges();
    expect(multilineCheckbox(root)).toBeFalsy();
  });

  it('shows initialLines and maxHeight inputs only when multiline is true', async () => {
    const { root, instance, waitForChanges } = await render(<wb-inspector></wb-inspector>);
    const inspector = instance as any;
    await inspector.setField({ id: 1, type: 'text', label: 'Notes', subtype: 'text', multiline: false });
    await waitForChanges();
    expect(root.shadowRoot!.textContent).not.toContain('Initial Lines');

    await inspector.setField({ id: 1, type: 'text', label: 'Notes', subtype: 'text', multiline: true, initialLines: 5, maxHeight: 200 });
    await waitForChanges();
    expect(root.shadowRoot!.textContent).toContain('Initial Lines');
    expect(root.shadowRoot!.textContent).toContain('Max Height');
  });

  it('emits a patch clearing initialLines and maxHeight when multiline is toggled off', async () => {
    const { root, instance, waitForChanges } = await render(<wb-inspector></wb-inspector>);
    const inspector = instance as any;
    const spy = vi.fn();
    root.addEventListener('wbFieldUpdated', spy);
    await inspector.setField({ id: 1, type: 'text', label: 'Notes', subtype: 'text', multiline: true, initialLines: 5, maxHeight: 200 });
    await waitForChanges();
    const checkbox = Array.from(root.shadowRoot!.querySelectorAll('.field-group--checkbox'))
      .find(l => l.textContent?.includes('Multiline'))!
      .querySelector('input[type="checkbox"]') as HTMLInputElement;
    checkbox.checked = false;
    checkbox.dispatchEvent(new Event('change', { bubbles: true }));
    await waitForChanges();
    expect(spy).toHaveBeenCalledWith(
      expect.objectContaining({
        detail: expect.objectContaining({
          id: 1,
          patch: expect.objectContaining({ multiline: false, initialLines: undefined, maxHeight: undefined }),
        }),
      }),
    );
  });
});

describe('wb-inspector design-only elements', () => {
  it('heading element shows label and Element display and no data-field-only controls', async () => {
    const { root, instance, waitForChanges } = await render(<wb-inspector></wb-inspector>);
    const inspector = instance as any;
    await inspector.setField({ id: 1, kind: 'design', type: 'text', label: 'Personal', designType: 'heading' });
    await waitForChanges();
    const labelInput = root.shadowRoot!.querySelector('input') as HTMLInputElement;
    expect(labelInput.value).toBe('Personal');
    expect(root.shadowRoot!.querySelector('.field-display')?.textContent).toBe('Title/Headline');
    expect(root.shadowRoot!.textContent).not.toContain('Required');
    expect(root.shadowRoot!.querySelector('textarea')).toBeNull();
    expect(root.shadowRoot!.querySelector('input[type="number"]')).toBeNull();
  });

  it('paragraph element shows a text textarea bound to text', async () => {
    const { root, instance, waitForChanges } = await render(<wb-inspector></wb-inspector>);
    const inspector = instance as any;
    const spy = vi.fn();
    root.addEventListener('wbFieldUpdated', spy);
    await inspector.setField({ id: 2, kind: 'design', type: 'text', label: 'Intro', designType: 'paragraph', text: 'Hi' });
    await waitForChanges();
    expect(root.shadowRoot!.querySelector('.field-display')?.textContent).toBe('Paragraph');
    const textarea = root.shadowRoot!.querySelector('textarea') as HTMLTextAreaElement;
    expect(textarea).not.toBeNull();
    expect(textarea.getAttribute('value')).toBe('Hi');
    textarea.value = 'Updated prose';
    textarea.dispatchEvent(new Event('input', { bubbles: true }));
    await waitForChanges();
    expect(spy).toHaveBeenCalledWith(expect.objectContaining({ detail: { id: 2, patch: { text: 'Updated prose' } } }));
  });

  it('row container element shows a columns numeric input bound to columns', async () => {
    const { root, instance, waitForChanges } = await render(<wb-inspector></wb-inspector>);
    const inspector = instance as any;
    const spy = vi.fn();
    root.addEventListener('wbFieldUpdated', spy);
    await inspector.setField({ id: 3, kind: 'design', type: 'text', label: 'Row', designType: 'row', columns: 2, children: [[], []] });
    await waitForChanges();
    expect(root.shadowRoot!.querySelector('.field-display')?.textContent).toBe('Row container');
    const numInput = root.shadowRoot!.querySelector('input[type="number"]') as HTMLInputElement;
    expect(numInput).not.toBeNull();
    expect(numInput.getAttribute('min')).toBe('1');
    expect(numInput.getAttribute('max')).toBe('4');
    expect(numInput.value).toBe('2');
    numInput.value = '3';
    numInput.dispatchEvent(new Event('input', { bubbles: true }));
    await waitForChanges();
    expect(spy).toHaveBeenCalledWith(expect.objectContaining({ detail: { id: 3, patch: { columns: 3 } } }));
  });

  it('hides Required and all data-field-only controls for every designType', async () => {
    const { root, instance, waitForChanges } = await render(<wb-inspector></wb-inspector>);
    const inspector = instance as any;
    for (const designType of ['heading', 'paragraph', 'row'] as const) {
      await inspector.setField({
        id: 1,
        kind: 'design',
        type: 'text',
        label: 'X',
        designType,
        ...(designType === 'paragraph' ? { text: '' } : {}),
        ...(designType === 'row' ? { columns: 2, children: [[], []] } : {}),
      });
      await waitForChanges();
      expect(root.shadowRoot!.textContent).not.toContain('Required');
      expect(root.shadowRoot!.textContent).not.toContain('Max Length');
      expect(root.shadowRoot!.textContent).not.toContain('Multiline');
    }
  });
});
