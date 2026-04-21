import { Component, type ReactNode } from 'react'
import { Button } from './Button'

interface Props {
  children: ReactNode
  fallback?: ReactNode
}

interface State {
  hasError: boolean
  error: Error | null
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props)
    this.state = { hasError: false, error: null }
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error }
  }

  override componentDidCatch(error: Error, info: { componentStack: string }) {
    console.error('[ErrorBoundary]', error, info.componentStack)
  }

  override render() {
    if (this.state.hasError) {
      return this.props.fallback ?? (
        <div
          className="flex flex-col items-center justify-center gap-3 rounded-xl border border-ct-danger-border bg-ct-danger-soft p-8 text-center"
        >
          <span className="text-[15px] font-semibold text-ct-danger-foreground">
            出现了一个错误
          </span>
          <span className="text-[12px] font-mono text-ct-content-muted">
            {this.state.error?.message}
          </span>
          <Button
            onClick={() => this.setState({ hasError: false, error: null })}
            variant="danger"
            size="sm"
          >
            重试
          </Button>
        </div>
      )
    }
    return this.props.children
  }
}
