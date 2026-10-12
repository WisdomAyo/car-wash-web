import { Icon } from "./Visuals"
export default function Brand({
  light = false,
  onClick,
}: {
  light?: boolean
  onClick?: () => void
}) {
  return (
    <button
      className={`brand x-brand ${light ? "light" : ""}`}
      onClick={onClick}
      aria-label="Go-Wash home"
    >
      <span className="brand-symbol">
        <Icon name="drop" size={23} />
      </span>
      go<span className="brand-dash">-</span>wash
      <span className="brand-dot">.</span>
    </button>
  )
}
