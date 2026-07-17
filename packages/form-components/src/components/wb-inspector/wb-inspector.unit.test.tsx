import { h } from '@stencil/core';
import { newSpecPage } from '@stencil/core/testing';
import { WbInspector } from './wb-inspector';

describe('wb-inspector', () => {
  it('renders empty state when field is null', async () => {
    const page = await newSpecPage({
      components: [WbInspector],
      template: () => <wb-inspector></wb-inspector>,
    });
    expect(page.root.shadowRoot!.textContent).toContain('Select a field to edit its settings');
  });

  it('renders field data when a field is loaded', async () => {
    const page = await newSpecPage({
      components: [WbInspector],
      template: () => <wb-inspector></wb-inspector>,
    });
    const inspector = page.rootInstance as WbInspector;
    await inspector.setField({ id: 1, type: 'text', label: 'Name' });
    await page.waitForChanges();
    const input = page.root.shadowRoot!.querySelector('input') as HTMLInputElement;
    expect(input.value).toBe('Name');
    expect(page.root.shadowRoot!.textContent).toContain('Field Settings');
  });

  it('rejects empty label with validation error', async () => {
    const page = await newSpecPage({
      components: [WbInspector],
      template: () => <wb-inspector></wb-inspector>,
    });
    const inspector = page.rootInstance as WbInspector;
    await inspector.setField({ id: 1, type: 'text', label: 'Name' });
    await page.waitForChanges();
    const input = page.root.shadowRoot!.querySelector('input') as HTMLInputElement;
    input.value = '';
    input.dispatchEvent(new Event('input'));
    await page.waitForChanges();
    expect(page.root.shadowRoot!.textContent).toContain('Label cannot be empty');
  });

  it('emits wbFieldUpdated on label change', async () => {
    const page = await newSpecPage({
      components: [WbInspector],
      template: () => <wb-inspector></wb-inspector>,
    });
    const inspector = page.rootInstance as WbInspector;
    const spy = jest.fn();
    page.root.addEventListener('wbFieldUpdated', spy);
    await inspector.setField({ id: 1, type: 'text', label: 'Name' });
    await page.waitForChanges();
    const input = page.root.shadowRoot!.querySelector('input') as HTMLInputElement;
    input.value = 'Full Name';
    input.dispatchEvent(new Event('input'));
    await page.waitForChanges();
    expect(spy).toHaveBeenCalledWith(
      expect.objectContaining({ detail: { id: 1, patch: { label: 'Full Name' } } })
    );
  });

  it('emits wbFieldUpdated on type change clearing subtype and restrictions when leaving text', async () => {
    const page = await newSpecPage({
      components: [WbInspector],
      template: () => <wb-inspector></wb-inspector>,
    });
    const inspector = page.rootInstance as WbInspector;
    const spy = jest.fn();
    page.root.addEventListener('wbFieldUpdated', spy);
    await inspector.setField({ id: 1, type: 'text', label: 'Name', subtype: 'number', restrictions: { number: { min: 0 } } });
    await page.waitForChanges();
    const select = page.root.shadowRoot!.querySelector('select') as HTMLSelectElement;
    select.value = 'date';
    select.dispatchEvent(new Event('change'));
    await page.waitForChanges();
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
    const page = await newSpecPage({
      components: [WbInspector],
      template: () => <wb-inspector></wb-inspector>,
    });
    const inspector = page.rootInstance as WbInspector;
    await inspector.setField({ id: 1, type: 'text', label: 'Name' });
    await page.waitForChanges();
    const selects = page.root.shadowRoot!.querySelectorAll('select');
    expect(selects.length).toBe(2);
  });

  it('hides subtype selector for non-text fields', async () => {
    const page = await newSpecPage({
      components: [WbInspector],
      template: () => <wb-inspector></wb-inspector>,
    });
    const inspector = page.rootInstance as WbInspector;
    await inspector.setField({ id: 1, type: 'date', label: 'Date' });
    await page.waitForChanges();
    const selects = page.root.shadowRoot!.querySelectorAll('select');
    expect(selects.length).toBe(1);
  });

  it('emits wbFieldUpdated on subtype change swapping restrictions', async () => {
    const page = await newSpecPage({
      components: [WbInspector],
      template: () => <wb-inspector></wb-inspector>,
    });
    const inspector = page.rootInstance as WbInspector;
    const spy = jest.fn();
    page.root.addEventListener('wbFieldUpdated', spy);
    await inspector.setField({ id: 1, type: 'text', label: 'Age', subtype: 'text', restrictions: { text: { maxLength: 100 } } });
    await page.waitForChanges();
    const selects = page.root.shadowRoot!.querySelectorAll('select');
    const subtypeSelect = selects[1];
    subtypeSelect.value = 'number';
    subtypeSelect.dispatchEvent(new Event('change'));
    await page.waitForChanges();
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
    const page = await newSpecPage({
      components: [WbInspector],
      template: () => <wb-inspector></wb-inspector>,
    });
    const inspector = page.rootInstance as WbInspector;
    await inspector.setField({ id: 1, type: 'text', label: 'Age', subtype: 'number' });
    await page.waitForChanges();
    const inputs = page.root.shadowRoot!.querySelectorAll('input[type="number"]');
    expect(inputs.length).toBe(3);
  });

  it('shows maxLength input for text subtype', async () => {
    const page = await newSpecPage({
      components: [WbInspector],
      template: () => <wb-inspector></wb-inspector>,
    });
    const inspector = page.rootInstance as WbInspector;
    await inspector.setField({ id: 1, type: 'text', label: 'Email', subtype: 'text' });
    await page.waitForChanges();
    const inputs = page.root.shadowRoot!.querySelectorAll('input[type="number"]');
    expect(inputs.length).toBe(1);
  });

  it('hides restriction inputs for non-text types', async () => {
    const page = await newSpecPage({
      components: [WbInspector],
      template: () => <wb-inspector></wb-inspector>,
    });
    const inspector = page.rootInstance as WbInspector;
    await inspector.setField({ id: 1, type: 'checkbox', label: 'Agree' });
    await page.waitForChanges();
    const inputs = page.root.shadowRoot!.querySelectorAll('input[type="number"]');
    expect(inputs.length).toBe(0);
  });

  it('emits wbFieldUpdated on restriction edit', async () => {
    const page = await newSpecPage({
      components: [WbInspector],
      template: () => <wb-inspector></wb-inspector>,
    });
    const inspector = page.rootInstance as WbInspector;
    const spy = jest.fn();
    page.root.addEventListener('wbFieldUpdated', spy);
    await inspector.setField({ id: 1, type: 'text', label: 'Age', subtype: 'number' });
    await page.waitForChanges();
    const inputs = page.root.shadowRoot!.querySelectorAll('input[type="number"]');
    const minInput = inputs[0] as HTMLInputElement;
    minInput.value = '0';
    minInput.dispatchEvent(new Event('input'));
    await page.waitForChanges();
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
    const page = await newSpecPage({
      components: [WbInspector],
      template: () => <wb-inspector></wb-inspector>,
    });
    const inspector = page.rootInstance as WbInspector;
    const spy = jest.fn();
    page.root.addEventListener('wbFieldUpdated', spy);
    await inspector.setField({ id: 1, type: 'text', label: 'Age', subtype: 'number', restrictions: { number: { min: 0, max: 100, step: 1 } } });
    await page.waitForChanges();
    const inputs = page.root.shadowRoot!.querySelectorAll('input[type="number"]');
    const minInput = inputs[0] as HTMLInputElement;
    minInput.value = '';
    minInput.dispatchEvent(new Event('input'));
    await page.waitForChanges();
    const call = spy.mock.calls[0][0].detail;
    expect(call.patch.restrictions.number.min).toBeUndefined();
  });
});
