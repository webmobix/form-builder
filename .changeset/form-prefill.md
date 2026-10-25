---
"@webmobix/form-components": minor
"@webmobix/form-components-react": minor
---

Add form prefill. `wb-form-renderer` gains a `values` prop and `setValues()` method keyed by submission name (`field.<id>`) — the exact shape `wbSubmit` emits — so a saved payload can be passed back verbatim. Values are forwarded to a new `wb-form-field` `initialValue` prop that seeds text, textarea, number, date, select, checkbox, and rich text controls. Unknown keys are ignored with a warning, and unchanged prefill never overwrites user edits.
