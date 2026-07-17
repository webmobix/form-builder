# wb-canvas



<!-- Auto Generated Below -->


## Overview

Reorderable field list. Ported from the standalone touch-drag spike.

Key difference from that spike: rows are keyed by field id (`key={f.id}`
below), so Stencil's virtual-DOM diff reuses the same DOM node for a row
across re-renders instead of destroying/recreating it. That's what caused
the original bug (re-render killed the element mid-drag, silently ending
pointer capture) — keyed VDOM avoids it by construction, as long as the
key stays stable across the reorder.

## Events

| Event             | Description | Type                       |
| ----------------- | ----------- | -------------------------- |
| `wbChange`        |             | `CustomEvent<FieldMeta[]>` |
| `wbFieldSelected` |             | `CustomEvent<FieldMeta>`   |


## Methods

### `addField(type: FieldType, label: string) => Promise<void>`



#### Parameters

| Name    | Type                                         | Description |
| ------- | -------------------------------------------- | ----------- |
| `type`  | `"select" \| "text" \| "date" \| "checkbox"` |             |
| `label` | `string`                                     |             |

#### Returns

Type: `Promise<void>`




----------------------------------------------

*Built with [StencilJS](https://stenciljs.com/)*
