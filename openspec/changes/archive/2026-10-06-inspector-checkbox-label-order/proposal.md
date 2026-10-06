# Proposal

## Why

Inside `wb-inspector`, checkbox toggles ("Required", "Multiline") currently render their label text first and the checkbox control after it, so the box sits on the right edge of the row. Placing the control before its label is the more conventional form layout and makes the checkbox easier to scan and click; the current order reads as reversed.

## What Changes

- In `wb-inspector`, every checkbox toggle row SHALL render the checkbox control before its label text, with the label on the right side of the control. This reverses the current order (label first, control last).
- This applies to the existing "Required" and "Multiline" toggles, and to any future checkbox toggle added to the inspector.
- No behavior other than visual order changes: the toggles still show the same labels and checked state, still emit the same `wbFieldUpdated` patches, and remain clickable through the wrapping `<label>`.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `field-properties`: Adds a requirement that inspector checkbox toggles render the control before the label (control on the left, label on the right), applying to the Required and Multiline toggles.

## Impact

- **Code**: `packages/form-components/src/components/wb-inspector/wb-inspector.tsx` (reorder the `<input type="checkbox">` before the `<span class="field-label">` in the Required and Multiline rows). The `field-group--checkbox` flex row in `wb-inspector.css` is unchanged unless a visual-order-only approach is chosen.
- **Generated/docs**: No prop, event, or method changes; Stencil-generated `readme.md`, `components.d.ts`, and the React wrapper are unaffected.
- **Tests**: No new unit tests; the reordering is visual-only and the existing label/patch tests continue to pass.
- **APIs / Events**: unchanged.
- **Dependencies**: none.
- **Compatibility**: visual-only and backward compatible; no host wiring or public API changes.
