# wb-palette



<!-- Auto Generated Below -->


## Overview

Tap-to-add palette. This is the interaction validated in the mobile
FAB-and-sheet spike (tap a type, it's appended to the canvas) — it works
identically here whether triggered by a real FAB/sheet shell on mobile or
a plain click on desktop.

Desktop drag-from-palette straight onto the canvas (the cross-shadow-
boundary drag validated in the first spike) is intentionally not wired up
yet — worth adding once the tap-to-add path is confirmed against real
form-core schema output, since it's an enhancement layered on the same
wbAddField event rather than a different data path.

## Events

| Event        | Description | Type                        |
| ------------ | ----------- | --------------------------- |
| `wbAddField` |             | `CustomEvent<FieldTypeDef>` |


----------------------------------------------

*Built with [StencilJS](https://stenciljs.com/)*
