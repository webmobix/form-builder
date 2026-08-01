import { h } from '@stencil/core';
import { render } from '@stencil/vitest';

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
    expect(spy).toHaveBeenCalledWith(
      expect.objectContaining({ detail: { id: 1, patch: { label: 'Full Name' } } })
    );
  });

  it('emits wbFieldUpdated on type change clearing subtype and restrictions when leaving text', async () => {
    const { root, instance, waitForChanges } = await render(<wb-inspector></wb-inspector>);
    const inspector = instance as any;
    const spy = vi.fn();
    root.addEventListener('wbFieldUpdated', spy);
    await inspector.setField({ id: 1, type: 'text', label: 'Name', subtype: 'number', restrictions: { number: { min: 0 } } });
    await waitForChanges();
    const select = root.shadowRoot!.querySelector('select') as HTMLSelectElement;
    select.value = 'date';
    select.dispatchEvent(new Event('change', { bubbles: true }));
    await waitForChanges();
    expect(spy).toHaveBeenCalledWith(
      expect.objectContaining({
        detail: expect.objectContaining({
          id: 1,
          patch: expect.objectContaining({ type: 'date', subtype: undefined, restrictions: undefined }),
        }),
      })
    );
  });

  it('shows subtype selector for text fields', async () => {
    const { root, instance, waitForChanges } = await render(<wb-inspector></wb-inspector>);
    const inspector = instance as any;
    await inspector.setField({ id: 1, type: 'text', label: 'Name' });
    await waitForChanges();
    const selects = root.shadowRoot!.querySelectorAll('select');
    expect(selects.length).toBe(2);
  });

  it('hides subtype selector for non-text fields', async () => {
    const { root, instance, waitForChanges } = await render(<wb-inspector></wb-inspector>);
    const inspector = instance as any;
    await inspector.setField({ id: 1, type: 'date', label: 'Date' });
    await waitForChanges();
    const selects = root.shadowRoot!.querySelectorAll('select');
    expect(selects.length).toBe(1);
  });

  it('emits wbFieldUpdated on subtype change swapping restrictions', async () => {
    const { root, instance, waitForChanges } = await render(<wb-inspector></wb-inspector>);
    const inspector = instance as any;
    const spy = vi.fn();
    root.addEventListener('wbFieldUpdated', spy);
    await inspector.setField({ id: 1, type: 'text', label: 'Age', subtype: 'text', restrictions: { text: { maxLength: 100 } } });
    await waitForChanges();
    const selects = root.shadowRoot!.querySelectorAll('select');
    const subtypeSelect = selects[1] as HTMLSelectElement;
    subtypeSelect.value = 'number';
    subtypeSelect.dispatchEvent(new Event('change', { bubbles: true }));
    await waitForChanges();
    expect(spy).toHaveBeenCalledWith(
      expect.objectContaining({
        detail: expect.objectContaining({
          id: 1,
          patch: expect.objectContaining({ subtype: 'number' }),
        }),
      })
    );
  });

  it('shows number restriction inputs for number subtype', async () => {
    const { root, instance, waitForChanges } = await render(<wb-inspector></wb-inspector>);
    const inspector = instance as any;
    await inspector.setField({ id: 1, type: 'text', label: 'Age', subtype: 'number' });
    await waitForChanges();
    const inputs = root.shadowRoot!.querySelectorAll('input[type="number"]');
    expect(inputs.length).toBe(3);
  });

  it('shows maxLength input for text subtype', async () => {
    const { root, instance, waitForChanges } = await render(<wb-inspector></wb-inspector>);
    const inspector = instance as any;
    await inspector.setField({ id: 1, type: 'text', label: 'Email', subtype: 'text' });
    await waitForChanges();
    const inputs = root.shadowRoot!.querySelectorAll('input[type="number"]');
    expect(inputs.length).toBe(1);
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
      })
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