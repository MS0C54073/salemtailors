import { Component, ReactNode } from 'react';
import { logger } from '@/lib/logger';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}
interface State {
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  state: State = { error: null };

  static getDerivedStateFromError(error: Error): State {
    return { error };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    logger.error('React render crash', {
      message: error.message,
      stack: error.stack,
      component: info.componentStack,
    });
  }

  private reset = () => {
    this.setState({ error: null });
    // A full reload is the safest recovery for a broken tree.
    if (typeof window !== 'undefined') window.location.reload();
  };

  render() {
    if (!this.state.error) return this.props.children;
    if (this.props.fallback) return this.props.fallback;
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-6">
        <div className="max-w-md w-full text-center space-y-4">
          <h1 className="font-serif text-2xl font-bold text-foreground">
            Something went wrong
          </h1>
          <p className="text-sm text-muted-foreground">
            We hit an unexpected error. Your data is safe. Please reload the page.
          </p>
          <pre className="text-[10px] text-left bg-muted p-3 rounded-md overflow-auto max-h-40">
            {this.state.error.message}
          </pre>
          <button
            onClick={this.reset}
            className="inline-flex items-center justify-center rounded-md bg-primary text-primary-foreground h-10 px-6 text-sm font-medium hover:opacity-90 transition-opacity"
          >
            Reload app
          </button>
        </div>
      </div>
    );
  }
}
