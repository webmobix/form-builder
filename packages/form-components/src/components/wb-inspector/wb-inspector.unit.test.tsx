// biome-ignore lint/correctness/noUnusedImports: `h` is required by Stencil's JSX transform at runtime
import { h } from '@stencil/core';
import { render } from '@stencil/vitest';
import type { InspectorExtension } from '../../core';

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

  it('uses plain field-label for stacked labels and field-label--checkbox for checkbox labels', async () => {
    const { root, instance, waitForChanges } = await render(<wb-inspector></wb-inspector>);
    const inspector = instance as any;
    await inspector.setField({ id: 1, type: 'text', label: 'Name' });
    await waitForChanges();

    const checkboxLabels = Array.from(root.shadowRoot!.querySelectorAll('.field-group--checkbox .field-label')) as HTMLElement[];
    expect(checkboxLabels.length).toBeGreaterThan(0);
    for (const label of checkboxLabels) {
      expect(label.classList.contains('field-label')).toBe(true);
      expect(label.classList.contains('field-label--checkbox')).toBe(true);
    }

    const stackedLabel = root.shadowRoot!.querySelector('.field-group:not(.field-group--checkbox) .field-label') as HTMLElement;
    expect(stackedLabel).not.toBeNull();
    expect(stackedLabel.classList.contains('field-label')).toBe(true);
    expect(stackedLabel.classList.contains('field-label--checkbox')).toBe(false);
  });

  it('does not render the read-only data-field type name', async () => {
    const { root, instance, waitForChanges } = await render(<wb-inspector></wb-inspector>);
    const inspector = instance as any;
    await inspector.setField({ id: 1, type: 'text', label: 'X' });
    await waitForChanges();
    expect(root.shadowRoot!.textContent).not.toContain('Text input');
    await inspector.setField({ id: 1, type: 'select', label: 'X' });
    await waitForChanges();
    expect(root.shadowRoot!.textContent).not.toContain('Dropdown');
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

describe('wb-inspector options editor', () => {
  it('renders the Options editor for a select field', async () => {
    const { root, instance, waitForChanges } = await render(<wb-inspector></wb-inspector>);
    const inspector = instance as any;
    await inspector.setField({
      id: 1,
      type: 'select',
      label: 'Country',
      options: [
        { key: 'us', label: 'US' },
        { key: 'ca', label: 'CA' },
      ],
    });
    await waitForChanges();
    expect(root.shadowRoot!.textContent).toContain('Options');
    const inputs = root.shadowRoot!.querySelectorAll('.options-editor__row input');
    expect(inputs.length).toBe(2);
    expect((inputs[0] as HTMLInputElement).value).toBe('US');
    expect((inputs[1] as HTMLInputElement).value).toBe('CA');
    expect(root.shadowRoot!.textContent).toContain('Add option');
  });

  it('hides the Options editor for non-select fields', async () => {
    const { root, instance, waitForChanges } = await render(<wb-inspector></wb-inspector>);
    const inspector = instance as any;
    await inspector.setField({ id: 1, type: 'text', label: 'Name' });
    await waitForChanges();
    expect(root.shadowRoot!.querySelector('.options-editor')).toBeNull();
    expect(root.shadowRoot!.textContent).not.toContain('Options');
  });

  it('emits a patch when editing an option label (key follows label)', async () => {
    const { root, instance, waitForChanges } = await render(<wb-inspector></wb-inspector>);
    const inspector = instance as any;
    const spy = vi.fn();
    root.addEventListener('wbFieldUpdated', spy);
    await inspector.setField({
      id: 1,
      type: 'select',
      label: 'Country',
      options: [{ key: 'a', label: 'A' }],
    });
    await waitForChanges();
    const input = root.shadowRoot!.querySelector('.options-editor__row input') as HTMLInputElement;
    input.value = 'Apple';
    input.dispatchEvent(new Event('input', { bubbles: true }));
    await waitForChanges();
    expect(spy).toHaveBeenCalledWith(
      expect.objectContaining({
        detail: expect.objectContaining({
          id: 1,
          patch: expect.objectContaining({ options: [{ key: 'Apple', label: 'Apple' }] }),
        }),
      }),
    );
  });

  it('emits a patch when adding an option, preserving order', async () => {
    const { root, instance, waitForChanges } = await render(<wb-inspector></wb-inspector>);
    const inspector = instance as any;
    const spy = vi.fn();
    root.addEventListener('wbFieldUpdated', spy);
    await inspector.setField({
      id: 1,
      type: 'select',
      label: 'Country',
      options: [{ key: 'a', label: 'A' }],
    });
    await waitForChanges();
    const addBtn = Array.from(root.shadowRoot!.querySelectorAll('button')).find(b => b.textContent === 'Add option')!;
    addBtn.click();
    await waitForChanges();
    expect(spy).toHaveBeenCalledWith(
      expect.objectContaining({
        detail: expect.objectContaining({
          patch: expect.objectContaining({
            options: [
              { key: 'a', label: 'A' },
              { key: '', label: '' },
            ],
          }),
        }),
      }),
    );
  });

  it('emits a patch when removing an option, preserving the order of the rest', async () => {
    const { root, instance, waitForChanges } = await render(<wb-inspector></wb-inspector>);
    const inspector = instance as any;
    const spy = vi.fn();
    root.addEventListener('wbFieldUpdated', spy);
    await inspector.setField({
      id: 1,
      type: 'select',
      label: 'Country',
      options: [
        { key: 'a', label: 'A' },
        { key: 'b', label: 'B' },
        { key: 'c', label: 'C' },
      ],
    });
    await waitForChanges();
    const removeBtns = root.shadowRoot!.querySelectorAll('.options-editor__remove');
    (removeBtns[1] as HTMLButtonElement).click();
    await waitForChanges();
    expect(spy).toHaveBeenCalledWith(
      expect.objectContaining({
        detail: expect.objectContaining({
          patch: expect.objectContaining({
            options: [
              { key: 'a', label: 'A' },
              { key: 'c', label: 'C' },
            ],
          }),
        }),
      }),
    );
  });

  it('does not emit an options patch for non-select fields', async () => {
    const { root, instance, waitForChanges } = await render(<wb-inspector></wb-inspector>);
    const inspector = instance as any;
    const spy = vi.fn();
    root.addEventListener('wbFieldUpdated', spy);
    await inspector.setField({ id: 1, type: 'checkbox', label: 'Agree' });
    await waitForChanges();
    const inputs = root.shadowRoot!.querySelectorAll('.options-editor__row input');
    expect(inputs.length).toBe(0);
    expect(spy).not.toHaveBeenCalled();
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

describe('wb-inspector delete button', () => {
  it('renders the Delete button in the data-field panel by default', async () => {
    const { root, instance, waitForChanges } = await render(<wb-inspector></wb-inspector>);
    const inspector = instance as any;
    await inspector.setField({ id: 1, type: 'text', label: 'Name' });
    await waitForChanges();
    const btn = root.shadowRoot!.querySelector('.delete-btn') as HTMLButtonElement;
    expect(btn).not.toBeNull();
    expect(btn.textContent).toBe('Delete');
  });

  it('renders the Delete button in the design-element panel by default', async () => {
    const { root, instance, waitForChanges } = await render(<wb-inspector></wb-inspector>);
    const inspector = instance as any;
    await inspector.setField({ id: 2, kind: 'design', type: 'text', label: 'Title', designType: 'heading' });
    await waitForChanges();
    expect(root.shadowRoot!.querySelector('.delete-btn')).not.toBeNull();
  });

  it('hides the Delete button in the data-field panel when showDeleteFieldButton is false', async () => {
    const { root, instance, waitForChanges } = await render(<wb-inspector></wb-inspector>);
    const inspector = instance as any;
    inspector.showDeleteFieldButton = false;
    await inspector.setField({ id: 1, type: 'text', label: 'Name' });
    await waitForChanges();
    expect(root.shadowRoot!.querySelector('.delete-btn')).toBeNull();
  });

  it('hides the Delete button in the design-element panel when showDeleteFieldButton is false', async () => {
    const { root, instance, waitForChanges } = await render(<wb-inspector></wb-inspector>);
    const inspector = instance as any;
    inspector.showDeleteFieldButton = false;
    await inspector.setField({ id: 2, kind: 'design', type: 'text', label: 'Intro', designType: 'paragraph', text: '' });
    await waitForChanges();
    expect(root.shadowRoot!.querySelector('.delete-btn')).toBeNull();
  });

  it('renders the Delete button when showDeleteFieldButton is explicitly true', async () => {
    const { root, instance, waitForChanges } = await render(<wb-inspector></wb-inspector>);
    const inspector = instance as any;
    inspector.showDeleteFieldButton = true;
    await inspector.setField({ id: 1, type: 'text', label: 'Name' });
    await waitForChanges();
    expect(root.shadowRoot!.querySelector('.delete-btn')).not.toBeNull();
  });

  it('emits wbInspectDelete with the selected id when Delete is clicked', async () => {
    const { root, instance, waitForChanges } = await render(<wb-inspector></wb-inspector>);
    const inspector = instance as any;
    const spy = vi.fn();
    root.addEventListener('wbInspectDelete', spy);
    await inspector.setField({ id: 12, type: 'text', label: 'Name' });
    await waitForChanges();
    (root.shadowRoot!.querySelector('.delete-btn') as HTMLButtonElement).click();
    await waitForChanges();
    expect(spy).toHaveBeenCalledWith(expect.objectContaining({ detail: { id: 12 } }));
  });
});

const dataAndDesignShape: InspectorExtension = {
  data: [{ title: 'Data extras', fields: [{ type: 'checkbox', key: 'pii', label: 'Contains PII' }] }],
  design: [{ title: 'Design extras', fields: [{ type: 'checkbox', key: 'decorative', label: 'Decorative' }] }],
};

const extensionCheckboxes = (root: HTMLElement) => Array.from(root.shadowRoot!.querySelectorAll('.extension-section .field-group--checkbox')) as HTMLElement[];

const extensionCheckboxByLabel = (root: HTMLElement, label: string) =>
  extensionCheckboxes(root)
    .find(group => group.textContent?.includes(label))
    ?.querySelector('input[type="checkbox"]') as HTMLInputElement | undefined;

describe('wb-inspector extension shape', () => {
  it('sets the shape via setExtension and renders the selected element kind', async () => {
    const { root, instance, waitForChanges } = await render(<wb-inspector></wb-inspector>);
    const inspector = instance as any;
    await inspector.setExtension(dataAndDesignShape);
    await inspector.setField({ id: 1, type: 'text', label: 'Name' });
    await waitForChanges();
    expect(root.shadowRoot!.textContent).toContain('Data extras');
    expect(root.shadowRoot!.textContent).not.toContain('Design extras');
    expect(root.shadowRoot!.textContent).toContain('Contains PII');
  });

  it('sets the shape via the extension property', async () => {
    const { root, instance, waitForChanges } = await render(<wb-inspector></wb-inspector>);
    const inspector = instance as any;
    inspector.extension = dataAndDesignShape;
    await inspector.setField({ id: 1, type: 'text', label: 'Name' });
    await waitForChanges();
    expect(root.shadowRoot!.textContent).toContain('Data extras');
  });

  it('renders no sections when no shape is supplied', async () => {
    const { root, instance, waitForChanges } = await render(<wb-inspector></wb-inspector>);
    const inspector = instance as any;
    await inspector.setField({ id: 1, type: 'text', label: 'Name' });
    await waitForChanges();
    expect(root.shadowRoot!.querySelectorAll('.extension-section').length).toBe(0);
  });

  it('renders no sections when the shape is empty', async () => {
    const { root, instance, waitForChanges } = await render(<wb-inspector></wb-inspector>);
    const inspector = instance as any;
    await inspector.setExtension({});
    await inspector.setField({ id: 1, type: 'text', label: 'Name' });
    await waitForChanges();
    expect(root.shadowRoot!.querySelectorAll('.extension-section').length).toBe(0);
  });

  it('renders data sections only for a data element', async () => {
    const { root, instance, waitForChanges } = await render(<wb-inspector></wb-inspector>);
    const inspector = instance as any;
    await inspector.setExtension(dataAndDesignShape);
    await inspector.setField({ id: 1, type: 'text', label: 'Name' });
    await waitForChanges();
    expect(extensionCheckboxByLabel(root, 'Contains PII')).toBeTruthy();
    expect(extensionCheckboxByLabel(root, 'Decorative')).toBeUndefined();
  });

  it('renders design sections only for a design element', async () => {
    const { root, instance, waitForChanges } = await render(<wb-inspector></wb-inspector>);
    const inspector = instance as any;
    await inspector.setExtension(dataAndDesignShape);
    await inspector.setField({ id: 2, kind: 'design', type: 'text', label: 'Intro', designType: 'paragraph', text: '' });
    await waitForChanges();
    expect(extensionCheckboxByLabel(root, 'Decorative')).toBeTruthy();
    expect(extensionCheckboxByLabel(root, 'Contains PII')).toBeUndefined();
    expect(root.shadowRoot!.textContent).toContain('Design extras');
  });

  it('renders no sections when no element is selected', async () => {
    const { root, instance, waitForChanges } = await render(<wb-inspector></wb-inspector>);
    const inspector = instance as any;
    await inspector.setExtension(dataAndDesignShape);
    await waitForChanges();
    expect(root.shadowRoot!.querySelectorAll('.extension-section').length).toBe(0);
  });

  it('renders the section title as a heading', async () => {
    const { root, instance, waitForChanges } = await render(<wb-inspector></wb-inspector>);
    const inspector = instance as any;
    await inspector.setExtension(dataAndDesignShape);
    await inspector.setField({ id: 1, type: 'text', label: 'Name' });
    await waitForChanges();
    const title = root.shadowRoot!.querySelector('.extension-section__title');
    expect(title?.textContent).toBe('Data extras');
  });

  it('renders every declared entry with no conditional hiding', async () => {
    const { root, instance, waitForChanges } = await render(<wb-inspector></wb-inspector>);
    const inspector = instance as any;
    await inspector.setExtension({
      data: [
        {
          fields: [
            { type: 'checkbox', key: 'a', label: 'Alpha' },
            { type: 'checkbox', key: 'b', label: 'Beta' },
          ],
        },
      ],
    });
    await inspector.setField({ id: 1, type: 'text', label: 'Name' });
    await waitForChanges();
    expect(extensionCheckboxes(root).length).toBe(2);
  });

  it('ignores an unrecognized entry type while rendering supported entries', async () => {
    const { root, instance, waitForChanges } = await render(<wb-inspector></wb-inspector>);
    const inspector = instance as any;
    const shape = {
      data: [
        {
          fields: [
            { type: 'checkbox', key: 'pii', label: 'Contains PII' },
            { type: 'future-kind', key: 'x', label: 'Future' },
          ],
        },
      ],
    } as unknown as InspectorExtension;
    await inspector.setExtension(shape);
    await inspector.setField({ id: 1, type: 'text', label: 'Name' });
    await waitForChanges();
    expect(extensionCheckboxByLabel(root, 'Contains PII')).toBeTruthy();
    expect(root.shadowRoot!.textContent).not.toContain('Future');
    expect(extensionCheckboxes(root).length).toBe(1);
  });

  it('renders checked when metadata[key] is true', async () => {
    const { root, instance, waitForChanges } = await render(<wb-inspector></wb-inspector>);
    const inspector = instance as any;
    await inspector.setExtension(dataAndDesignShape);
    await inspector.setField({ id: 1, type: 'text', label: 'Name', metadata: { pii: true } });
    await waitForChanges();
    expect(extensionCheckboxByLabel(root, 'Contains PII')?.checked).toBe(true);
  });

  it('renders unchecked when stored false overrides a true default', async () => {
    const { root, instance, waitForChanges } = await render(<wb-inspector></wb-inspector>);
    const inspector = instance as any;
    await inspector.setExtension({ data: [{ fields: [{ type: 'checkbox', key: 'pii', label: 'Contains PII', defaultState: true }] }] });
    await inspector.setField({ id: 1, type: 'text', label: 'Name', metadata: { pii: false } });
    await waitForChanges();
    expect(extensionCheckboxByLabel(root, 'Contains PII')?.checked).toBe(false);
  });

  it('renders checked when the value is undefined and defaultState is true', async () => {
    const { root, instance, waitForChanges } = await render(<wb-inspector></wb-inspector>);
    const inspector = instance as any;
    await inspector.setExtension({ data: [{ fields: [{ type: 'checkbox', key: 'pii', label: 'Contains PII', defaultState: true }] }] });
    await inspector.setField({ id: 1, type: 'text', label: 'Name' });
    await waitForChanges();
    expect(extensionCheckboxByLabel(root, 'Contains PII')?.checked).toBe(true);
  });

  it('renders unchecked when the value is undefined and defaultState is absent', async () => {
    const { root, instance, waitForChanges } = await render(<wb-inspector></wb-inspector>);
    const inspector = instance as any;
    await inspector.setExtension(dataAndDesignShape);
    await inspector.setField({ id: 1, type: 'text', label: 'Name' });
    await waitForChanges();
    expect(extensionCheckboxByLabel(root, 'Contains PII')?.checked).toBe(false);
  });
});

describe('wb-inspector extension metadata', () => {
  it('seeds missing keys in a single event when an element is selected', async () => {
    const { root, instance, waitForChanges } = await render(<wb-inspector></wb-inspector>);
    const inspector = instance as any;
    const spy = vi.fn();
    root.addEventListener('wbFieldUpdated', spy);
    await inspector.setExtension({
      data: [
        {
          fields: [
            { type: 'checkbox', key: 'pii', label: 'Contains PII', defaultState: true },
            { type: 'checkbox', key: 'archived', label: 'Archived' },
          ],
        },
      ],
    });
    await inspector.setField({ id: 7, type: 'text', label: 'Name' });
    await waitForChanges();
    expect(spy).toHaveBeenCalledTimes(1);
    expect(spy).toHaveBeenCalledWith(expect.objectContaining({ detail: { id: 7, patch: { metadata: { pii: true, archived: false } } } }));
  });

  it('does not emit on selection when metadata already contains every declared key', async () => {
    const { root, instance, waitForChanges } = await render(<wb-inspector></wb-inspector>);
    const inspector = instance as any;
    const spy = vi.fn();
    root.addEventListener('wbFieldUpdated', spy);
    await inspector.setExtension(dataAndDesignShape);
    await inspector.setField({ id: 7, type: 'text', label: 'Name', metadata: { pii: false } });
    await waitForChanges();
    expect(spy).not.toHaveBeenCalled();
  });

  it('seeds false for a missing key with no defaultState', async () => {
    const { root, instance, waitForChanges } = await render(<wb-inspector></wb-inspector>);
    const inspector = instance as any;
    const spy = vi.fn();
    root.addEventListener('wbFieldUpdated', spy);
    await inspector.setExtension(dataAndDesignShape);
    await inspector.setField({ id: 7, type: 'text', label: 'Name' });
    await waitForChanges();
    expect(spy.mock.calls[0][0].detail.patch.metadata).toEqual({ pii: false });
  });

  it('seeds newly declared keys and emits once when the shape changes while selected', async () => {
    const { root, instance, waitForChanges } = await render(<wb-inspector></wb-inspector>);
    const inspector = instance as any;
    await inspector.setExtension({ data: [{ fields: [{ type: 'checkbox', key: 'a', label: 'A' }] }] });
    await inspector.setField({ id: 7, type: 'text', label: 'Name', metadata: { a: false } });
    await waitForChanges();
    const spy = vi.fn();
    root.addEventListener('wbFieldUpdated', spy);
    await inspector.setExtension({
      data: [
        {
          fields: [
            { type: 'checkbox', key: 'a', label: 'A' },
            { type: 'checkbox', key: 'b', label: 'B', defaultState: true },
          ],
        },
      ],
    });
    await waitForChanges();
    expect(spy).toHaveBeenCalledTimes(1);
    expect(spy).toHaveBeenCalledWith(expect.objectContaining({ detail: { id: 7, patch: { metadata: { a: false, b: true } } } }));
  });

  it('emits a metadata patch when a checkbox is toggled', async () => {
    const { root, instance, waitForChanges } = await render(<wb-inspector></wb-inspector>);
    const inspector = instance as any;
    await inspector.setExtension(dataAndDesignShape);
    await inspector.setField({ id: 7, type: 'text', label: 'Name', metadata: { pii: false } });
    await waitForChanges();
    const spy = vi.fn();
    root.addEventListener('wbFieldUpdated', spy);
    const checkbox = extensionCheckboxByLabel(root, 'Contains PII')!;
    checkbox.checked = true;
    checkbox.dispatchEvent(new Event('change', { bubbles: true }));
    await waitForChanges();
    expect(spy).toHaveBeenCalledWith(expect.objectContaining({ detail: { id: 7, patch: { metadata: { pii: true } } } }));
  });

  it('preserves undeclared metadata keys in the toggled map', async () => {
    const { root, instance, waitForChanges } = await render(<wb-inspector></wb-inspector>);
    const inspector = instance as any;
    await inspector.setExtension(dataAndDesignShape);
    await inspector.setField({ id: 7, type: 'text', label: 'Name', metadata: { pii: false, legacy: 'keep' } });
    await waitForChanges();
    const spy = vi.fn();
    root.addEventListener('wbFieldUpdated', spy);
    const checkbox = extensionCheckboxByLabel(root, 'Contains PII')!;
    checkbox.checked = true;
    checkbox.dispatchEvent(new Event('change', { bubbles: true }));
    await waitForChanges();
    expect(spy.mock.calls[0][0].detail.patch.metadata).toEqual({ pii: true, legacy: 'keep' });
  });
});
