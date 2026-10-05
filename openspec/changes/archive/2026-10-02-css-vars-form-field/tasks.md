# Tasks

## 1. CSS Custom Properties

- [x] 1.1 In `wb-form-field.css`, update `.wb-field` `font-size` to `var(--wb-field-font-size, 14px)` and verify the default renders at 14px
- [x] 1.2 In `wb-form-field.css`, update `.wb-field__label` `font-size`, `color`, and `margin-bottom` to use `var(--wb-field-label-font-size, 12px)`, `var(--wb-field-label-color, #55554f)`, and `var(--wb-field-label-margin-bottom, 4px)` respectively
- [x] 1.3 In `wb-form-field.css`, update `.required-mark` `color` to `var(--wb-field-required-mark-color, #e53e3e)`
- [x] 1.4 In `wb-form-field.css`, update the shared `.wb-field input[type="..."]` rule so `width`, `padding`, `font-size`, `border`, and `border-radius` use `var()` with current values as fallbacks, leaving `box-sizing: border-box` unchanged

## 2. Documentation

- [x] 2.1 Update `wb-form-field/readme.md` with a CSS Custom Properties table listing each var name, its applies-to target, fallback value, and description

## 3. Verification

- [x] 3.1 Run the package's lint/build and confirm the component's styles still compile with no errors

## 4. Native Controls, State, Hint

- [x] 4.1 In `wb-form-field.css`, update `.wb-field__textarea` (`width`, `padding`, `font-size`, `border`, `border-radius` → shared `--wb-field-input-*`; `min-height` → `var(--wb-field-textarea-min-height, fit-content)`), leaving `box-sizing`, `resize`, and `field-sizing` unchanged
- [x] 4.2 In `wb-form-field.css`, update `.wb-field__select` (`width`, `padding`, `font-size`, `border`, `border-radius` → shared `--wb-field-input-*`; `background` → `var(--wb-field-select-background, #fff)`), leaving `box-sizing`, `appearance`, and `-webkit-appearance` unchanged
- [x] 4.3 In `wb-form-field.css`, update `.wb-field--checkbox__row` `gap` to `var(--wb-field-checkbox-gap, 8px)` and `.wb-field--checkbox input:disabled` `accent-color` to `var(--wb-field-checkbox-accent-color, #2f6fed)`
- [x] 4.4 In `wb-form-field.css`, update the disabled block `input`/`textarea`/`select` `background` and the disabled richtext editor `background` to `var(--wb-field-disabled-background, #fff)`, leaving `opacity`, `color`, and `cursor` unchanged
- [x] 4.5 In `wb-form-field.css`, update `.wb-field__placeholder-hint` `font-size` to `var(--wb-field-hint-font-size, 12px)`

## 5. Richtext Remaining Properties

- [x] 5.1 In `wb-form-field.css`, update `.wb-richtext__btn` `padding`/`font-size`, `.wb-richtext__btn:hover` `border-color`, and `.wb-richtext__linkbar` `gap` to use `var()` with current values as fallbacks
- [x] 5.2 In `wb-form-field.css`, update `.wb-richtext__error` `color`, `.wb-richtext__editor` `padding`/`min-height`, `.wb-richtext__editor .tiptap` `line-height`, and `.wb-richtext__editor .tiptap blockquote` `border-left`/`color` to use `var()` with current values as fallbacks

## 6. Docs + Verification (extension)

- [x] 6.1 Extend the `readme.md` CSS Custom Properties table with the native-control, state, hint, and richtext properties
- [x] 6.2 Re-run the package's build and confirm the component's styles still compile with no errors
