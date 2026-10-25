// biome-ignore lint/correctness/noUnusedImports: `h` is required by Stencil's JSX transform at runtime
import { h } from '@stencil/core';
import { render } from '@stencil/vitest';

// Importing the source file triggers the on-the-fly compile + customElements.define()
import './wb-form-field';

describe('wb-form-field subtype and restrictions', () => {
  it('renders text input by default when no subtype', async () => {
    const { root } = await render(<wb-form-field name="test" type="text" label="Name"></wb-form-field>);
    const input = root.shadowRoot!.querySelector('input') as HTMLInputElement;
    expect(input.getAttribute('type')).toBe('text');
  });

  it('renders number input for number subtype', async () => {
    const { root } = await render(<wb-form-field name="age" type="text" label="Age" subtype="number"></wb-form-field>);
    const input = root.shadowRoot!.querySelector('input') as HTMLInputElement;
    expect(input.getAttribute('type')).toBe('number');
  });

  it('renders email input for email subtype', async () => {
    const { root } = await render(<wb-form-field name="email" type="text" label="Email" subtype="email"></wb-form-field>);
    const input = root.shadowRoot!.querySelector('input') as HTMLInputElement;
    expect(input.getAttribute('type')).toBe('email');
  });

  it('renders tel input for tel subtype', async () => {
    const { root } = await render(<wb-form-field name="phone" type="text" label="Phone" subtype="tel"></wb-form-field>);
    const input = root.shadowRoot!.querySelector('input') as HTMLInputElement;
    expect(input.getAttribute('type')).toBe('tel');
  });

  it('renders url input for url subtype', async () => {
    const { root } = await render(<wb-form-field name="website" type="text" label="Website" subtype="url"></wb-form-field>);
    const input = root.shadowRoot!.querySelector('input') as HTMLInputElement;
    expect(input.getAttribute('type')).toBe('url');
  });

  it('renders password input for password subtype', async () => {
    const { root } = await render(<wb-form-field name="secret" type="text" label="Secret" subtype="password"></wb-form-field>);
    const input = root.shadowRoot!.querySelector('input') as HTMLInputElement;
    expect(input.getAttribute('type')).toBe('password');
  });

  it('applies maxLength to url and password subtypes', async () => {
    const { root } = await render(<wb-form-field name="website" type="text" label="Website" subtype="url" restrictions={{ text: { maxLength: 100 } }}></wb-form-field>);
    const urlInput = root.shadowRoot!.querySelector('input') as HTMLInputElement;
    expect(urlInput.getAttribute('maxLength')).toBe('100');

    const { root: root2 } = await render(<wb-form-field name="secret" type="text" label="Secret" subtype="password" restrictions={{ text: { maxLength: 50 } }}></wb-form-field>);
    const pwInput = root2.shadowRoot!.querySelector('input') as HTMLInputElement;
    expect(pwInput.getAttribute('maxLength')).toBe('50');
  });

  it('renders date input for date type', async () => {
    const { root } = await render(<wb-form-field name="dob" type="date" label="Date"></wb-form-field>);
    const input = root.shadowRoot!.querySelector('input') as HTMLInputElement;
    expect(input.getAttribute('type')).toBe('date');
  });

  it('renders checkbox for checkbox type', async () => {
    const { root } = await render(<wb-form-field name="agree" type="checkbox" label="Agree"></wb-form-field>);
    const input = root.shadowRoot!.querySelector('input') as HTMLInputElement;
    expect(input.getAttribute('type')).toBe('checkbox');
  });
});

