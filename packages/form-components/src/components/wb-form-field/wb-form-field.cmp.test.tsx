import { describe, expect, test } from 'vitest';
import { userEvent } from 'vitest/browser';
// Components come from the built loader via vitest-setup.ts (defineCustomElements);
// helper module imported directly for docToHtml coverage in a real DOM.
import { docToHtml, isEmptyDoc, parseStoredValue } from './richtext';

type FieldEl = HTMLElement;

const mountField = async (attrs = ''): Promise<FieldEl> => {
  document.body.innerHTML = `<form id="f"><wb-form-field name="field.9" ${attrs}></wb-form-field></form>`;
  const el = document.querySelector('wb-form-field') as unknown as FieldEl;
  await customElements.whenDefined('wb-form-field');
  // wait for Stencil render + Tiptap mount in componentDidLoad
  for (let i = 0; i < 50 && !el.shadowRoot?.querySelector('.tiptap'); i++) {
    await new Promise(r => setTimeout(r, 20));
  }
  return el;
};

const editable = (el: FieldEl) => el.shadowRoot.querySelector('.tiptap') as HTMLElement;
const toolbarBtn = (el: FieldEl, title: string) => el.shadowRoot.querySelector<HTMLButtonElement>(`.wb-richtext__toolbar button[title="${title}"]`);
const formValue = (el: FieldEl) => new FormData(el.closest('form') as HTMLFormElement).get('field.9');
const parsedValue = (el: FieldEl) => JSON.parse(formValue(el) as string);

test('renders a fixed toolbar above the editable area', async () => {
  const el = await mountField('type="richtext" label="Bio"');
  const buttons = Array.from(el.shadowRoot.querySelectorAll('.wb-richtext__toolbar button')).map(b => b.getAttribute('title'));
  expect(buttons).toEqual([
    'Bold',
    'Italic',
    'Underline',
    'Strikethrough',
    'Heading 2',
    'Heading 3',
    'Bullet list',
    'Ordered list',
    'Blockquote',
    'Clear formatting',
    'Undo',
    'Redo',
    'Link',
  ]);
  const editor = editable(el);
  expect(editor.getAttribute('contenteditable')).toBe('true');
  // toolbar sits above the editable area
  const toolbarBox = el.shadowRoot.querySelector('.wb-richtext__toolbar')!.getBoundingClientRect();
  const editorBox = editor.getBoundingClientRect();
  expect(toolbarBox.bottom).toBeLessThanOrEqual(editorBox.top);
});

test('typing produces a JSON-string form value and empty submits an empty string', async () => {
  const el = await mountField('type="richtext" label="Bio"');
  expect(formValue(el)).toBe('');

  await userEvent.click(editable(el));
  await userEvent.type(editable(el), 'Hello');

  const value = formValue(el);
  expect(typeof value).toBe('string');
  const doc = JSON.parse(value as string);
  expect(doc.type).toBe('doc');
  expect(doc.content[0].content[0].text).toBe('Hello');
});

test('applies bold via toolbar and reflects active state', async () => {
  const el = await mountField('type="richtext" label="Bio"');
  await userEvent.click(editable(el));
  await userEvent.type(editable(el), 'Hello world');
  expect(toolbarBtn(el, 'Bold')!.classList.contains('is-active')).toBe(false);

  await userEvent.keyboard('{ControlOrMeta>}a{/ControlOrMeta}');
  await userEvent.click(toolbarBtn(el, 'Bold')!);
  await waitForTick();

  expect(toolbarBtn(el, 'Bold')!.classList.contains('is-active')).toBe(true);
  const textNode = parsedValue(el).content[0].content[0];
  expect(textNode.marks.map((m: { type: string }) => m.type)).toContain('bold');
});

const applyBtn = (el: FieldEl) => Array.from(el.shadowRoot.querySelectorAll('.wb-richtext__linkbar button')).find(b => b.textContent === 'Apply')!;
const waitForTick = () => new Promise(r => setTimeout(r, 30));

