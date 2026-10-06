# wb-inspector



## CSS Custom Properties

| Name | Fallback | Description |
| ---- | -------- | ----------- |
| `--wb-inspector-background` | `#fff` | Container background color |
| `--wb-inspector-border` | `1px solid #e4e4e0` | Container border |
| `--wb-inspector-border-radius` | `10px` | Container border radius |
| `--wb-inspector-padding` | `16px` | Container padding |
| `--wb-inspector-font-size` | `14px` | Base font size |

The inspector fills `100%` of its host's width and does not enforce a minimum width. Set a width on `<wb-inspector>` to control its size.

## Extension API

Hosts can declare extra per-element controls through an `InspectorExtension` shape. The shape maps element kinds to ordered sections, each with an optional `title` and a `fields` array of entries. The only supported entry kind today is `checkbox`:

```ts
type InspectorExtension = {
  data?: InspectorExtensionSection[]; // data elements (`kind` absent or 'data')
  design?: InspectorExtensionSection[]; // design elements (`kind === 'design'`)
};

type InspectorExtensionSection = {
  title?: string;
  fields: InspectorExtensionEntry[];
};

type InspectorExtensionEntry = {
  type: 'checkbox';
  key: string; // stored at field.metadata[key]
  label: string;
  defaultState?: boolean; // absent means false (unchecked)
};
```

Declared sections render after the built-in controls and before Delete. Values live on `FieldMeta.metadata` and are presentation-only: they do not participate in validation, the submitted value, or rendering, and they round-trip through export/import.

The `extension` shape is a complex object, so set it as a JS property or through the `setExtension()` method — not as an HTML attribute:

```js
const inspector = document.querySelector('wb-inspector');
inspector.setExtension({
  data: [{ title: 'Analytics', fields: [{ type: 'checkbox', key: 'pii', label: 'Contains PII' }] }],
  design: [{ fields: [{ type: 'checkbox', key: 'decorative', label: 'Decorative' }] }],
});
```

When an element is selected (or the shape changes while one is selected), every declared key missing from `metadata` is seeded with its `defaultState`, and the inspector emits one `wbFieldUpdated` carrying the complete map.


<!-- Auto Generated Below -->


## Properties

| Property                | Attribute                  | Description                                                                                      | Type                 | Default     |
| ----------------------- | -------------------------- | ------------------------------------------------------------------------------------------------ | -------------------- | ----------- |
| `extension`             | --                         | Host-supplied per-element-kind extension controls. Set as a JS property or via `setExtension()`. | `InspectorExtension` | `undefined` |
| `field`                 | --                         |                                                                                                  | `FieldMeta`          | `null`      |
| `showDeleteFieldButton` | `show-delete-field-button` |                                                                                                  | `boolean`            | `true`      |


## Events

| Event             | Description | Type                                                      |
| ----------------- | ----------- | --------------------------------------------------------- |
| `wbFieldUpdated`  |             | `CustomEvent<{ id: number; patch: Partial<FieldMeta>; }>` |
| `wbInspectDelete` |             | `CustomEvent<{ id: number; }>`                            |


## Methods

### `setExtension(shape?: InspectorExtension) => Promise<void>`



#### Parameters

| Name    | Type                 | Description |
| ------- | -------------------- | ----------- |
| `shape` | `InspectorExtension` |             |

#### Returns

Type: `Promise<void>`



### `setField(field: FieldMeta | null) => Promise<void>`



#### Parameters

| Name    | Type        | Description |
| ------- | ----------- | ----------- |
| `field` | `FieldMeta` |             |

#### Returns

Type: `Promise<void>`




----------------------------------------------

*Built with [StencilJS](https://stenciljs.com/)*
