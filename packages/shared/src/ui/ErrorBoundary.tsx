import { Component, type ReactNode } from 'react'

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
          className="flex flex-col items-center justify-center gap-3 p-8 rounded-xl border text-center"
          style={{ backgroundColor: 'var(--error-light)', borderColor: 'var(--error-border)' }}
        >
          <span className="text-[15px] font-semibold" style={{ color: 'var(--error-text)' }}>
            出现了一个错误
          </span>
          <span className="text-[12px] font-mono" style={{ color: 'var(--text-muted)' }}>
            {this.state.error?.message}
          </span>
          <button
            onClick={() => this.setState({ hasError: false, error: null })}
            className="px-4 py-1.5 rounded-lg border text-[12px] cursor-pointer transition-colors"
            style={{ borderColor: 'var(--error-border)', color: 'var(--error-text)' }}
          >
            重试
          </button>
        </div>
      )
    }
    return this.props.children
  }
}
