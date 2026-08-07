## 1. Update inspector CSS

- [x] 1.1 Replace hardcoded container values in `wb-inspector.css` `:host` with CSS custom properties using `var(--wb-inspector-<name>, <fallback>)` for background, border, border-radius, padding, and font-size
- [x] 1.2 Set `width: 100%` and remove `min-width: 220px` from the `:host` rule

## 2. Document CSS custom properties

- [x] 2.1 Add a CSS custom properties table (name, fallback, description) to the `wb-inspector` `readme.md`

## 3. Verify

- [x] 3.1 Confirm the inspector renders with default fallback values when no CSS vars are set
- [x] 3.2 Confirm the inspector renders at `100%` width and honors a width set on the host
