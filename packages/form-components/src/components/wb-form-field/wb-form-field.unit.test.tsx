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