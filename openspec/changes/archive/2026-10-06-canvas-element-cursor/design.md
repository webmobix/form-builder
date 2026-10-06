# Design

## Context

See `proposal.md` for motivation and `specs/canvas-preview/spec.md` for the requirements this design serves.

The canvas (`packages/form-components/src/components/wb-canvas/wb-canvas.tsx`) renders each element as a `.canvas-element` wrapper (`cursor: pointer`) containing a `.element-body` div. For data fields the body holds a disabled `wb-form-field`; for design elements it holds `.preview-heading`, `.preview-paragraph`, or a `span.body`; for rows it holds a `.row-container` whose columns contain nested `.canvas-element` wrappers.

Two mechanics cause the inconsistency:

1. **Cursor overrides inside descendants.** `wb-canvas.css` sets `cursor: pointer` on `.canvas-element`, but the cursor is overridden lower down: `wb-form-field.css` sets `cursor: default` on disabled inputs/textareas/selects, and the user-agent stylesheet gives `<label>` a default cursor. Because `wb-form-field` uses shadow DOM, canvas CSS cannot reach those nodes.
2. **Disabled controls swallow clicks.** Browsers do not dispatch/bubble click events from disabled form controls, so a click on the rendered preview never reaches `.canvas-element`'s `onClick`, and the element is not selected.

Nested layouts constrain the fix: whatever makes the leaf preview non-interactive must not affect nested `.canvas-element` wrappers inside a row's columns.

## Goals / Non-Goals

**Goals:**
- One consistent pointer cursor over every non-interactive part of an element, including the parts owned by `wb-form-field`'s shadow DOM.
- Clicks on the inert preview control select the element.
- Nested elements inside row-container columns keep their own hover, cursor, and click behavior.

**Non-Goals:**
- Changing `wb-form-field`'s disabled styling, cursor, or shadow-DOM internals.
- Changing drag/drop, selection events, or the inspector wiring.
- Changing the grip (`grab`) or delete (`pointer`) cursors, which already behave correctly.

## Decisions

### Decision: Make the leaf preview body transparent to pointer events, not just recolor the cursor
Add a modifier class to `.element-body` for non-row elements, e.g. `.element-body--inert`, and set `pointer-events: none` on it.

Rationale: `pointer-events: none` solves both symptoms at once. The inert subtree drops out of hit-testing, so (a) the cursor is computed from the `.canvas-element` wrapper (`pointer`) no matter which inner surface is under the pointer, including shadow-DOM labels and disabled controls, and (b) click targets resolve to `.canvas-element`, restoring click-to-select. A cursor-only override inside `wb-canvas.css` could not reach shadow-DOM nodes and would leave the click-swallowing behavior unfixed.

Alternatives considered:
- **`cursor: pointer` overrides scoped to canvas descendants.** Cannot pierce `wb-form-field`'s shadow root (no exposed `::part`s on its internals) and does not fix absorbed clicks. Rejected.
- **Add a `canvas`/`inert` prop or new part/cursor rules to `wb-form-field`.** Leaks canvas presentation concerns into a reusable form component and changes its public surface. Rejected.
- **Wrap each preview in a sibling overlay div that captures pointer events.** Adds DOM and z-index/positioning complexity for no behavioral gain. Rejected.

### Decision: Scope transparency to non-row bodies via a class rather than broad selectors
The condition is evaluated from the existing `isRow` flag in `renderElement`, so only leaf bodies get the class. Row containers keep default pointer behavior, which is required for their nested wrappers to be individually hoverable and selectable.

Alternatives considered:
- **CSS-only selectors in `wb-canvas.css`** targeting `wb-form-field`, `.preview-heading`, `.preview-paragraph`, `.body` as direct children of `.element-body`. Works today but silently breaks if preview markup gains a wrapper or a new preview type. The explicit class states the intent at the render site. Rejected in favor of the class.

### Decision: Keep the grip and remove button outside the inert region
Both are siblings of `.element-body` inside `.canvas-element`, so they are unaffected by `pointer-events: none` on the body and keep their `grab`/`pointer` cursors and handlers.

## Risks / Trade-offs

- **Text selection inside preview content stops working** (pointer events no longer reach the text) → Acceptable: the preview is inert and the wrapper is a `role="button"` selection target; the live form, not the canvas, is where text is read. Covered by the existing inert-controls requirement.
- **Future preview types added inside `.element-body` for a non-row element** automatically become inert → Intended; the leaf body is always non-interactive by definition. A new *interactive* body type would need to opt out of the modifier.
- **`:hover` no longer fires on individual inner nodes** (e.g. an input) → The element-level hover outline still fires because the hit target is `.canvas-element`; no inner hover state exists on disabled controls.

## Migration Plan

No migration. Pure presentation/hit-testing change with no API, data, or event changes; safe to ship as a normal patch.