describe('wb-form-field placeholder', () => {
  it('renders placeholder as native attribute on a text input', async () => {
    const { root } = await render(<wb-form-field name="name" type="text" label="Name" placeholder="Jane Doe"></wb-form-field>);
    const input = root.shadowRoot!.querySelector('input') as HTMLInputElement;
    expect(input.getAttribute('placeholder')).toBe('Jane Doe');
  });

  it('renders placeholder as native attribute on a textarea', async () => {
    const { root } = await render(<wb-form-field name="notes" type="text" label="Notes" multiline placeholder="Notes…"></wb-form-field>);
    const textarea = root.shadowRoot!.querySelector('textarea') as HTMLTextAreaElement;
    expect(textarea.getAttribute('placeholder')).toBe('Notes…');
  });

  it('renders date placeholder as helper text below the control', async () => {
    const { root } = await render(<wb-form-field name="dob" type="date" label="Date" placeholder="Your birthday"></wb-form-field>);
    const hint = root.shadowRoot!.querySelector('.wb-field__placeholder-hint');
    expect(hint).not.toBeNull();
    expect(hint!.textContent).toBe('Your birthday');
  });

  it('renders checkbox placeholder as helper text below the label row', async () => {
    const { root } = await render(<wb-form-field name="agree" type="checkbox" label="Agree" placeholder="Check to accept"></wb-form-field>);
    const hint = root.shadowRoot!.querySelector('.wb-field__placeholder-hint');
    expect(hint).not.toBeNull();
    expect(hint!.textContent).toBe('Check to accept');
    // label row (input + label span) and hint share one column
    expect(hint!.parentElement!.classList.contains('wb-field--checkbox')).toBe(true);
    expect(hint!.previousElementSibling!.querySelector('input[type="checkbox"]')).not.toBeNull();
  });

  it('links date and checkbox hints to the control via aria-describedby', async () => {
    const dateRender = await render(<wb-form-field name="dob" type="date" label="Date" placeholder="Your birthday"></wb-form-field>);
    const dateInput = dateRender.root.shadowRoot!.querySelector('input') as HTMLInputElement;
    const dateHint = dateRender.root.shadowRoot!.querySelector('.wb-field__placeholder-hint') as HTMLElement;
    expect(dateInput.getAttribute('aria-describedby')).toBe('dob-hint');
    expect(dateHint.id).toBe('dob-hint');

    const { root } = await render(<wb-form-field name="agree" type="checkbox" label="Agree" placeholder="Check to accept"></wb-form-field>);
    const checkbox = root.shadowRoot!.querySelector('input[type="checkbox"]') as HTMLInputElement;
    const hint = root.shadowRoot!.querySelector('.wb-field__placeholder-hint') as HTMLElement;
    expect(checkbox.getAttribute('aria-describedby')).toBe('agree-hint');
    expect(hint.id).toBe('agree-hint');
  });

  it('renders no hint markup when placeholder is unset', async () => {
    const dateRender = await render(<wb-form-field name="dob" type="date" label="Date"></wb-form-field>);
    expect(dateRender.root.shadowRoot!.querySelector('.wb-field__placeholder-hint')).toBeNull();

    const checkboxRender = await render(<wb-form-field name="agree" type="checkbox" label="Agree"></wb-form-field>);
    expect(checkboxRender.root.shadowRoot!.querySelector('.wb-field__placeholder-hint')).toBeNull();

    const textRender = await render(<wb-form-field name="name" type="text" label="Name"></wb-form-field>);
    const input = textRender.root.shadowRoot!.querySelector('input') as HTMLInputElement;
    expect(input.hasAttribute('placeholder')).toBe(false);
  });
});