test('placeholder shows while empty and disappears once content exists', async () => {
  const el = await mountField('type="richtext" label="Bio" placeholder="Tell us more"');
  const p = editable(el).querySelector('p')!;
  expect(p.getAttribute('data-placeholder')).toBe('Tell us more');
  expect(p.classList.contains('is-editor-empty')).toBe(true);

  await userEvent.click(editable(el));
  await userEvent.type(editable(el), 'x');
  await waitForTick();
  expect(p.hasAttribute('data-placeholder')).toBe(false);
});

describe('richtext validation', () => {
  // The lazy loader build keeps ElementInternals internal to the component, so
  // validity is asserted black-box via the native FCC surface: :invalid and
  // the ancestor form's checkValidity().
  test('required-empty reports missing value with the label message', async () => {
    const el = await mountField('type="richtext" label="Bio" required');
    const form = el.closest('form') as HTMLFormElement;
    expect(el.matches(':invalid')).toBe(true);
    expect(form.checkValidity()).toBe(false);
    // native bubble text comes from the setValidity message
    expect(el.shadowRoot.querySelector('.wb-richtext__error')).toBeNull();

    await userEvent.click(editable(el));
    await userEvent.type(editable(el), 'written');
    await waitForTick();
    expect(el.matches(':invalid')).toBe(false);
    expect(form.checkValidity()).toBe(true);
  });

  test('overflow past maxLength flags a custom error without blocking input', async () => {
    const el = await mountField('type="richtext" label="Bio"');
    (el as any).restrictions = { text: { maxLength: 5 } };
    await new Promise(r => setTimeout(r, 20));

    await userEvent.click(editable(el));
    await userEvent.type(editable(el), '123456789');
    await waitForTick();

    // input not blocked
    expect(editable(el).textContent).toBe('123456789');
    expect(el.matches(':invalid')).toBe(true);
    expect((el.closest('form') as HTMLFormElement).checkValidity()).toBe(false);
  });

  test('valid content clears errors', async () => {
    const el = await mountField('type="richtext" label="Bio"');
    (el as any).restrictions = { text: { maxLength: 5 } };
    await new Promise(r => setTimeout(r, 20));

    await userEvent.click(editable(el));
    await userEvent.type(editable(el), '123456789');
    await waitForTick();
    expect(el.matches(':invalid')).toBe(true);

    await userEvent.keyboard('{ControlOrMeta>}a{/ControlOrMeta}');
    await userEvent.keyboard('{Backspace}');
    await waitForTick();

    expect(editable(el).textContent).toBe('');
    expect(el.matches(':invalid')).toBe(false);
    expect((el.closest('form') as HTMLFormElement).checkValidity()).toBe(true);
  });
});

describe('disabled and reset behavior', () => {
  test('disabled hides the toolbar, locks editing, keeps content', async () => {
    const el = await mountField('type="richtext" label="Bio"');
    await userEvent.click(editable(el));
    await userEvent.type(editable(el), 'Kept content');

    el.toggleAttribute('disabled', true);
    await waitForTick();

    const toolbar = el.shadowRoot.querySelector('.wb-richtext__toolbar')!;
    expect(toolbar.hasAttribute('hidden')).toBe(true);
    expect(editable(el).getAttribute('contenteditable')).toBe('false');
    expect(editable(el).textContent).toContain('Kept content');

    el.toggleAttribute('disabled', false);
    await waitForTick();
    expect(toolbar.hasAttribute('hidden')).toBe(false);
    expect(editable(el).getAttribute('contenteditable')).toBe('true');
  });

  test('reset clears to an empty document pushing an empty string', async () => {
    const el = await mountField('type="richtext" label="Bio"');
    await userEvent.click(editable(el));
    await userEvent.type(editable(el), 'Some words');

    (el.closest('form') as HTMLFormElement).reset();
    await waitForTick();

    expect(editable(el).textContent).toBe('');
    expect(isEmptyDoc(parseStoredValue(formValue(el) as string) ?? { type: 'doc' })).toBe(true);
    expect(formValue(el)).toBe('');
  });

  test('disabled prop locks editing and hides the toolbar', async () => {
    const el = await mountField('type="richtext" label="Bio"');
    await userEvent.click(editable(el));
    await userEvent.type(editable(el), 'Kept content');

    (el as any).disabled = true;
    await waitForTick();

    const toolbar = el.shadowRoot.querySelector('.wb-richtext__toolbar')!;
    expect(toolbar.hasAttribute('hidden')).toBe(true);
    expect(editable(el).getAttribute('contenteditable')).toBe('false');
    expect(editable(el).textContent).toContain('Kept content');
  });
});

