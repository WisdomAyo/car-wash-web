import Link from "next/link"
import { Icon } from "./Visuals"

export default function Brand({
  light = false,
  onClick,
}: {
  light?: boolean
  onClick?: () => void
}) {
  return (
    <Link
      href="/"
      className={`link-btn brand x-brand ${light ? "light" : ""}`}
      aria-label="Go-Wash home"
      onClick={onClick}
    >
      <span className="brand-symbol">
        <Icon name="drop" size={23} />
      </span>
      go<span className="brand-dash">-</span>wash
      <span className="brand-dot">.</span>
    </Link>
  )
}