describe('wb-form-field select', () => {
  it('renders a select (not an input) for select type', async () => {
    const { root } = await render(
      <wb-form-field
        name="country"
        type="select"
        label="Country"
        options={[
          { key: 'red', label: 'Red' },
          { key: 'green', label: 'Green' },
          { key: 'blue', label: 'Blue' },
        ]}
      ></wb-form-field>,
    );
    const select = root.shadowRoot!.querySelector('select') as HTMLSelectElement;
    expect(select).not.toBeNull();
    expect(root.shadowRoot!.querySelector('input')).toBeNull();
  });

  it('renders one option per options entry with value=key and label text', async () => {
    const { root } = await render(
      <wb-form-field
        name="country"
        type="select"
        label="Country"
        options={[
          { key: 'red', label: 'Red' },
          { key: 'green', label: 'Green' },
          { key: 'blue', label: 'Blue' },
        ]}
      ></wb-form-field>,
    );
    const options = Array.from(root.shadowRoot!.querySelectorAll('select option'));
    expect(options.length).toBe(3);
    expect(options.map(o => o.getAttribute('value'))).toEqual(['red', 'green', 'blue']);
    expect(options.map(o => o.textContent)).toEqual(['Red', 'Green', 'Blue']);
  });

  it('renders an empty select when no options are provided', async () => {
    const { root } = await render(<wb-form-field name="country" type="select" label="Country"></wb-form-field>);
    const select = root.shadowRoot!.querySelector('select') as HTMLSelectElement;
    expect(select).not.toBeNull();
    expect(select.querySelectorAll('option').length).toBe(0);
  });

  it('renders a disabled hint option first when placeholder is set, selected by default', async () => {
    const { root } = await render(
      <wb-form-field
        name="country"
        type="select"
        label="Country"
        placeholder="Choose one"
        options={[
          { key: 'red', label: 'Red' },
          { key: 'green', label: 'Green' },
        ]}
      ></wb-form-field>,
    );
    const select = root.shadowRoot!.querySelector('select') as HTMLSelectElement;
    const options = Array.from(select.querySelectorAll('option'));
    expect(options.length).toBe(3);
    const first = options[0];
    // Sentinel value keeps the hint distinct from real options, even
    // author-created options with an empty key.
    expect(first.getAttribute('value')).toBe('__wb-form-field-hint__');
    expect(first.hasAttribute('disabled')).toBe(true);
    expect(first.textContent).toBe('Choose one');
    expect(first.hasAttribute('selected')).toBe(true);
  });

  it('keeps the hint option distinct from a real empty-key option', async () => {
    const { root } = await render(
      <wb-form-field
        name="tone"
        type="select"
        label="Tone"
        placeholder="Choose one"
        options={[
          { key: '', label: 'No preference' },
          { key: 'formal', label: 'Formal' },
        ]}
      ></wb-form-field>,
    );
    const select = root.shadowRoot!.querySelector('select') as HTMLSelectElement;
    const options = Array.from(select.querySelectorAll('option'));
    // Two distinct values: the hint sentinel and the empty-key option.
    expect(options.map(o => o.getAttribute('value'))).toEqual(['__wb-form-field-hint__', '', 'formal']);
    expect(options[0].textContent).toBe('Choose one');
    expect(options[1].textContent).toBe('No preference');
    // Only the hint is selected initially (no real choice yet).
    expect(options[0].hasAttribute('selected')).toBe(true);
    expect(options[1].hasAttribute('selected')).toBe(false);
  });

  it('cannot re-select the hint option after choosing a real option', async () => {
    const page = await render(
      <wb-form-field
        name="country"
        type="select"
        label="Country"
        placeholder="Choose one"
        options={[
          { key: 'red', label: 'Red' },
          { key: 'green', label: 'Green' },
        ]}
      ></wb-form-field>,
    );
    const { root, waitForChanges } = page;
    const selectBefore = root.shadowRoot!.querySelector('select') as HTMLSelectElement;
    selectBefore.value = 'red';
    selectBefore.dispatchEvent(new Event('input', { bubbles: true }));
    await waitForChanges();
    // re-query the re-rendered shadow DOM
    const select = root.shadowRoot!.querySelector('select') as HTMLSelectElement;
    const hintOption = select.querySelector('option[value="__wb-form-field-hint__"]') as HTMLOptionElement;
    expect(hintOption.hasAttribute('selected')).toBe(false);
    // disabled → user cannot re-select it
    expect(hintOption.hasAttribute('disabled')).toBe(true);
    const options = Array.from(select.querySelectorAll('option'));
    expect(options[1].hasAttribute('selected')).toBe(true);
  });

  it('selects a real empty-key option after the user chooses it instead of the hint', async () => {
    const page = await render(
      <wb-form-field
        name="tone"
        type="select"
        label="Tone"
        placeholder="Choose one"
        options={[
          { key: '', label: 'No preference' },
          { key: 'formal', label: 'Formal' },
        ]}
      ></wb-form-field>,
    );
    const { root, waitForChanges } = page;
    const selectBefore = root.shadowRoot!.querySelector('select') as HTMLSelectElement;
    selectBefore.value = '';
    selectBefore.dispatchEvent(new Event('input', { bubbles: true }));
    await waitForChanges();
    const select = root.shadowRoot!.querySelector('select') as HTMLSelectElement;
    const options = Array.from(select.querySelectorAll('option'));
    // The hint is deselected; the real empty-key option is selected.
    expect(options[0].hasAttribute('selected')).toBe(false);
    expect(options[1].hasAttribute('selected')).toBe(true);
    expect(select.value).toBe('');
  });

  it('renders no extra option when placeholder is unset', async () => {
    const { root } = await render(
      <wb-form-field
        name="country"
        type="select"
        label="Country"
        options={[
          { key: 'red', label: 'Red' },
          { key: 'green', label: 'Green' },
        ]}
      ></wb-form-field>,
    );
    const select = root.shadowRoot!.querySelector('select') as HTMLSelectElement;
    const options = Array.from(select.querySelectorAll('option'));
    expect(options.length).toBe(2);
    expect(options.every(o => o.getAttribute('value') !== '')).toBe(true);
  });
});

