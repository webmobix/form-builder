// biome-ignore lint/correctness/noUnusedImports: `h` is required by Stencil's JSX transform at runtime
import { h } from '@stencil/core';
import { render } from '@stencil/vitest';

// Importing the source files triggers the on-the-fly compile + customElements.define()
import './wb-palette/wb-palette';
import './wb-canvas/wb-canvas';
import './wb-inspector/wb-inspector';

describe('richtext builder surfaces', () => {
  it('palette lists a Rich text entry emitting a richtext FieldTypeDef', async () => {
    const { root } = await render(<wb-palette></wb-palette>);
    const labels = Array.from(root.shadowRoot!.querySelectorAll('button')).map(b => b.textContent!.trim());
    expect(labels).toContain('Rich text');

    const added = vi.fn();
    root.addEventListener('wbAddField', added);
    const btn = Array.from(root.shadowRoot!.querySelectorAll('button')).find(b => b.textContent!.trim() === 'Rich text')!;
    btn.click();
    expect(added).toHaveBeenCalled();
    expect(added.mock.calls[0][0].detail).toEqual({ type: 'richtext', label: 'Rich text' });
  });

  it('canvas renders a richtext row as a read-only preview and creates fields via addFieldAfter', async () => {
    const { root, instance, waitForChanges } = await render(<wb-canvas></wb-canvas>);
    const canvas = instance as any;
    await canvas.addFieldAfter('richtext', 'Bio');
    await waitForChanges();

    const rows = root.shadowRoot!.querySelectorAll('[data-element-id]');
    const row = rows[rows.length - 1] as HTMLElement;
    // richtext renders a real (read-only) wb-form-field preview
    const field = row.querySelector('wb-form-field') as HTMLElement;
    expect(field).not.toBeNull();
    expect(field.getAttribute('label')).toBe('Bio');
    expect(field.getAttribute('type')).toBe('richtext');
    expect(field.getAttribute('disabled')).not.toBeNull();
    expect(canvas.fields[canvas.fields.length - 1].type).toBe('richtext');
  });

  it('inspector shows Rich text display name with Placeholder and Max Length controls', async () => {
    const { root, instance, waitForChanges } = await render(<wb-inspector></wb-inspector>);
    const inspector = instance as any;
    await inspector.setField({ id: 7, type: 'richtext', label: 'Bio' });
    await waitForChanges();

    expect(root.shadowRoot!.querySelector('.field-display')!.textContent).toBe('Rich text');
    const textInputs = Array.from(root.shadowRoot!.querySelectorAll('input[type="text"]')) as HTMLInputElement[];
    const placeholderInput = textInputs.find(i => (i.closest('.field-group') as HTMLElement)?.textContent?.includes('Placeholder'));
    expect(placeholderInput).toBeDefined();

    const numberInputs = root.shadowRoot!.querySelectorAll('input[type="number"]');
    expect(numberInputs.length).toBe(1); // Max Length only
  });

  it('placeholder edits emit a patch and clearing emits undefined', async () => {
    const { root, instance, waitForChanges } = await render(<wb-inspector></wb-inspector>);
    const inspector = instance as any;
    const spy = vi.fn();
    root.addEventListener('wbFieldUpdated', spy);
    await inspector.setField({ id: 7, type: 'richtext', label: 'Bio' });
    await waitForChanges();

    const textInputs = Array.from(root.shadowRoot!.querySelectorAll('input[type="text"]')) as HTMLInputElement[];
    const placeholderInput = textInputs.find(i => (i.closest('.field-group') as HTMLElement)?.textContent?.includes('Placeholder'))!;

    placeholderInput.value = 'Tell us more';
    placeholderInput.dispatchEvent(new Event('input', { bubbles: true }));
    await waitForChanges();
    expect(spy).toHaveBeenCalledWith(expect.objectContaining({ detail: { id: 7, patch: { placeholder: 'Tell us more' } } }));

    placeholderInput.value = '';
    placeholderInput.dispatchEvent(new Event('input', { bubbles: true }));
    await waitForChanges();
    expect(spy).toHaveBeenLastCalledWith(expect.objectContaining({ detail: { id: 7, patch: { placeholder: undefined } } }));
  });

  it('maxLength edits for richtext store under the shared text restrictions key', async () => {
    const { root, instance, waitForChanges } = await render(<wb-inspector></wb-inspector>);
    const inspector = instance as any;
    const spy = vi.fn();
    root.addEventListener('wbFieldUpdated', spy);
    await inspector.setField({ id: 7, type: 'richtext', label: 'Bio' });
    await waitForChanges();

    const numInput = root.shadowRoot!.querySelector('input[type="number"]') as HTMLInputElement;
    numInput.value = '140';
    numInput.dispatchEvent(new Event('input', { bubbles: true }));
    await waitForChanges();
    expect(spy).toHaveBeenCalledWith(
      expect.objectContaining({
        detail: expect.objectContaining({
          id: 7,
          patch: expect.objectContaining({ restrictions: { text: { maxLength: 140 } } }),
        }),
      }),
    );
  });
});
