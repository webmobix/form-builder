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
});
