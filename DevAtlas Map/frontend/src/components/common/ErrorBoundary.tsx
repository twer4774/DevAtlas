import { Component, type ReactNode } from 'react'
import { AlertTriangle, RefreshCw } from 'lucide-react'

interface Props {
  children: ReactNode
}

interface State {
  hasError: boolean
  message: string
}

export class ErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false, message: '' }

  static getDerivedStateFromError(error: unknown): State {
    const message = error instanceof Error ? error.message : '알 수 없는 오류가 발생했습니다'
    return { hasError: true, message }
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="h-screen flex flex-col items-center justify-center gap-4 bg-gray-950 text-white">
          <AlertTriangle size={36} className="text-red-400" strokeWidth={1.5} />
          <div className="text-center">
            <p className="text-sm font-medium text-red-300">렌더링 오류가 발생했습니다</p>
            <p className="text-xs text-gray-500 mt-1 max-w-xs">{this.state.message}</p>
          </div>
          <button
            onClick={() => this.setState({ hasError: false, message: '' })}
            className="flex items-center gap-2 text-xs text-gray-400 hover:text-white px-3 py-1.5 rounded-lg border border-gray-700 hover:border-gray-500 transition-colors"
          >
            <RefreshCw size={12} />
            다시 시도
          </button>
        </div>
      )
    }
    return this.props.children
  }
}
