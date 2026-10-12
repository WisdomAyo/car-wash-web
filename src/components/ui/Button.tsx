import { createElement, type ButtonHTMLAttributes, type Ref } from "react"

/** Shared native control: preserves keyboard, form and accessibility semantics. */
export default function Button(
  props: ButtonHTMLAttributes<HTMLButtonElement> & {
    ref?: Ref<HTMLButtonElement>
  },
) {
  return createElement("button", { type: "button", ...props })
}
