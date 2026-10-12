import { createElement, type InputHTMLAttributes, type Ref } from "react"

export default function Input(
  props: InputHTMLAttributes<HTMLInputElement> & {
    ref?: Ref<HTMLInputElement>
  },
) {
  return createElement("input", props)
}