describe('wb-form-field multiline', () => {
  it('renders a textarea when multiline is true', async () => {
    const { root } = await render(<wb-form-field name="notes" type="text" label="Notes" multiline></wb-form-field>);
    const textarea = root.shadowRoot!.querySelector('textarea') as HTMLTextAreaElement;
    expect(textarea).not.toBeNull();
    expect(root.shadowRoot!.querySelector('input')).toBeNull();
  });

  it('renders an input when multiline is false or unset', async () => {
    const { root } = await render(<wb-form-field name="name" type="text" label="Name"></wb-form-field>);
    const input = root.shadowRoot!.querySelector('input') as HTMLInputElement;
    expect(input).not.toBeNull();
    expect(input.getAttribute('type')).toBe('text');
    expect(root.shadowRoot!.querySelector('textarea')).toBeNull();
  });

  it('renders an input for number subtype even when multiline is true', async () => {
    const { root } = await render(<wb-form-field name="age" type="text" label="Age" subtype="number" multiline></wb-form-field>);
    const input = root.shadowRoot!.querySelector('input') as HTMLInputElement;
    expect(input).not.toBeNull();
    expect(input.getAttribute('type')).toBe('number');
    expect(root.shadowRoot!.querySelector('textarea')).toBeNull();
  });

  it('uses initialLines for rows, defaulting to 3, and applies maxHeight style', async () => {
    const { root } = await render(<wb-form-field name="notes" type="text" label="Notes" multiline initialLines={5} maxHeight={200}></wb-form-field>);
    const textarea = root.shadowRoot!.querySelector('textarea') as HTMLTextAreaElement;
    expect(textarea.getAttribute('rows')).toBe('5');
    expect(textarea.style.maxHeight).toBe('200px');
  });

  it('defaults rows to 3 when initialLines is unset and no max-height when maxHeight unset', async () => {
    const { root } = await render(<wb-form-field name="notes" type="text" label="Notes" multiline></wb-form-field>);
    const textarea = root.shadowRoot!.querySelector('textarea') as HTMLTextAreaElement;
    expect(textarea.getAttribute('rows')).toBe('3');
    expect(textarea.style.maxHeight).toBe('');
  });

  it('applies maxLength to the textarea when set', async () => {
    const { root } = await render(<wb-form-field name="notes" type="text" label="Notes" multiline restrictions={{ text: { maxLength: 500 } }}></wb-form-field>);
    const textarea = root.shadowRoot!.querySelector('textarea') as HTMLTextAreaElement;
    expect(textarea.getAttribute('maxLength')).toBe('500');
  });
});

