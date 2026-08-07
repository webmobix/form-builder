## Why

The `wb-inspector` component hardcodes its container styling (background, border, border-radius, padding, font-size) and enforces a fixed `min-width` of `220px`. Consumers cannot theme the inspector to match their own design system, and the fixed minimum width prevents the host from controlling the component's width.

## What Changes

- Expose the inspector's container styling as CSS custom properties on `:host`, each falling back to the current hardcoded value when not set by the consumer.
- Set the inspector width to `100%` and remove the `min-width: 220px` so the width can be controlled by the host.

## Capabilities

### New Capabilities
- `wb-inspector-css-vars`: CSS custom properties for theming the `wb-inspector` container, plus width behavior controlled by the host.

### Modified Capabilities
<!-- No existing spec-level requirements change. -->

## Impact

- `packages/form-components/src/components/wb-inspector/wb-inspector.css`: replace hardcoded container values with CSS custom properties and update width/min-width.
- `packages/form-components/src/components/wb-inspector/readme.md`: document the new CSS custom properties.
- Consumers of `wb-inspector` can now theme and size the component from the host.
