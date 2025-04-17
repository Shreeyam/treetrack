import React from 'react';

export default class ReloadOnErrorBoundary extends React.Component {
  state = { hasError: false };

  static getDerivedStateFromError(error) {
    return { hasError: true };
  }

  componentDidCatch(error, info) {
    console.error('Unhandled error caught by ReloadOnErrorBoundary:', error, info);

    // POST to your logging endpoint
    fetch('/api/log-error', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        message: error.message,
        stack: error.stack,
        componentStack: info.componentStack,
        url: window.location.href,
        userAgent: navigator.userAgent,
        timestamp: new Date().toISOString(),
      }),
    }).catch((err) => {
      console.error('Error reporting to /api/log-error:', err);
    });

    // Reload exactly once per session
    if (!sessionStorage.getItem('hasReloaded')) {
      sessionStorage.setItem('hasReloaded', 'true');
      window.location.reload();
    }
  }

  render() {
    if (this.state.hasError) {
      const hasReloaded = sessionStorage.getItem('hasReloaded');
      if (hasReloaded) {
        // After reload and still failing: render fallback UI
        return (
          <div style={{ padding: '2rem', textAlign: 'center' }}>
            <h1>Something went wrong.</h1>
            <p>Please try refreshing the page or contact support if the issue persists.</p>
            <button onClick={() => window.location.reload()}>Retry</button>
          </div>
        );
      }
    }

    return this.props.children;
  }
}
