import React from 'react';

export default class ReloadOnErrorBoundary extends React.Component {
  state = { hasError: false };

  // 1) Tell React an error happened so it won’t continue rendering the broken tree
  static getDerivedStateFromError(error) {
    return { hasError: true };
  }

  // 2) Log & report the error, then reload once
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
    // You could render a fallback UI here if you want—
    // but since we’re reloading, just render children.
    return this.props.children;
  }
}