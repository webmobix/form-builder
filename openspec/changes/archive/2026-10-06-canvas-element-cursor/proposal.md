# Proposal

## Why

On the canvas, the pointer affordance is inconsistent: the drag handle and delete button show correct cursors and the element's outer border shows `cursor: pointer`, but hovering the field label or the field body falls back to a default/text cursor, and the inert preview control swallows clicks so it cannot be used to select the element. This makes a single element feel like several unrelated hit targets and breaks the "click anywhere on an element selects it" behavior.

## What Changes

- Give every canvas element a single consistent pointer affordance: the default cursor over any non-interactive part of an element (label, field body, preview control, headings, paragraphs) SHALL be the same `pointer` cursor already used on the element border.
- Keep the deliberate exceptions: the drag grip keeps its `grab` cursor and the delete button keeps its `pointer` cursor.
- Make the inert preview control (the disabled `wb-form-field`, and other non-interactive preview content) transparent to pointer events so clicks land on the element wrapper instead of being swallowed by disabled controls, restoring click-to-select and correct cursor inheritance.
- Preserve nested layout behavior: elements nested inside row-container columns remain individually hoverable, clickable, and selectable.

## Capabilities

### New Capabilities
<!-- none -->

### Modified Capabilities
- `canvas-preview`: Add a requirement for a consistent, non-interactive pointer affordance across an element's hover surface, and clarify the existing inert-controls requirement so clicking the preview control selects the element rather than being absorbed by the disabled control.

## Impact

- `packages/form-components/src/components/wb-canvas/wb-canvas.css` — cursor/pointer-events rules for element bodies and preview content.
- `packages/form-components/src/components/wb-canvas/wb-canvas.tsx` — potentially a class/hook on the inert preview wrapper so pointer-events rules stay scoped to non-interactive content and never disable nested elements.
- No public API, event, or prop changes. No changes to `wb-form-field`.
- Behavior-only change; existing canvas unit/component tests continue to pass, with new coverage for hit-target/cursor behavior.
