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


<!-- Auto Generated Below -->


## Properties

| Property | Attribute | Description | Type        | Default |
| -------- | --------- | ----------- | ----------- | ------- |
| `field`  | --        |             | `FieldMeta` | `null`  |


## Events

| Event            | Description | Type                                                      |
| ---------------- | ----------- | --------------------------------------------------------- |
| `wbFieldUpdated` |             | `CustomEvent<{ id: number; patch: Partial<FieldMeta>; }>` |


## Methods

### `setField(field: FieldMeta | null) => Promise<void>`



#### Parameters

| Name    | Type        | Description |
| ------- | ----------- | ----------- |
| `field` | `FieldMeta` |             |

#### Returns

Type: `Promise<void>`




----------------------------------------------

*Built with [StencilJS](https://stenciljs.com/)*
