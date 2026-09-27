import { Component, type ReactNode } from 'react'

interface ErrorBoundaryProps {
  fallback?: ReactNode
  onError?: (error: Error) => void
  children: ReactNode
}

/** Renders `fallback` instead of children that throw, so one bad asset can't take down the scene. */
export class ErrorBoundary extends Component<ErrorBoundaryProps, { failed: boolean }> {
  state = { failed: false }

  static getDerivedStateFromError() {
    return { failed: true }
  }

  componentDidCatch(error: Error) {
    console.error(error)
    this.props.onError?.(error)
  }

  render() {
    return this.state.failed ? (this.props.fallback ?? null) : this.props.children
  }
}
