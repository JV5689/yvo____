import React from 'react';

class ErrorBoundary extends React.Component {
    constructor(props) {
        super(props);
        this.state = { hasError: false, error: null, errorInfo: null };
    }

    static getDerivedStateFromError() {
        return { hasError: true };
    }

    componentDidCatch(error, errorInfo) {
        console.error("Uncaught error:", error, errorInfo);
        this.setState({ error, errorInfo });
    }

    render() {
        if (this.state.hasError) {
            return (
                <div className="p-10 bg-red-50 text-red-900 border border-red-200 rounded-lg m-4 overflow-auto">
                    <h1 className="text-2xl font-bold mb-4">Something went wrong.</h1>
                    <p className="font-semibold mb-2">Error:</p>
                    <pre className="bg-red-100 p-4 rounded text-sm mb-4">{this.state.error && this.state.error.toString()}</pre>
                    <p className="font-semibold mb-2">Component Stack:</p>
                    <pre className="bg-red-100 p-4 rounded text-xs whitespace-pre-wrap">{this.state.errorInfo && this.state.errorInfo.componentStack}</pre>
                </div>
            );
        }

        return this.props.children;
    }
}

export default ErrorBoundary;
