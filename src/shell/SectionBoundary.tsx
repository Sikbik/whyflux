import { Component, type ErrorInfo, type ReactNode } from 'react';

interface Props {
  /** Chapter id, for the log and the fallback anchor. */
  id: string;
  children: ReactNode;
}

interface State {
  error: Error | null;
}

/**
 * Keeps one broken chapter from blanking the whole page. A chapter that throws renders a quiet
 * placeholder with its anchor intact, so the nav and the rest of the story keep working.
 */
export class SectionBoundary extends Component<Props, State> {
  override state: State = { error: null };

  static getDerivedStateFromError(error: Error): State {
    return { error };
  }

  override componentDidCatch(error: Error, info: ErrorInfo) {
    console.error(`[section:${this.props.id}]`, error, info.componentStack);
    // Dev only: a chapter that failed mid-edit (often a module that no longer links) can't recover
    // through HMR, because the browser caches the failed module. Reload on the next update instead.
    if (import.meta.hot) import.meta.hot.on('vite:afterUpdate', () => window.location.reload());
  }

  override render() {
    if (!this.state.error) return this.props.children;
    return (
      <section id={this.props.id} aria-label="Section unavailable" style={{ minHeight: '40vh' }}>
        {import.meta.env.DEV ? (
          <pre style={{ color: '#ff5470', padding: '2rem', whiteSpace: 'pre-wrap', fontSize: 12 }}>
            {`[${this.props.id}] ${this.state.error.message}`}
          </pre>
        ) : null}
      </section>
    );
  }
}
