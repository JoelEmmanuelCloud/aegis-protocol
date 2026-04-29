import { Component, type ReactNode } from 'react';

interface Props {
  children: ReactNode;
}

interface State {
  error: Error | null;
}

export default class ErrorBoundary extends Component<Props, State> {
  state: State = { error: null };

  static getDerivedStateFromError(error: Error): State {
    return { error };
  }

  render() {
    if (this.state.error) {
      return (
        <div className="flex flex-col items-center justify-center h-full gap-2 p-8 text-aegis-red">
          <div className="text-lg font-semibold">Something went wrong</div>
          <div className="text-aegis-muted text-sm">{this.state.error.message}</div>
        </div>
      );
    }
    return this.props.children;
  }
}
