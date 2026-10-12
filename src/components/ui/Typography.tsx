import { createElement, type HTMLAttributes } from "react"

type HeadingProps = HTMLAttributes<HTMLHeadingElement> & {
  level?: 1 | 2 | 3 | 4
}
export default function Heading({ level = 2, ...props }: HeadingProps) {
  return createElement(`h${level}`, props)
}