describe('link flow', () => {
  test('applies https URLs via the inline input', async () => {
    const el = await mountField('type="richtext" label="Bio"');
    await userEvent.click(editable(el));
    await userEvent.type(editable(el), 'click here');
    await userEvent.keyboard('{ControlOrMeta>}a{/ControlOrMeta}');

    await userEvent.click(toolbarBtn(el, 'Link')!);
    const input = el.shadowRoot.querySelector('.wb-richtext__linkbar input') as HTMLInputElement;
    expect(input).not.toBeNull();

    await userEvent.fill(input, 'https://example.com');
    await userEvent.click(applyBtn(el));
    await waitForTick();

    const anchor = editable(el).querySelector('a');
    expect(anchor?.getAttribute('href')).toBe('https://example.com');
    expect(el.shadowRoot.querySelector('.wb-richtext__linkbar')!.hasAttribute('hidden')).toBe(true);
  });

  test('rejects javascript: URLs without applying the link', async () => {
    const el = await mountField('type="richtext" label="Bio"');
    await userEvent.click(editable(el));
    await userEvent.type(editable(el), 'click here');
    await userEvent.keyboard('{ControlOrMeta>}a{/ControlOrMeta}');
    await userEvent.click(toolbarBtn(el, 'Link')!);
    const input = el.shadowRoot.querySelector('.wb-richtext__linkbar input') as HTMLInputElement;
    await userEvent.fill(input, 'https://safe.example');
    await userEvent.click(applyBtn(el));
    await waitForTick();
    expect(editable(el).querySelector('a')?.getAttribute('href')).toBe('https://safe.example');

    await userEvent.keyboard('{ControlOrMeta>}a{/ControlOrMeta}');
    await userEvent.click(toolbarBtn(el, 'Link')!);
    const input2 = el.shadowRoot.querySelector('.wb-richtext__linkbar input') as HTMLInputElement;
    await userEvent.fill(input2, 'javascript:alert(1)');
    await userEvent.click(applyBtn(el));
    await waitForTick();

    // refused: error shown and href unchanged
    expect(el.shadowRoot.querySelector('.wb-richtext__error')?.textContent).toBe('Enter a valid URL');
    expect(editable(el).querySelector('a')?.getAttribute('href')).toBe('https://safe.example');
  });
});

describe('docToHtml export (browser DOM)', () => {
  test('converts stored documents to matching HTML markup', () => {
    const html = docToHtml({
      type: 'doc',
      content: [
        { type: 'paragraph', content: [{ type: 'text', text: 'Hello', marks: [{ type: 'bold' }] }] },
        {
          type: 'orderedList',
          content: [{ type: 'listItem', content: [{ type: 'paragraph', content: [{ type: 'text', text: 'One' }] }] }],
        },
      ],
    });
    expect(html).toContain('<strong>Hello</strong>');
    expect(html).toContain('<ol>');
    expect(html).toContain('<li>');
  });

  test('strips hostile attributes and executable script content', () => {
    const hostile = {
      type: 'doc',
      content: [
        {
          type: 'paragraph',
          attrs: { onload: 'alert(1)' },
          content: [
            {
              type: 'text',
              text: '<script>alert(2)</script>',
              attrs: { onerror: 'alert(1)' },
              marks: [{ type: 'bold', attrs: { onclick: 'alert(1)' } }],
            },
          ],
        },
      ],
    };
    const html = docToHtml(hostile as never);
    expect(html).not.toContain('onerror');
    expect(html).not.toContain('onload');
    expect(html).not.toContain('onclick');
    expect(html).not.toContain('<script');
    expect(html).toContain('&lt;script&gt;');
  });
});
