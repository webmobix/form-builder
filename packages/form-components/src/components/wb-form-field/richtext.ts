/**
 * Rich text engine for the `richtext` field type: Tiptap extension set,
 * toolbar model, document helpers, and the sanitized HTML export path.
 *
 * Kept as a plain (non-component) module so it can later be lifted into a
 * dedicated component or reused by the paragraph design element.
 */

import { type Editor, type Extensions, generateHTML, type JSONContent } from '@tiptap/core';
import { Placeholder } from '@tiptap/extension-placeholder';
import { StarterKit } from '@tiptap/starter-kit';
import DOMPurify from 'dompurify';

/** Resolved per decoration run so late placeholder edits reach a live editor. */
export type PlaceholderProvider = () => string;

/** Feature tier agreed for this change: no images/tables/code/horizontal rule. */
export function buildExtensions(placeholder?: string | PlaceholderProvider): Extensions {
  const extensions: Extensions = [
    StarterKit.configure({
      heading: { levels: [2, 3] },
      code: false,
      codeBlock: false,
      horizontalRule: false,
    }),
    Placeholder.configure({
      placeholder: typeof placeholder === 'function' ? placeholder : () => placeholder ?? '',
      // Show the helper text in the empty editor without requiring focus.
      showOnlyCurrent: false,
    }),
  ];
  return extensions;
}

// ---------------------------------------------------------------------------
// Link URL handling
// ---------------------------------------------------------------------------

/**
 * Protocol allowlist applied when a URL is entered explicitly via the
 * inline input (the Link extension's own validation covers paste/autolink).
 * Blocks `javascript:` and friends while allowing https/http/mailto URLs
 * and same-document anchors/relative paths.
 */
export function isAllowedLinkUrl(url: string): boolean {
  const trimmed = url.trim();
  if (!trimmed) return false;
  if (/^(https?:|mailto:)/i.test(trimmed)) return true;
  // No scheme: treat as relative path / anchor / www shorthand.
  return !/^[a-z][a-z0-9+.-]*:/i.test(trimmed);
}

export function applyLink(editor: Editor, url: string): boolean {
  if (!isAllowedLinkUrl(url)) return false;
  return editor.chain().focus().extendMarkRange('link').setLink({ href: url.trim() }).run();
}

export function removeLink(editor: Editor): void {
  editor.chain().focus().extendMarkRange('link').unsetLink().run();
}

// ---------------------------------------------------------------------------
// Toolbar model
// ---------------------------------------------------------------------------

export interface ToolbarAction {
  id: string;
  label: string;
  title: string;
  /** Runs the toolbar action; returns false when the command did not apply. */
  command: (editor: Editor) => boolean | undefined;
  active: (editor: Editor) => boolean;
}

const action = (id: string, label: string, title: string, command: ToolbarAction['command'], active: ToolbarAction['active']): ToolbarAction => ({
  id,
  label,
  title,
  command,
  active,
});

/** Ordered fixed-toolbar actions rendered above the editable area. */
export const TOOLBAR_ACTIONS: ToolbarAction[] = [
  action(
    'bold',
    'B',
    'Bold',
    ed => ed.chain().focus().toggleBold().run(),
    ed => ed.isActive('bold'),
  ),
  action(
    'italic',
    'I',
    'Italic',
    ed => ed.chain().focus().toggleItalic().run(),
    ed => ed.isActive('italic'),
  ),
  action(
    'underline',
    'U',
    'Underline',
    ed => ed.chain().focus().toggleUnderline().run(),
    ed => ed.isActive('underline'),
  ),
  action(
    'strike',
    'S',
    'Strikethrough',
    ed => ed.chain().focus().toggleStrike().run(),
    ed => ed.isActive('strike'),
  ),
  action(
    'h2',
    'H2',
    'Heading 2',
    ed => ed.chain().focus().toggleHeading({ level: 2 }).run(),
    ed => ed.isActive('heading', { level: 2 }),
  ),
  action(
    'h3',
    'H3',
    'Heading 3',
    ed => ed.chain().focus().toggleHeading({ level: 3 }).run(),
    ed => ed.isActive('heading', { level: 3 }),
  ),
  action(
    'bulletList',
    '• List',
    'Bullet list',
    ed => ed.chain().focus().toggleBulletList().run(),
    ed => ed.isActive('bulletList'),
  ),
  action(
    'orderedList',
    '1. List',
    'Ordered list',
    ed => ed.chain().focus().toggleOrderedList().run(),
    ed => ed.isActive('orderedList'),
  ),
  action(
    'blockquote',
    '❝',
    'Blockquote',
    ed => ed.chain().focus().toggleBlockquote().run(),
    ed => ed.isActive('blockquote'),
  ),
];

export const CLEAR_FORMATTING_ACTION = action(
  'clear',
  '⌫ Format',
  'Clear formatting',
  ed => ed.chain().focus().unsetAllMarks().run(),
  () => false,
);

export const UNDO_ACTION = action(
  'undo',
  '↶',
  'Undo',
  ed => ed.chain().focus().undo().run(),
  () => false,
);

export const REDO_ACTION = action(
  'redo',
  '↷',
  'Redo',
  ed => ed.chain().focus().redo().run(),
  () => false,
);

/** Full ordered model including link / clear / undo / redo. */
export const FULL_TOOLBAR_ACTIONS: ToolbarAction[] = [...TOOLBAR_ACTIONS, CLEAR_FORMATTING_ACTION, UNDO_ACTION, REDO_ACTION];

// ---------------------------------------------------------------------------
// Document helpers
// ---------------------------------------------------------------------------

function hasTextContent(node: JSONContent): boolean {
  if (node.type === 'text') return !!node.text && node.text.length > 0;
  return (node.content ?? []).some(hasTextContent);
}

/**
 * A doc is empty when it carries no text nodes at all (only blank
 * paragraphs / bare structure). Such docs serialize to `''` in submissions.
 */
export function isEmptyDoc(doc: JSONContent): boolean {
  return !hasTextContent(doc);
}

function countText(node: JSONContent): number {
  if (node.type === 'text') return node.text?.length ?? 0;
  return (node.content ?? []).reduce((sum, child) => sum + countText(child), 0);
}

/** Plain-text length: concatenated text-node content, markup excluded. */
export function plainTextLength(doc: JSONContent): number {
  return countText(doc);
}

/** Parse a stored value (`''` or a JSON doc string) back into a Tiptap doc. */
export function parseStoredValue(value: string | null | undefined): JSONContent | null {
  if (!value) return null;
  try {
    const parsed = JSON.parse(value);
    if (parsed && typeof parsed === 'object' && parsed.type === 'doc') return parsed as JSONContent;
    return null;
  } catch {
    return null;
  }
}

// ---------------------------------------------------------------------------
// HTML export boundary
// ---------------------------------------------------------------------------

/**
 * Convert a stored rich text document to sanitized HTML. This is the single
 * HTML-producing path for rich text values; DOMPurify strips scripts and
 * event-handler attributes before anything reaches a consumer's DOM.
 */
export function docToHtml(jsonDoc: JSONContent): string {
  const html = generateHTML(jsonDoc, buildExtensions());
  return DOMPurify.sanitize(html);
}
