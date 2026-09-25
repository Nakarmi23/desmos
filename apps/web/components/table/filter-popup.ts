import type { Popover } from "@base-ui/react/popover";
import { CalendarIcon, HashIcon, ListIcon, TypeIcon } from "lucide-react";

/** The icon shown for each Advanced Search control, on chips and in the "+" list. */
export const FILTER_KIND_ICON = {
  text: TypeIcon,
  number: HashIcon,
  date: CalendarIcon,
  select: ListIcon,
} as const;

/** Where filter popups sit: just below their trigger, kept on-screen. */
export const FILTER_POPUP_POSITION = {
  side: "bottom",
  align: "start",
  sideOffset: 6,
  collisionPadding: 8,
  className: "z-20",
} as const;

type FinalFocus = NonNullable<Popover.Popup.Props["finalFocus"]>;
/** How a popup was closed: `"keyboard"`, `"mouse"`, `"touch"`, ... */
export type PopupCloseType = Parameters<
  Extract<FinalFocus, (...args: never[]) => unknown>
>[0];

/**
 * Closing from the keyboard (Escape) hands focus back to the trigger; a click
 * elsewhere leaves it where the click put it, so it can't steal focus from a
 * popup that click just opened.
 */
export const returnFocusOnKeyboard = (closeType: PopupCloseType) =>
  closeType === "keyboard";