describe('wb-form-field disabled prop', () => {
  it('disables the input when disabled is true', async () => {
    const { root } = await render(<wb-form-field name="name" type="text" label="Name" disabled></wb-form-field>);
    const input = root.shadowRoot!.querySelector('input') as HTMLInputElement;
    expect(input.disabled).toBe(true);
  });

  it('leaves the input enabled by default (no prop)', async () => {
    const { root } = await render(<wb-form-field name="name" type="text" label="Name"></wb-form-field>);
    const input = root.shadowRoot!.querySelector('input') as HTMLInputElement;
    expect(input.disabled).toBe(false);
  });

  it('disables the textarea when multiline and disabled', async () => {
    const { root } = await render(<wb-form-field name="notes" type="text" label="Notes" multiline disabled></wb-form-field>);
    const textarea = root.shadowRoot!.querySelector('textarea') as HTMLTextAreaElement;
    expect(textarea.hasAttribute('disabled')).toBe(true);
  });

  it('disables the checkbox when disabled', async () => {
    const { root } = await render(<wb-form-field name="agree" type="checkbox" label="Agree" disabled></wb-form-field>);
    const input = root.shadowRoot!.querySelector('input') as HTMLInputElement;
    expect(input.disabled).toBe(true);
  });
});

/**
 * Capture the value the field pushes through `ElementInternals.setFormValue`
 * (mock-doc's version is not observable), by wrapping the FormData instance
 * the component appends to in `sync()`.
 */
const captureSubmittedValues = () => {
  const submitted: Record<string, string> = {};
  const OrigFormData = globalThis.FormData;
  // biome-ignore lint/complexity/useArrowFunction: must be a `function` so `new FormData()` can construct it
  globalThis.FormData = vi.fn(function () {
    const fd = new OrigFormData();
    const append = fd.append.bind(fd);
    fd.append = ((name: string, value: string | Blob) => {
      submitted[name] = String(value);
      append(name, value as never);
    }) as never;
    return fd;
  }) as never;
  return {
    submitted,
    restore: () => {
      globalThis.FormData = OrigFormData;
    },
  };
};

