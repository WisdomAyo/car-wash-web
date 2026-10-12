import {
  createElement,
  type SelectHTMLAttributes,
  type TextareaHTMLAttributes,
} from "react"

// Local semantic extensions to the project's minimal native-control primitives.
export function Select(props: SelectHTMLAttributes<HTMLSelectElement>) {
  return createElement("select", props)
}
export default function Textarea(
  props: TextareaHTMLAttributes<HTMLTextAreaElement>,
) {
  return createElement("textarea", props)
}
