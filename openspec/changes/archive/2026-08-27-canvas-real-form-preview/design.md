## Context

The builder is a Stencil web-components monorepo (`wb-*` components, shadow DOM, per-component CSS with `--wb-*` theming vars, accent `#2f6fed`, no icon library). The editor canvas (`wb-canvas`) owns `FieldMeta[]` state and today renders each element as a simplified row chip — label text + type badge + a small `⠿` handle — while the real form lives in `wb-form-renderer` → `wb-form-field` (native inputs/textarea/checkbox/date, Tiptap richtext, flex row/column layout, 12px gaps). Drag & drop is custom pointer events (no library): handle-only initiation on canvas rows, cross-shadow palette drag mapped onto canvas methods. Selection via click emits `wbFieldSelected` to the inspector. `wb-form-field` has no public disable mechanism today; only the native form-associated `formDisabledCallback` disables the input/Tiptap editor and hides the toolbar.

## Goals / Non-Goals

**Goals:**
- Canvas renders every element as its true real-form appearance (data fields via `wb-form-field`; headings/paragraphs/layout mirroring renderer markup).
- Inert controls that look completely normal (no dimming); interaction removed only.
- Clear affordances: hover border, distinct selection ring, always-visible floating drag handle.
- Editor chrome (type badges, column dashes) hidden by default, revealed contextually.
- Preserve existing selection/inspector flow, palette→canvas drag, and reorder mechanics.

**Non-Goals:**
- Implementing a real `<select>` for Dropdown fields (mirrors current text-input fallback).
- Redesigning drag ghost/insertion indicators (color harmonization only).
- Changes to `wb-form-renderer`, palette, inspector, or dev-harness wiring.
- Exhaustive lockdown of every exotic native-control interaction (best-effort inertness).
- Any other preview surfaces (none exist).

## Decisions

1. **Reuse `wb-form-field` inside the canvas instead of imitation markup.** Data fields are stamped as real `wb-form-field` elements driven by their `FieldMeta`, so pixel fidelity is guaranteed by construction and stays in sync when field styling evolves. Alternative (canvas-specific "preview" markup) rejected: two sources of truth drift.
2. **Public `disabled` prop on `wb-form-field` reusing the `formDisabledCallback` path.** The prop sets internal disabled state (`inputEl.disabled = true`, `editor.setEditable(false)`, toolbar hidden) exactly like the native lifecycle; default `false` keeps renderer behavior unchanged. Canvas CSS overrides the browser's default grayed-out disabled styling so fields look normal. Alternative (`pointer-events: none` CSS hack without touching the component) rejected: keyboard focus and native popups leak through.
3. **Read-only Tiptap instances for richtext rows.** A real editor in non-editable mode shows the placeholder hint and matches live rendering exactly; perf cost accepted because richtext fields per form are few. Static sanitized HTML was rejected (blank box when empty, placeholder lost).
4. **Mirror renderer layout markup for design elements.** Headings render as `<h2>{label}`, paragraphs as `<p>` showing `text ?? label` (superseding the old "label as row title" rule), row containers as `display:flex; gap:12px` columns (`flex:1`, equal widths) recursively rendering children — same values as `wb-form-renderer.css`.
5. **Affordance styling.** Hover: ~2px solid light-blue outline (`#9db9f5` family) on leaf elements; dashed variant of the same blue on layout containers (rows/columns) to distinguish nesting. Selected: persistent solid `#2f6fed` ring + faint shadow regardless of hover. Exact shades are implementation detail within these families.
6. **Drag handle = always-visible floating grip badge at top-left**, overlapping the element's corner (grip glyph or inline SVG — no icon library exists), tooltip "Drag to move", pointer capture as today; grabbing also selects the element. Dragging stays **handle-only** — matches the explicit affordance requirement and avoids click-vs-drag ambiguity over inert controls; whole-element dragging would require reworking both canvas-row and palette cross-shadow pointer logic.
7. **Chrome reveal rules.** Type badge appears only while hovered/selected as a floating neutral tag at the element's top-right corner. Column outlines appear on container hover/drag targeting; an **empty column renders a slim dashed "empty slot" strip (~44px)** so drops remain discoverable, hidden once children exist.
8. **Interaction contract.** Click anywhere on an element selects it and populates the inspector; click on empty canvas deselects; inner controls are non-focusable and ignore obvious interactions; Tab order lands on element wrappers, never inside controls. Perfect native-edge-case lockdown is explicitly low priority.
9. **Scope confined to `wb-canvas` internals + `wb-form-field` prop.** Generated React wrappers regenerate automatically from Stencil docs.

## Risks / Trade-offs

- [Tiptap instances on canvas cost memory/init time] → Accepted for fidelity; if large forms suffer, fall back to static HTML snapshot later behind the same interface.
- [Geometry-based drop targeting scans `[data-row]` / `.column-child` rects] → Real rendered elements change those rects; keep the same data attributes on wrappers so `computeColumnDropTarget`/`getInsertionIndex` keep working, verified against nested rows.
- [Browser default disabled styling fights "looks normal"] → Explicit CSS overrides for `input:disabled` etc. inside `wb-form-field`; visually verified per control type.
- [Floating handle can overlap short/narrow elements (e.g., checkbox labels)] → Offset placement outside the card edge where possible; polish task included.
- [Existing specs assume chip-style canvas] → Delta specs update `design-elements` and `richtext-field` requirements rather than silently diverging.
