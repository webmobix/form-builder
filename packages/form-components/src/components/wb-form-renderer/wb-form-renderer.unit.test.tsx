// biome-ignore lint/correctness/noUnusedImports: `h` is required by Stencil's JSX transform at runtime
import { h } from '@stencil/core';
import { render } from '@stencil/vitest';

// Importing the source files triggers the on-the-fly compile + customElements.define()
import './wb-form-renderer';
import '../wb-form-field/wb-form-field';

describe('wb-form-renderer', () => {
  it('renders form shell with no field children when fields is empty', async () => {
    const { root } = await render(<wb-form-renderer></wb-form-renderer>);
    const form = root.shadowRoot!.querySelector('form')!;
    const fieldsContainer = form.querySelector('.fields')!;
    expect(fieldsContainer.children.length).toBe(0);
  });

  it('renders one wb-form-field with correct name, label, type', async () => {
    const { root, instance, waitForChanges } = await render(<wb-form-renderer></wb-form-renderer>);
    const renderer = instance as any;
    await renderer.setFields([{ id: 1, type: 'text', label: 'Name' }]);
    await waitForChanges();
    const field = root.shadowRoot!.querySelector('wb-form-field') as any;
    expect(field.name).toBe('field.1');
    expect(field.label).toBe('Name');
    expect(field.type).toBe('text');
  });

  it('renders multiple fields each with unique name from id', async () => {
    const { root, instance, waitForChanges } = await render(<wb-form-renderer></wb-form-renderer>);
    const renderer = instance as any;
    await renderer.setFields([
      { id: 1, type: 'text', label: 'A' },
      { id: 2, type: 'checkbox', label: 'B' },
    ]);
    await waitForChanges();
    const fields = root.shadowRoot!.querySelectorAll('wb-form-field');
    expect(fields.length).toBe(2);
    expect((fields[0] as any).name).toBe('field.1');
    expect((fields[1] as any).name).toBe('field.2');
    expect((fields[0] as any).label).toBe('A');
    expect((fields[1] as any).label).toBe('B');
  });

  it('forwards subtype and restrictions to wb-form-field', async () => {
    const { root, instance, waitForChanges } = await render(<wb-form-renderer></wb-form-renderer>);
    const renderer = instance as any;
    await renderer.setFields([{ id: 3, type: 'text', label: 'Age', subtype: 'number', restrictions: { number: { min: 0, max: 120 } } }]);
    await waitForChanges();
    const field = root.shadowRoot!.querySelector('wb-form-field') as any;
    expect(field.subtype).toBe('number');
    expect(field.restrictions).toEqual({ number: { min: 0, max: 120 } });
    // restriction props flow through to the rendered input
    const input = root.shadowRoot!.querySelector('wb-form-field')!.shadowRoot!.querySelector('input') as HTMLInputElement;
    expect(input.getAttribute('type')).toBe('number');
    expect(input.getAttribute('min')).toBe('0');
    expect(input.getAttribute('max')).toBe('120');
  });

  it('forwards url subtype to wb-form-field', async () => {
    const { root, instance, waitForChanges } = await render(<wb-form-renderer></wb-form-renderer>);
    const renderer = instance as any;
    await renderer.setFields([{ id: 4, type: 'text', label: 'Website', subtype: 'url' }]);
    await waitForChanges();
    const field = root.shadowRoot!.querySelector('wb-form-field') as any;
    expect(field.subtype).toBe('url');
    const input = field.shadowRoot!.querySelector('input') as HTMLInputElement;
    expect(input.getAttribute('type')).toBe('url');
  });

  it('forwards password subtype to wb-form-field', async () => {
    const { root, instance, waitForChanges } = await render(<wb-form-renderer></wb-form-renderer>);
    const renderer = instance as any;
    await renderer.setFields([{ id: 5, type: 'text', label: 'Secret', subtype: 'password' }]);
    await waitForChanges();
    const field = root.shadowRoot!.querySelector('wb-form-field') as any;
    expect(field.subtype).toBe('password');
    const input = field.shadowRoot!.querySelector('input') as HTMLInputElement;
    expect(input.getAttribute('type')).toBe('password');
  });

  it('setFields updates the rendered fields', async () => {
    const { root, instance, waitForChanges } = await render(<wb-form-renderer></wb-form-renderer>);
    const renderer = instance as any;
    await renderer.setFields([{ id: 1, type: 'text', label: 'Name' }]);
    await waitForChanges();
    const field = root.shadowRoot!.querySelector('wb-form-field') as any;
    expect(field.name).toBe('field.1');
    expect(field.label).toBe('Name');
  });

  it('setFields with reordered list updates field order', async () => {
    const { root, instance, waitForChanges } = await render(<wb-form-renderer></wb-form-renderer>);
    const renderer = instance as any;
    await renderer.setFields([
      { id: 1, type: 'text', label: 'A' },
      { id: 2, type: 'text', label: 'B' },
    ]);
    await waitForChanges();

    await renderer.setFields([
      { id: 2, type: 'text', label: 'B' },
      { id: 1, type: 'text', label: 'A' },
    ]);
    await waitForChanges();
    const fields = root.shadowRoot!.querySelectorAll('wb-form-field');
    expect(fields.length).toBe(2);
    expect((fields[0] as any).name).toBe('field.2');
    expect((fields[1] as any).name).toBe('field.1');
  });

  it('submitting the form emits wbSubmit with field values', async () => {
    const { root, instance, waitForChanges } = await render(<wb-form-renderer></wb-form-renderer>);
    const renderer = instance as any;
    await renderer.setFields([{ id: 1, type: 'text', label: 'Name' }]);
    await waitForChanges();

    const spy = vi.fn();
    root.addEventListener('wbSubmit', spy);

    // Drive the wb-form-field's value through its public input, mirroring what
    // a real browser would collect via FormData(form) + form-association.
    const fieldEl = root.shadowRoot!.querySelector('wb-form-field') as any;
    const input = fieldEl.shadowRoot!.querySelector('input')!;
    input.value = 'Alice';
    input.dispatchEvent(new Event('input', { bubbles: true }));
    await waitForChanges();

    // mock-doc's FormData(form) isn't wired to form-associated custom elements,
    // so stub it to surface the field value the way a real browser would.
    const OrigFormData = globalThis.FormData;
    // biome-ignore lint/complexity/useArrowFunction: must be a `function` so `new FormData(form)` can construct it
    globalThis.FormData = vi.fn(function (_form: HTMLFormElement) {
      const fd = new OrigFormData();
      fd.append('field.1', 'Alice');
      return fd;
    }) as any;

    const form = root.shadowRoot!.querySelector('form')!;
    form.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }));
    await waitForChanges();

    globalThis.FormData = OrigFormData;

    expect(spy).toHaveBeenCalledTimes(1);
    expect(spy).toHaveBeenCalledWith(
      expect.objectContaining({
        detail: { 'field.1': 'Alice' },
      }),
    );
  });

  it('renders submit and reset buttons', async () => {
    const { root } = await render(<wb-form-renderer></wb-form-renderer>);
    const buttons = root.shadowRoot!.querySelectorAll('button');
    expect(buttons.length).toBe(2);
    expect(buttons[0].getAttribute('type')).toBe('submit');
    expect(buttons[1].getAttribute('type')).toBe('reset');
  });

  it('forwards multiline, initialLines, and maxHeight to wb-form-field', async () => {
    const { root, instance, waitForChanges } = await render(<wb-form-renderer></wb-form-renderer>);
    const renderer = instance as any;
    await renderer.setFields([{ id: 7, type: 'text', subtype: 'text', label: 'Notes', multiline: true, initialLines: 4, maxHeight: 200 }]);
    await waitForChanges();
    const field = root.shadowRoot!.querySelector('wb-form-field') as any;
    expect(field.multiline).toBe(true);
    expect(field.initialLines).toBe(4);
    expect(field.maxHeight).toBe(200);
    const textarea = field.shadowRoot!.querySelector('textarea') as HTMLTextAreaElement;
    expect(textarea).not.toBeNull();
    expect(textarea.getAttribute('rows')).toBe('4');
    expect(textarea.style.maxHeight).toBe('200px');
  });

  it('renders a single-line input when multiline options are omitted', async () => {
    const { root, instance, waitForChanges } = await render(<wb-form-renderer></wb-form-renderer>);
    const renderer = instance as any;
    await renderer.setFields([{ id: 8, type: 'text', label: 'Name' }]);
    await waitForChanges();
    const field = root.shadowRoot!.querySelector('wb-form-field') as any;
    expect(field.multiline).toBeFalsy();
    expect(field.shadowRoot!.querySelector('input')).not.toBeNull();
    expect(field.shadowRoot!.querySelector('textarea')).toBeNull();
  });

  it('forwards options to wb-form-field for a select field', async () => {
    const { root, instance, waitForChanges } = await render(<wb-form-renderer></wb-form-renderer>);
    const renderer = instance as any;
    const options = [
      { key: 'us', label: 'US' },
      { key: 'ca', label: 'CA' },
      { key: 'mx', label: 'MX' },
    ];
    await renderer.setFields([{ id: 9, type: 'select', label: 'Country', options }]);
    await waitForChanges();
    const field = root.shadowRoot!.querySelector('wb-form-field') as any;
    expect(field.options).toEqual(options);
    const renderedOptions = field.shadowRoot!.querySelectorAll('select option');
    expect(renderedOptions.length).toBe(3);
    expect(renderedOptions[0].getAttribute('value')).toBe('us');
    expect(renderedOptions[0].textContent).toBe('US');
  });

  it('renders an empty select when a select field has no options', async () => {
    const { root, instance, waitForChanges } = await render(<wb-form-renderer></wb-form-renderer>);
    const renderer = instance as any;
    await renderer.setFields([{ id: 9, type: 'select', label: 'Country' }]);
    await waitForChanges();
    const field = root.shadowRoot!.querySelector('wb-form-field') as any;
    expect(field.options).toBeUndefined();
    expect(field.shadowRoot!.querySelectorAll('select option').length).toBe(0);
  });

  it('forwards placeholder for a non-richtext data field', async () => {
    const { root, instance, waitForChanges } = await render(<wb-form-renderer></wb-form-renderer>);
    const renderer = instance as any;
    await renderer.setFields([{ id: 21, type: 'date', label: 'Birthday', placeholder: 'Your birthday' }]);
    await waitForChanges();
    const field = root.shadowRoot!.querySelector('wb-form-field') as any;
    expect(field.placeholder).toBe('Your birthday');
    // date renders the hint text below the control
    const hint = field.shadowRoot!.querySelector('.wb-field__placeholder-hint');
    expect(hint).not.toBeNull();
    expect(hint.textContent).toBe('Your birthday');
  });

  it('renders a heading element as an h2 with no form control', async () => {
    const { root, instance, waitForChanges } = await render(<wb-form-renderer></wb-form-renderer>);
    const renderer = instance as any;
    await renderer.setFields([{ id: 10, kind: 'design', type: 'text', label: 'Personal details', designType: 'heading' }]);
    await waitForChanges();
    const h2 = root.shadowRoot!.querySelector('h2') as HTMLElement;
    expect(h2).not.toBeNull();
    expect(h2.textContent).toBe('Personal details');
    expect(root.shadowRoot!.querySelectorAll('wb-form-field').length).toBe(0);
  });

  it('renders a paragraph element as a p using its text body', async () => {
    const { root, instance, waitForChanges } = await render(<wb-form-renderer></wb-form-renderer>);
    const renderer = instance as any;
    await renderer.setFields([{ id: 11, kind: 'design', type: 'text', label: 'Intro', designType: 'paragraph', text: 'Please fill this in.' }]);
    await waitForChanges();
    const p = root.shadowRoot!.querySelector('p') as HTMLElement;
    expect(p).not.toBeNull();
    expect(p.textContent).toBe('Please fill this in.');
  });

  it('renders a row container as flex columns with their children', async () => {
    const { root, instance, waitForChanges } = await render(<wb-form-renderer></wb-form-renderer>);
    const renderer = instance as any;
    await renderer.setFields([
      {
        id: 12,
        kind: 'design',
        type: 'text',
        label: 'Row',
        designType: 'row',
        columns: 2,
        children: [[{ id: 13, type: 'text', label: 'A' }], [{ id: 14, type: 'text', label: 'B' }]],
      },
    ]);
    await waitForChanges();
    const container = root.shadowRoot!.querySelector('.row-container') as HTMLElement;
    expect(container).not.toBeNull();
    const columns = container.querySelectorAll('.column');
    expect(columns.length).toBe(2);
    const fields = container.querySelectorAll('wb-form-field');
    expect(fields.length).toBe(2);
    expect((fields[0] as any).name).toBe('field.13');
    expect((fields[1] as any).name).toBe('field.14');
  });

  it('renders a nested row container recursively', async () => {
    const { root, instance, waitForChanges } = await render(<wb-form-renderer></wb-form-renderer>);
    const renderer = instance as any;
    await renderer.setFields([
      {
        id: 20,
        kind: 'design',
        type: 'text',
        label: 'Outer',
        designType: 'row',
        columns: 1,
        children: [
          [
            {
              id: 15,
              kind: 'design',
              type: 'text',
              label: 'Inner',
              designType: 'row',
              columns: 2,
              children: [[{ id: 16, type: 'text', label: 'C' }], [{ id: 17, type: 'text', label: 'D' }]],
            },
          ],
        ],
      },
    ]);
    await waitForChanges();
    const outer = root.shadowRoot!.querySelector('.row-container') as HTMLElement;
    const nested = outer.querySelector('.column .row-container') as HTMLElement;
    expect(nested).not.toBeNull();
    expect(nested.querySelectorAll('.column').length).toBe(2);
    expect(nested.querySelectorAll('wb-form-field').length).toBe(2);
  });

  it('design-only elements do not produce a name or form control', async () => {
    const { root, instance, waitForChanges } = await render(<wb-form-renderer></wb-form-renderer>);
    const renderer = instance as any;
    await renderer.setFields([
      { id: 10, kind: 'design', type: 'text', label: 'Heading', designType: 'heading' },
      { id: 11, kind: 'design', type: 'text', label: 'Intro', designType: 'paragraph', text: 'Text' },
      { id: 12, kind: 'design', type: 'text', label: 'Row', designType: 'row', columns: 2, children: [[{ id: 13, type: 'text', label: 'A' }], []] },
    ]);
    await waitForChanges();
    const fields = root.shadowRoot!.querySelectorAll('wb-form-field');
    expect(fields.length).toBe(1);
    expect((fields[0] as any).name).toBe('field.13');
  });

  it('submit payload includes data children but excludes design-only elements', async () => {
    const { root, instance, waitForChanges } = await render(<wb-form-renderer></wb-form-renderer>);
    const renderer = instance as any;
    await renderer.setFields([
      { id: 10, kind: 'design', type: 'text', label: 'Heading', designType: 'heading' },
      {
        id: 12,
        kind: 'design',
        type: 'text',
        label: 'Row',
        designType: 'row',
        columns: 1,
        children: [[{ id: 13, type: 'text', label: 'A' }]],
      },
    ]);
    await waitForChanges();

    const spy = vi.fn();
    root.addEventListener('wbSubmit', spy);

    const fieldEl = root.shadowRoot!.querySelector('wb-form-field') as any;
    const input = fieldEl.shadowRoot!.querySelector('input')!;
    input.value = 'Alice';
    input.dispatchEvent(new Event('input', { bubbles: true }));
    await waitForChanges();

    const OrigFormData = globalThis.FormData;
    // biome-ignore lint/complexity/useArrowFunction: must be a `function` so `new FormData(form)` can construct it
    globalThis.FormData = vi.fn(function (_form: HTMLFormElement) {
      const fd = new OrigFormData();
      fd.append('field.13', 'Alice');
      return fd;
    }) as any;

    const form = root.shadowRoot!.querySelector('form')!;
    form.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }));
    await waitForChanges();

    globalThis.FormData = OrigFormData;

    expect(spy).toHaveBeenCalledTimes(1);
    expect(spy).toHaveBeenCalledWith(expect.objectContaining({ detail: { 'field.13': 'Alice' } }));
  });

  it('ignores metadata and renders the same wb-form-field output as without it', async () => {
    const { root, instance, waitForChanges } = await render(<wb-form-renderer></wb-form-renderer>);
    const renderer = instance as any;
    await renderer.setFields([
      { id: 1, type: 'text', label: 'Name', placeholder: 'Jane' },
      { id: 2, type: 'text', label: 'Name', placeholder: 'Jane', metadata: { pii: true } },
    ]);
    await waitForChanges();
    const fields = Array.from(root.shadowRoot!.querySelectorAll('wb-form-field')) as any[];
    expect(fields.length).toBe(2);
    for (const key of ['label', 'type', 'subtype', 'placeholder']) {
      expect(fields[1][key]).toEqual(fields[0][key]);
    }
    expect(fields[1].metadata).toBeUndefined();
    expect(fields[1].getAttribute('metadata')).toBeNull();
  });
});

