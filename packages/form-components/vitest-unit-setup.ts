// Unit/spec test setup for the @stencil/vitest plugin flow.
//
// The stencil "mock-doc" DOM environment doesn't define a number of event
// IDL properties (onpointerdown, onsubmit, etc.) on `window`. Stencil's vdom
// listener registration (setAccessor) checks `isMemberInElement(win, name)`;
// when that's false it falls back to a camelCase event name ('pointerDown' /
// 'Submit') and the listener never fires. Real browsers (and jsdom) define
// these, so Stencil registers the correct lowercase event name. We stub the
// IDL props here so mock-doc behaves like a real browser for listener
// registration. We also stub PointerEvent so tests can construct real pointer
// events without depending on a full DOM implementation.
const EVENT_IDL = [
  'onpointerdown',
  'onpointermove',
  'onpointerup',
  'onpointercancel',
  'onpointerover',
  'onpointerout',
  'onpointerenter',
  'onpointerleave',
  'onsubmit',
  'onreset',
  'oninput',
  'onchange',
];
for (const name of EVENT_IDL) {
  if (!(name in window)) {
    Object.defineProperty(window, name, { value: null, writable: true, configurable: true });
  }
}
