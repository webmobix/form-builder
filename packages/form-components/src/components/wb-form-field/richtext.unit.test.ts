import { getSchema, type JSONContent } from '@tiptap/core';
import { describe, expect, it, vi } from 'vitest';
import { applyLink, buildExtensions, isAllowedLinkUrl, isEmptyDoc, plainTextLength } from './richtext';

const schema = () => getSchema(buildExtensions());

describe('richtext feature-set configuration', () => {
  it('registers the agreed marks', () => {
    const s = schema();
    for (const mark of ['bold', 'italic', 'underline', 'strike', 'link']) {
      expect(s.marks[mark], `mark ${mark}`).toBeDefined();
    }
  });

  it('registers the agreed nodes including H2/H3 only lists and blockquote', () => {
    const s = schema();
    for (const node of ['paragraph', 'heading', 'bulletList', 'orderedList', 'blockquote']) {
      expect(s.nodes[node], `node ${node}`).toBeDefined();
    }
  });

  it('restricts headings to levels 2 and 3', () => {
    const heading = schema().nodes.heading;
    const tags = heading?.spec.parseDOM?.map(rule => (rule as { tag?: string }).tag).filter(Boolean);
    expect(tags).toContain('h2');
    expect(tags).toContain('h3');
    expect(tags?.join(' ')).not.toContain('h1');
    expect(tags?.join(' ')).not.toContain('h4');
    expect(tags?.join(' ')).not.toContain('h5');
    expect(tags?.join(' ')).not.toContain('h6');
  });

  it('does not register excluded features', () => {
    const s = schema();
    expect(s.marks.code).toBeUndefined();
    expect(s.nodes.codeBlock).toBeUndefined();
    expect(s.nodes.horizontalRule).toBeUndefined();
    expect(s.nodes.image).toBeUndefined();
    expect(s.nodes.table).toBeUndefined();
  });
});

describe('isEmptyDoc', () => {
  it('treats a bare doc and blank paragraphs as empty', () => {
    expect(isEmptyDoc({ type: 'doc' })).toBe(true);
    expect(isEmptyDoc({ type: 'doc', content: [{ type: 'paragraph' }] })).toBe(true);
    expect(
      isEmptyDoc({
        type: 'doc',
        content: [{ type: 'paragraph' }, { type: 'paragraph', content: [{ type: 'text', text: '' }] }],
      }),
    ).toBe(true);
  });

  it('treats any text node as non-empty regardless of markup or node type', () => {
    const bold = (text: string): JSONContent => ({ type: 'text', text, marks: [{ type: 'bold' }] });
    expect(isEmptyDoc({ type: 'doc', content: [{ type: 'paragraph', content: [bold('hi')] }] })).toBe(false);
    expect(
      isEmptyDoc({
        type: 'doc',
        content: [{ type: 'paragraph' }, { type: 'blockquote', content: [{ type: 'paragraph', content: [bold('quoted')] }] }],
      }),
    ).toBe(false);
  });
});

describe('plainTextLength', () => {
  it('counts concatenated text-node content and excludes markup overhead', () => {
    const bold = (text: string): JSONContent => ({ type: 'text', text, marks: [{ type: 'bold' }] });
    const doc: JSONContent = {
      type: 'doc',
      content: [
        { type: 'paragraph', content: [bold('Hello'), { type: 'text', text: ' world' }] },
        { type: 'paragraph', content: [bold('!')] },
      ],
    };
    expect(plainTextLength(doc)).toBe('Hello world!'.length);
  });

  it('is zero for an empty document', () => {
    expect(plainTextLength({ type: 'doc', content: [{ type: 'paragraph' }] })).toBe(0);
  });
});

describe('link URL validation', () => {
  it('allows https/http/mailto and scheme-less URLs', () => {
    expect(isAllowedLinkUrl('https://example.com')).toBe(true);
    expect(isAllowedLinkUrl('http://example.com/x?y=1')).toBe(true);
    expect(isAllowedLinkUrl('mailto:someone@example.com')).toBe(true);
    expect(isAllowedLinkUrl('/relative/path')).toBe(true);
    expect(isAllowedLinkUrl('#anchor')).toBe(true);
    expect(isAllowedLinkUrl('www.example.com')).toBe(true);
  });

  it('rejects dangerous schemes', () => {
    expect(isAllowedLinkUrl('javascript:alert(1)')).toBe(false);
    expect(isAllowedLinkUrl('data:text/html,<script>alert(1)</script>')).toBe(false);
    expect(isAllowedLinkUrl('vbscript:msgbox')).toBe(false);
    expect(isAllowedLinkUrl('')).toBe(false);
  });
});

// NOTE: docToHtml output (incl. hostile-attribute stripping) is covered in the
// browser-mode suite — the stencil mock-doc environment lacks the DOM APIs
// (`document.implementation`) that Tiptap's generateHTML and DOMPurify need.

describe('applyLink', () => {
  it('refuses unsafe URLs without dispatching commands', () => {
    const chain = vi.fn(() => {
      throw new Error('commands must not run for rejected URLs');
    });
    expect(applyLink({ chain } as never, 'javascript:alert(1)')).toBe(false);
    expect(chain).not.toHaveBeenCalled();
  });

  it('dispatches setLink for safe URLs', () => {
    let ran = false;
    const setLink = () => {
      ran = true;
      return { run: () => true };
    };
    const extendMarkRange = () => ({ setLink });
    const editor = {
      chain: () => ({ focus: () => ({ extendMarkRange }) }),
    };
    expect(applyLink(editor as never, 'https://example.com')).toBe(true);
    expect(ran).toBe(true);
  });
});
