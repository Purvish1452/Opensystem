import { Component } from "react";
import type { ErrorInfo, ReactNode } from "react";

interface Props {
    children?: ReactNode;
}

interface State {
    hasError: boolean;
}

class ErrorBoundary extends Component<Props, State> {
    public state: State = {
        hasError: false
    };

    public static getDerivedStateFromError(_: Error): State {
        return { hasError: true };
    }

    public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
        // We do not leak backend stack traces. Log only in dev mode.
        if (process.env.NODE_ENV !== "production") {
            console.error("Uncaught runtime error:", error, errorInfo);
        }
        // Alternatively, send to Sentry here.
    }

    public render() {
        if (this.state.hasError) {
            return (
                <div className="flex h-screen w-full items-center justify-center bg-gray-50 flex-col gap-4">
                    <h1 className="text-2xl font-bold text-gray-900">Something went wrong.</h1>
                    <p className="text-gray-500 max-w-md text-center">
                        An unexpected error occurred. Our team has been notified.
                        Please refresh the page or try again later.
                    </p>
                    <button
                        onClick={() => { window.location.reload() }}
                        className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition"
                    >
                        Reload Page
                    </button>
                </div>
            );
        }

        return this.props.children;
    }
}

export default ErrorBoundary;
