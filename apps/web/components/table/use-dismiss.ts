import {
  useEffect,
  useRef,
  type FocusEvent,
  type KeyboardEvent,
  type RefObject,
} from "react";

/**
 * Closes a popup on an outside click, on Escape, or when keyboard focus moves
 * out of it. `rootRef` is the element wrapping both trigger and popup; spread
 * the returned props onto that same element. Escape hands focus back to
 * `returnFocusRef` (usually the trigger).
 */
export function useDismiss(
  rootRef: RefObject<HTMLElement | null>,
  open: boolean,
  onClose: () => void,
  returnFocusRef?: RefObject<HTMLElement | null>,
) {
  const onCloseRef = useRef(onClose);

  useEffect(() => {
    onCloseRef.current = onClose;
  });

  useEffect(() => {
    if (!open) return;
    function closeOnOutsideClick(event: MouseEvent) {
      if (!rootRef.current?.contains(event.target as Node)) {
        onCloseRef.current();
      }
    }
    document.addEventListener("mousedown", closeOnOutsideClick);
    return () => document.removeEventListener("mousedown", closeOnOutsideClick);
  }, [open, rootRef]);

  function onKeyDown(event: KeyboardEvent) {
    if (event.key !== "Escape" || !open) return;
    event.stopPropagation();
    onCloseRef.current();
    returnFocusRef?.current?.focus();
  }

  // Only a focus move *to another element* counts: clicking inert popup
  // padding blurs to nothing, and outside clicks are handled above.
  function onBlur(event: FocusEvent) {
    const next = event.relatedTarget;
    if (open && next instanceof Node && !rootRef.current?.contains(next)) {
      onCloseRef.current();
    }
  }

  return { onKeyDown, onBlur };
}
