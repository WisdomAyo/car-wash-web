import { Component, type ReactNode } from "react"
import Button from "./ui/Button"
import Heading from "./ui/Typography"
import { Icon } from "./Visuals"

type Props = {
  children: ReactNode
}
type State = {
  failed: boolean
}

/** A fresh document also clears rejected browser module and React.lazy caches. */
export default class PageErrorBoundary extends Component<Props, State> {
  state: State = { failed: false }

  static getDerivedStateFromError(): State {
    return { failed: true }
  }

  render() {
    if (!this.state.failed) return this.props.children

    return (
      <div className="workspace-loading" role="alert">
        <Icon name="help" size={35} />
        <Heading>This page couldn't load.</Heading>
        <p>
          The connection may have changed, or a new version may be available.
          Reload to get the latest page.
        </p>
        <Button className="primary" onClick={() => window.location.reload()}>
          Reload page <Icon name="arrow" size={18} />
        </Button>
      </div>
    )
  }
}
