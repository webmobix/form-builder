# Proposal

## Why

Inside `wb-inspector`, labels above input fields and labels next to checkboxes share the exact same `.field-label` styling (14px, weight 600, 0.5px letter-spacing, dimmed color). In a dense settings panel this makes checkbox captions compete visually with field captions, and there is no distinction a host could target. Hosts also cannot theme either label kind without reaching into the shadow DOM, because only the container is exposed as CSS custom properties. Separately, the read-only "Field" display line for data fields repeats information that is already implied by the palette entry used to create the field, and it clutters the panel.

## What Changes

- Give field labels (above inputs) and checkbox labels (next to checkboxes) distinct styling hooks: stacked labels keep the base `.field-label` class, checkbox labels get a `.field-label--checkbox` modifier.
- Expose both label kinds as CSS custom properties on `:host`, each falling back to a default, so hosts can theme them from outside the shadow DOM. The checkbox label's color and font-size fall back to the field-label values so a field-label override cascades to checkbox labels; its font-weight and letter-spacing keep distinct defaults so the kinds already look different.
- Remove the read-only "Field" display entry from the data-field inspector: the `Field` label line and its friendly type text are no longer rendered.
- Update `wb-inspector` documentation (`readme.md`) to list the new label CSS custom properties.

Defaults for the two label kinds are intentionally provisional; the user will tune them after this change lands. This change only establishes the classes, the CSS custom properties, and distinct default appearance so the two kinds already look different.

## Capabilities

### New Capabilities
<!-- None: this refines existing inspector behavior. -->

### Modified Capabilities

- `wb-inspector-css-vars`: Adds CSS custom properties for the two inspector label kinds (stacked field labels and inline checkbox labels) and requires them to be documented.
- `field-properties`: Removes the read-only "Field" display-name requirement for data fields, and adds a requirement that field labels above inputs and checkbox labels render with distinct, externally themeable styles.

## Impact

- `packages/form-components/src/components/wb-inspector/wb-inspector.css`: split label styling into stacked vs. checkbox rules, route both through new CSS custom properties with fallbacks.
- `packages/form-components/src/components/wb-inspector/wb-inspector.tsx`: add the `field-label--checkbox` modifier to checkbox labels (Required, Multiline, extension checkboxes), remove the data-field "Field" display block, and drop the now-unused `displayName` helper and `FieldType`/`FieldSubtype` imports.
- `packages/form-components/src/components/wb-inspector/readme.md`: document the new label CSS custom properties.
- `packages/form-components/src/components/wb-inspector/wb-inspector.unit.test.tsx`: remove the read-only "Field" display test; keep the design "Element" display tests.
- No prop, event, method, or `FieldMeta` shape changes; the React wrapper and generated types are unaffected.
- Compatibility: the "Field" display removal is a visual/UI change only and does not alter emitted patches or the field model.
