"use client";

import React, { Component, ErrorInfo, ReactNode } from "react";

interface ErrorBoundaryProps {
  children: ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
}

class MaxDepthErrorBoundary extends Component<
  ErrorBoundaryProps,
  ErrorBoundaryState
> {
  private reloadTimeout: NodeJS.Timeout | null = null;

  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(_: Error): ErrorBoundaryState {
    return { hasError: true };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    if (
      error.message?.includes("Maximum update depth exceeded") ||
      error.message?.includes("#185") ||
      error.message?.includes("#301") ||
      error.message?.includes("Minified React error")
    ) {
      console.warn(
        "App Crash | Maximum update depth exceeded error detected 🔴",
        error,
        errorInfo,
      );

      // this.reloadTimeout = setTimeout(() => {
      //   window.location.reload();
      // }, 100);
    } else {
      console.warn("Uncaught error:", error, errorInfo);
    }
  }

  componentWillUnmount() {
    if (this.reloadTimeout) {
      clearTimeout(this.reloadTimeout);
    }
  }

  render() {
    return this.props.children;
  }
}

export default MaxDepthErrorBoundary;
