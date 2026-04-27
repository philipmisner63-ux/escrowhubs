"use client";
import { Component, type ReactNode } from "react";

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(): State {
    return { hasError: true };
  }

  componentDidCatch(error: Error, info: { componentStack: string }) {
    console.error("[ErrorBoundary]", error, info.componentStack);
  }

  render() {
    if (this.state.hasError) {
      return (
        <main className="flex flex-col min-h-screen px-5 py-8 max-w-md mx-auto items-center justify-center">
          <div className="text-5xl mb-4">⚠️</div>
          <h1 className="text-xl font-bold text-gray-900 mb-2 text-center">
            Something went wrong.
          </h1>
          <p className="text-gray-500 text-center mb-8">
            Please go back and try again.
          </p>
          <button
            onClick={() => {
              this.setState({ hasError: false });
              window.history.back();
            }}
            className="bg-green-600 text-white rounded-2xl px-6 py-4 font-semibold text-lg active:bg-green-700 transition-colors"
          >
            Go Back
          </button>
        </main>
      );
    }

    return this.props.children;
  }
}
