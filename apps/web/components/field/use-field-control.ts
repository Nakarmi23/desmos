import { useRef, useState, type Ref } from "react";

/**
 * The value and element plumbing every field control shares: works controlled
 * (`value`) or uncontrolled (`defaultValue`), and keeps its own handle on the
 * element (`localRef`) while still forwarding the caller's `ref`.
 */
export function useFieldControl<E extends HTMLElement>({
  ref,
  value,
  defaultValue,
}: {
  ref: Ref<E> | undefined;
  value: string | undefined;
  defaultValue: string;
}) {
  const localRef = useRef<E | null>(null);
  const [inner, setInner] = useState(defaultValue);
  const controlled = value !== undefined;

  function setRefs(node: E | null) {
    localRef.current = node;
    assignRef(ref, node);
  }

  return {
    localRef,
    setRefs,
    current: controlled ? value : inner,
    /** Takes a new value; a no-op for controlled use, where the caller owns it. */
    setValue: (next: string) => {
      if (!controlled) setInner(next);
    },
  };
}

function assignRef<E>(ref: Ref<E> | undefined, node: E | null) {
  if (typeof ref === "function") ref(node);
  else if (ref) ref.current = node;
}