describe('wb-form-field initialValue prefill', () => {
  it('seeds a text input from initialValue and submits it via FormData', async () => {
    const capture = captureSubmittedValues();
    try {
      const { root } = await render(<wb-form-field name="field.1" type="text" label="Name" initialValue="Alice"></wb-form-field>);
      const input = root.shadowRoot!.querySelector('input') as HTMLInputElement;
      expect(input.value).toBe('Alice');
      expect(capture.submitted['field.1']).toBe('Alice');
    } finally {
      capture.restore();
    }
  });

  it('seeds a textarea from initialValue', async () => {
    const capture = captureSubmittedValues();
    try {
      const { root } = await render(<wb-form-field name="field.7" type="text" label="Notes" multiline initialValue="Notes"></wb-form-field>);
      const textarea = root.shadowRoot!.querySelector('textarea') as HTMLTextAreaElement;
      // mock-doc exposes the textarea's value as the rendered attribute
      expect(textarea.getAttribute('value')).toBe('Notes');
      expect(capture.submitted['field.7']).toBe('Notes');
    } finally {
      capture.restore();
    }
  });

  it('seeds number and date inputs from initialValue', async () => {
    const numberRender = await render(<wb-form-field name="field.3" type="text" subtype="number" label="Age" initialValue="42"></wb-form-field>);
    const numberInput = numberRender.root.shadowRoot!.querySelector('input') as HTMLInputElement;
    expect(numberInput.getAttribute('type')).toBe('number');
    expect(numberInput.value).toBe('42');

    const dateRender = await render(<wb-form-field name="field.4" type="date" label="Date" initialValue="2024-05-06"></wb-form-field>);
    const dateInput = dateRender.root.shadowRoot!.querySelector('input') as HTMLInputElement;
    expect(dateInput.getAttribute('type')).toBe('date');
    expect(dateInput.value).toBe('2024-05-06');
  });

  it('leaves the control empty when initialValue is undefined', async () => {
    const { root } = await render(<wb-form-field name="field.1" type="text" label="Name"></wb-form-field>);
    const input = root.shadowRoot!.querySelector('input') as HTMLInputElement;
    expect(input.value).toBe('');
  });

  it('a changed initialValue replaces the current value and submits the new one', async () => {
    const capture = captureSubmittedValues();
    try {
      const { root, instance, waitForChanges } = await render(<wb-form-field name="field.1" type="text" label="Name" initialValue="Alice"></wb-form-field>);
      (instance as any).initialValue = 'Bob';
      await waitForChanges();
      const input = root.shadowRoot!.querySelector('input') as HTMLInputElement;
      expect(input.value).toBe('Bob');
      expect(capture.submitted['field.1']).toBe('Bob');
    } finally {
      capture.restore();
    }
  });

  it('an unchanged initialValue leaves user-entered text intact', async () => {
    const { root, instance, waitForChanges } = await render(<wb-form-field name="field.1" type="text" label="Name" initialValue="Alice"></wb-form-field>);
    const input = root.shadowRoot!.querySelector('input') as HTMLInputElement;
    input.value = 'Carol';
    input.dispatchEvent(new Event('input', { bubbles: true }));
    await waitForChanges();
    expect(input.value).toBe('Carol');

    // Re-setting the identical prefill string must not clobber the edit.
    (instance as any).initialValue = 'Alice';
    await waitForChanges();
    expect((root.shadowRoot!.querySelector('input') as HTMLInputElement).value).toBe('Carol');
  });

  it('select prefill selects the matching option', async () => {
    const capture = captureSubmittedValues();
    try {
      const { root } = await render(
        <wb-form-field
          name="field.2"
          type="select"
          label="Country"
          placeholder="Choose one"
          initialValue="ca"
          options={[
            { key: 'us', label: 'US' },
            { key: 'ca', label: 'CA' },
            { key: 'mx', label: 'MX' },
          ]}
        ></wb-form-field>,
      );
      const select = root.shadowRoot!.querySelector('select') as HTMLSelectElement;
      const options = Array.from(select.querySelectorAll('option'));
      expect(options.find(o => o.getAttribute('value') === 'ca')!.hasAttribute('selected')).toBe(true);
      expect(options[0].hasAttribute('selected')).toBe(false);
      expect(capture.submitted['field.2']).toBe('ca');
    } finally {
      capture.restore();
    }
  });

  it('select prefill without a matching option falls back to the hint state with an empty submitted value', async () => {
    const capture = captureSubmittedValues();
    try {
      const { root } = await render(
        <wb-form-field
          name="field.2"
          type="select"
          label="Country"
          placeholder="Choose one"
          initialValue="zz"
          options={[
            { key: 'us', label: 'US' },
            { key: 'ca', label: 'CA' },
          ]}
        ></wb-form-field>,
      );
      const select = root.shadowRoot!.querySelector('select') as HTMLSelectElement;
      const options = Array.from(select.querySelectorAll('option'));
      expect(options[0].getAttribute('value')).toBe('__wb-form-field-hint__');
      expect(options[0].hasAttribute('selected')).toBe(true);
      expect(options.some(o => o.getAttribute('value') === 'zz')).toBe(false);
      expect(capture.submitted['field.2']).toBe('');
    } finally {
      capture.restore();
    }
  });

  it('checkbox prefill checks only for the serialized on value', async () => {
    const onRender = await render(<wb-form-field name="field.5" type="checkbox" label="Agree" initialValue="on"></wb-form-field>);
    expect((onRender.root.shadowRoot!.querySelector('input') as HTMLInputElement).checked).toBe(true);

    for (const value of ['true', 'yes', '']) {
      const renderResult = await render(<wb-form-field name="field.5" type="checkbox" label="Agree" initialValue={value}></wb-form-field>);
      expect((renderResult.root.shadowRoot!.querySelector('input') as HTMLInputElement).checked).toBe(false);
    }
  });
});
