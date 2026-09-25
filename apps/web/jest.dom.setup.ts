import "@testing-library/jest-dom";
import { configure } from "@testing-library/react";

// Popups position themselves (Base UI / floating-ui) on every open, which is
// slow in jsdom next to a full page of rows; on a loaded machine the 1s
// default for findBy/waitFor was flaky.
configure({ asyncUtilTimeout: 3000 });

// Base UI's popup positioning (floating-ui) asks `el.matches(":modal")` and
// `":popover-open"` to spot top-layer elements. jsdom's selector engine
// resolves `:modal` through a recursive fullscreen check that takes seconds
// per call on a real tree. Nothing is ever in the top layer in jsdom, so
// answer those two directly.
const TOP_LAYER = new Set([":modal", ":popover-open"]);
const nativeMatches = Element.prototype.matches;
Element.prototype.matches = function matches(selector: string) {
  return TOP_LAYER.has(selector) ? false : nativeMatches.call(this, selector);
};


// jsdom has no PointerEvent; Base UI constructs one to activate a menu item
// from the keyboard (Enter/Space). A MouseEvent subclass with the pointer
// fields is enough.
if (typeof window.PointerEvent === "undefined") {
  class PointerEvent extends MouseEvent {
    readonly pointerId: number;
    readonly pointerType: string;
    constructor(type: string, init: PointerEventInit = {}) {
      super(type, init);
      this.pointerId = init.pointerId ?? 0;
      this.pointerType = init.pointerType ?? "";
    }
  }
  window.PointerEvent = PointerEvent as typeof window.PointerEvent;
}
