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
