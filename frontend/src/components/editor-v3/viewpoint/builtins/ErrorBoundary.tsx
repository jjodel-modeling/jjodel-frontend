/**
 * Editor V3 — ViewpointErrorBoundary: catches render errors in custom JSX views.
 *
 * Displays an inline error message instead of crashing the entire editor.
 */

import React from 'react';

interface ErrorBoundaryProps {
    viewId: string;
    children: React.ReactNode;
}

interface ErrorBoundaryState {
    hasError: boolean;
    error: Error | null;
}

export class ViewpointErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
    constructor(props: ErrorBoundaryProps) {
        super(props);
        this.state = { hasError: false, error: null };
    }

    static getDerivedStateFromError(error: Error): ErrorBoundaryState {
        return { hasError: true, error };
    }

    componentDidCatch(error: Error, errorInfo: React.ErrorInfo): void {
        console.error(`[ViewpointErrorBoundary] Error in view ${this.props.viewId}:`, error, errorInfo);
    }

    componentDidUpdate(prevProps: ErrorBoundaryProps): void {
        // Reset error state when viewId changes (user switches view)
        if (prevProps.viewId !== this.props.viewId && this.state.hasError) {
            this.setState({ hasError: false, error: null });
        }
    }

    render(): React.ReactNode {
        if (this.state.hasError) {
            return (
                <div className="viewpoint-error">
                    <i className="bi bi-exclamation-triangle" />
                    <div className="viewpoint-error__msg">
                        <strong>View Error</strong>
                        <pre>{this.state.error?.message || 'Unknown error'}</pre>
                    </div>
                </div>
            );
        }
        return this.props.children;
    }
}
