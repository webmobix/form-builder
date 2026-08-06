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