const fieldByName = (root: any, name: string) => Array.from(root.shadowRoot.querySelectorAll('wb-form-field')).find((field: any) => field.name === name) as any;
const innerInput = (root: any, name: string) => fieldByName(root, name).shadowRoot.querySelector('input') as HTMLInputElement;

describe('wb-form-renderer prefill', () => {
  it('forwards values to text, textarea, date, select, and nested row fields', async () => {
    const { root, instance, waitForChanges } = await render(<wb-form-renderer></wb-form-renderer>);
    const renderer = instance as any;
    await renderer.setFields([
      { id: 1, type: 'text', label: 'Name' },
      { id: 2, type: 'text', label: 'Notes', multiline: true },
      { id: 3, type: 'date', label: 'Date' },
      {
        id: 4,
        type: 'select',
        label: 'Country',
        options: [
          { key: 'us', label: 'US' },
          { key: 'ca', label: 'CA' },
        ],
      },
      {
        id: 12,
        kind: 'design',
        type: 'text',
        label: 'Row',
        designType: 'row',
        columns: 2,
        children: [[{ id: 13, type: 'text', label: 'A' }], [{ id: 14, type: 'text', label: 'B' }]],
      },
    ]);
    await renderer.setValues({ 'field.1': 'Alice', 'field.2': 'Notes', 'field.3': '2024-05-06', 'field.4': 'ca', 'field.13': 'A' });
    await waitForChanges();

    expect(fieldByName(root, 'field.1').initialValue).toBe('Alice');
    expect(innerInput(root, 'field.1').value).toBe('Alice');
    // mock-doc does not expose textarea.value, so assert the forwarded prefill.
    expect(fieldByName(root, 'field.2').initialValue).toBe('Notes');
    expect(innerInput(root, 'field.3').value).toBe('2024-05-06');

    const select = fieldByName(root, 'field.4').shadowRoot.querySelector('select') as HTMLSelectElement;
    const selectedOption = Array.from(select.querySelectorAll('option')).find(option => option.hasAttribute('selected'))!;
    expect(selectedOption.getAttribute('value')).toBe('ca');

    expect(fieldByName(root, 'field.13').initialValue).toBe('A');
    expect(innerInput(root, 'field.13').value).toBe('A');
    expect(fieldByName(root, 'field.14').initialValue).toBeUndefined();
  });

  it('leaves fields without a prefill entry empty', async () => {
    const { root, instance, waitForChanges } = await render(<wb-form-renderer></wb-form-renderer>);
    const renderer = instance as any;
    await renderer.setFields([
      { id: 1, type: 'text', label: 'A' },
      { id: 2, type: 'text', label: 'B' },
      { id: 3, type: 'text', label: 'C' },
    ]);
    await renderer.setValues({ 'field.2': 'Only B' });
    await waitForChanges();

    expect(innerInput(root, 'field.1').value).toBe('');
    expect(innerInput(root, 'field.2').value).toBe('Only B');
    expect(innerInput(root, 'field.3').value).toBe('');
  });

  it('coerces non-string primitives and treats nullish entries as absent', async () => {
    const { root, instance, waitForChanges } = await render(<wb-form-renderer></wb-form-renderer>);
    const renderer = instance as any;
    await renderer.setFields([
      { id: 3, type: 'text', label: 'Number' },
      { id: 4, type: 'text', label: 'Null' },
    ]);
    await renderer.setValues({ 'field.3': 42, 'field.4': null } as any);
    await waitForChanges();

    expect(innerInput(root, 'field.3').value).toBe('42');
    expect(fieldByName(root, 'field.4').initialValue).toBeUndefined();
    expect(innerInput(root, 'field.4').value).toBe('');
  });

  it('warns about unknown ids and design-element ids without affecting fields', async () => {
    const { root, instance, waitForChanges } = await render(<wb-form-renderer></wb-form-renderer>);
    const renderer = instance as any;
    await renderer.setFields([
      { id: 1, type: 'text', label: 'Name' },
      { id: 10, kind: 'design', type: 'text', label: 'Heading', designType: 'heading' },
    ]);
    await waitForChanges();

    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    try {
      await renderer.setValues({ 'field.99': 'x', 'field.10': 'y', 'field.1': 'Alice' });
      await waitForChanges();

      expect(warn).toHaveBeenCalledWith(expect.stringContaining('field.99'));
      expect(warn).toHaveBeenCalledWith(expect.stringContaining('field.10'));
      expect(warn).not.toHaveBeenCalledWith(expect.stringContaining('"field.1"'));
      expect(innerInput(root, 'field.1').value).toBe('Alice');
    } finally {
      warn.mockRestore();
    }
  });

  it('does not repeat an unknown-key warning on a re-render', async () => {
    const { instance, waitForChanges } = await render(<wb-form-renderer></wb-form-renderer>);
    const renderer = instance as any;
    await renderer.setFields([{ id: 1, type: 'text', label: 'Name' }]);
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    try {
      await renderer.setValues({ 'field.99': 'x' });
      await waitForChanges();
      expect(warn).toHaveBeenCalledTimes(1);

      await renderer.setFields([
        { id: 1, type: 'text', label: 'Name' },
        { id: 2, type: 'text', label: 'Extra' },
      ]);
      await waitForChanges();
      expect(warn).toHaveBeenCalledTimes(1);
    } finally {
      warn.mockRestore();
    }
  });

  it('reports unknown keys supplied before the first render, once fields exist', async () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    try {
      await render(<wb-form-renderer fields={[{ id: 1, type: 'text', label: 'Name' }]} values={{ 'field.99': 'x' }}></wb-form-renderer>);
      expect(warn).toHaveBeenCalledWith(expect.stringContaining('field.99'));
    } finally {
      warn.mockRestore();
    }
  });

  it('preserves user edits when re-rendering with unchanged prefill', async () => {
    const { root, instance, waitForChanges } = await render(<wb-form-renderer></wb-form-renderer>);
    const renderer = instance as any;
    await renderer.setFields([{ id: 1, type: 'text', label: 'Name' }]);
    await renderer.setValues({ 'field.1': 'Alice' });
    await waitForChanges();

    const input = innerInput(root, 'field.1');
    input.value = 'Carol';
    input.dispatchEvent(new Event('input', { bubbles: true }));
    await waitForChanges();

    await renderer.setFields([
      { id: 1, type: 'text', label: 'Name' },
      { id: 2, type: 'text', label: 'Extra' },
    ]);
    await waitForChanges();
    expect(innerInput(root, 'field.1').value).toBe('Carol');
  });

  it('a changed prefill value replaces the current value and an omitted key leaves it untouched', async () => {
    const { root, instance, waitForChanges } = await render(<wb-form-renderer></wb-form-renderer>);
    const renderer = instance as any;
    await renderer.setFields([
      { id: 1, type: 'text', label: 'A' },
      { id: 2, type: 'text', label: 'B' },
    ]);
    await renderer.setValues({ 'field.1': 'Alice', 'field.2': 'x' });
    await waitForChanges();

    await renderer.setValues({ 'field.1': 'Bob', 'field.2': 'x' });
    await waitForChanges();
    expect(innerInput(root, 'field.1').value).toBe('Bob');

    const input = innerInput(root, 'field.1');
    input.value = 'Carol';
    input.dispatchEvent(new Event('input', { bubbles: true }));
    await waitForChanges();

    await renderer.setValues({ 'field.2': 'x' });
    await waitForChanges();
    expect(innerInput(root, 'field.1').value).toBe('Carol');
  });

  it('round-trips a submitted payload through setValues', async () => {
    const { root, instance, waitForChanges } = await render(<wb-form-renderer></wb-form-renderer>);
    const renderer = instance as any;
    await renderer.setFields([
      { id: 1, type: 'text', label: 'Name' },
      { id: 2, type: 'text', label: 'Notes', multiline: true },
      {
        id: 3,
        type: 'select',
        label: 'Country',
        options: [
          { key: 'us', label: 'US' },
          { key: 'ca', label: 'CA' },
        ],
      },
      { id: 4, type: 'checkbox', label: 'Agree' },
      { id: 5, type: 'date', label: 'Date' },
    ]);
    await waitForChanges();

    const setControlValue = async (name: string, selector: string, value: string, eventType: string) => {
      const control = fieldByName(root, name).shadowRoot.querySelector(selector) as any;
      if (selector === 'input[type="checkbox"]') {
        control.checked = value === 'on';
      } else {
        control.value = value;
      }
      control.dispatchEvent(new Event(eventType, { bubbles: true }));
      await waitForChanges();
    };
    await setControlValue('field.1', 'input', 'Alice', 'input');
    await setControlValue('field.2', 'textarea', 'Notes', 'input');
    await setControlValue('field.3', 'select', 'ca', 'input');
    await setControlValue('field.4', 'input[type="checkbox"]', 'on', 'change');
    await setControlValue('field.5', 'input', '2024-05-06', 'input');

    const submitted = {
      'field.1': 'Alice',
      'field.2': 'Notes',
      'field.3': 'ca',
      'field.4': 'on',
      'field.5': '2024-05-06',
    };
    const OrigFormData = globalThis.FormData;
    // biome-ignore lint/complexity/useArrowFunction: must be a `function` so `new FormData(form)` can construct it
    globalThis.FormData = vi.fn(function (_form: HTMLFormElement) {
      const fd = new OrigFormData();
      for (const [key, value] of Object.entries(submitted)) fd.append(key, value);
      return fd;
    }) as any;
    const submitSpy = vi.fn();
    root.addEventListener('wbSubmit', submitSpy);
    root.shadowRoot!.querySelector('form')!.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }));
    await waitForChanges();
    globalThis.FormData = OrigFormData;

    const detail = submitSpy.mock.calls[0][0].detail;
    expect(detail).toEqual(submitted);

    // Change every control, then replay the captured payload.
    await setControlValue('field.1', 'input', 'Changed', 'input');
    await setControlValue('field.3', 'select', 'us', 'input');
    await setControlValue('field.4', 'input[type="checkbox"]', '', 'change');
    await renderer.setValues(detail);
    await waitForChanges();

    expect(innerInput(root, 'field.1').value).toBe('Alice');
    // mock-doc does not expose textarea.value, so assert the forwarded prefill.
    expect(fieldByName(root, 'field.2').initialValue).toBe('Notes');
    const select = fieldByName(root, 'field.3').shadowRoot.querySelector('select') as HTMLSelectElement;
    expect(
      Array.from(select.querySelectorAll('option'))
        .find(option => option.hasAttribute('selected'))!
        .getAttribute('value'),
    ).toBe('ca');
    expect((fieldByName(root, 'field.4').shadowRoot.querySelector('input[type="checkbox"]') as HTMLInputElement).checked).toBe(true);
    expect(innerInput(root, 'field.5').value).toBe('2024-05-06');
  });
});
