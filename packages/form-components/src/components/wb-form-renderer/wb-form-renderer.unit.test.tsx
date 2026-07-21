import { h } from '@stencil/core';
import { newSpecPage } from '@stencil/core/testing';
import { WbFormRenderer } from './wb-form-renderer';
import { WbFormField } from '../wb-form-field/wb-form-field';

describe('wb-form-renderer', () => {
  it('renders form shell with no field children when fields is empty', async () => {
    const page = await newSpecPage({
      components: [WbFormRenderer, WbFormField],
      template: () => <wb-form-renderer></wb-form-renderer>,
    });
    const form = page.root.shadowRoot!.querySelector('form')!;
    const fieldsContainer = form.querySelector('.fields')!;
    expect(fieldsContainer.children.length).toBe(0);
  });

  it('renders one wb-form-field with correct name, label, type', async () => {
    const page = await newSpecPage({
      components: [WbFormRenderer, WbFormField],
      template: () => <wb-form-renderer></wb-form-renderer>,
    });
    const instance = page.rootInstance as WbFormRenderer;
    await instance.setFields([{ id: 1, type: 'text', label: 'Name' }]);
    await page.waitForChanges();
    const field = page.root.shadowRoot!.querySelector('wb-form-field')!;
    expect(field.getAttribute('name')).toBe('field.1');
    expect(field.getAttribute('label')).toBe('Name');
    expect(field.getAttribute('type')).toBe('text');
  });

  it('renders multiple fields each with unique name from id', async () => {
    const page = await newSpecPage({
      components: [WbFormRenderer, WbFormField],
      template: () => <wb-form-renderer></wb-form-renderer>,
    });
    const instance = page.rootInstance as WbFormRenderer;
    await instance.setFields([
      { id: 1, type: 'text', label: 'A' },
      { id: 2, type: 'checkbox', label: 'B' },
    ]);
    await page.waitForChanges();
    const fields = page.root.shadowRoot!.querySelectorAll('wb-form-field');
    expect(fields.length).toBe(2);
    expect(fields[0].getAttribute('name')).toBe('field.1');
    expect(fields[1].getAttribute('name')).toBe('field.2');
    expect(fields[0].getAttribute('label')).toBe('A');
    expect(fields[1].getAttribute('label')).toBe('B');
  });

  it('forwards subtype and restrictions to wb-form-field', async () => {
    const page = await newSpecPage({
      components: [WbFormRenderer, WbFormField],
      template: () => <wb-form-renderer></wb-form-renderer>,
    });
    const instance = page.rootInstance as WbFormRenderer;
    await instance.setFields([
      { id: 3, type: 'text', label: 'Age', subtype: 'number', restrictions: { number: { min: 0, max: 120 } } },
    ]);
    await page.waitForChanges();
    const field = page.root.shadowRoot!.querySelector('wb-form-field')!;
    expect(field.getAttribute('subtype')).toBe('number');
    expect(field.getAttribute('restrictions')).toBe(JSON.stringify({ number: { min: 0, max: 120 } }));
  });

  it('setFields updates the rendered fields', async () => {
    const page = await newSpecPage({
      components: [WbFormRenderer, WbFormField],
      template: () => <wb-form-renderer></wb-form-renderer>,
    });
    const instance = page.rootInstance as WbFormRenderer;
    await instance.setFields([{ id: 1, type: 'text', label: 'Name' }]);
    await page.waitForChanges();
    const field = page.root.shadowRoot!.querySelector('wb-form-field')!;
    expect(field.getAttribute('name')).toBe('field.1');
    expect(field.getAttribute('label')).toBe('Name');
  });

  it('setFields with reordered list updates field order', async () => {
    const page = await newSpecPage({
      components: [WbFormRenderer, WbFormField],
      template: () => <wb-form-renderer></wb-form-renderer>,
    });
    const instance = page.rootInstance as WbFormRenderer;
    await instance.setFields([
      { id: 1, type: 'text', label: 'A' },
      { id: 2, type: 'text', label: 'B' },
    ]);
    await page.waitForChanges();

    await instance.setFields([
      { id: 2, type: 'text', label: 'B' },
      { id: 1, type: 'text', label: 'A' },
    ]);
    await page.waitForChanges();
    const fields = page.root.shadowRoot!.querySelectorAll('wb-form-field');
    expect(fields.length).toBe(2);
    expect(fields[0].getAttribute('name')).toBe('field.2');
    expect(fields[1].getAttribute('name')).toBe('field.1');
  });

  it('submitting the form emits wbSubmit with field values', async () => {
    const page = await newSpecPage({
      components: [WbFormRenderer, WbFormField],
      template: () => <wb-form-renderer></wb-form-renderer>,
    });
    const instance = page.rootInstance as WbFormRenderer;
    await instance.setFields([{ id: 1, type: 'text', label: 'Name' }]);
    await page.waitForChanges();

    const spy = jest.fn();
    page.root.addEventListener('wbSubmit', spy);

    const input = page.root.shadowRoot!.querySelector('input')!;
    input.value = 'Alice';
    input.dispatchEvent(new Event('input'));

    const form = page.root.shadowRoot!.querySelector('form')!;
    form.dispatchEvent(new Event('submit'));

    expect(spy).toHaveBeenCalledTimes(1);
    expect(spy).toHaveBeenCalledWith(
      expect.objectContaining({
        detail: { 'field.1': 'Alice' },
      })
    );
  });

  it('renders submit and reset buttons', async () => {
    const page = await newSpecPage({
      components: [WbFormRenderer, WbFormField],
      template: () => <wb-form-renderer></wb-form-renderer>,
    });
    const buttons = page.root.shadowRoot!.querySelectorAll('button');
    expect(buttons.length).toBe(2);
    expect(buttons[0].getAttribute('type')).toBe('submit');
    expect(buttons[1].getAttribute('type')).toBe('reset');
  });
});
