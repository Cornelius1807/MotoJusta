"use client";

import React from "react";

interface Props {
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

interface State {
  hasError: boolean;
}

/**
 * Catches Clerk context errors when ClerkProvider is not available
 * (e.g. placeholder API keys). Renders children normally when Clerk is configured.
 */
export class ClerkErrorBoundary extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): State | null {
    if (error.message?.includes("ClerkProvider")) {
      return { hasError: true };
    }
    // Re-throw non-Clerk errors
    return null;
  }

  componentDidCatch(error: Error) {
    if (!error.message?.includes("ClerkProvider")) {
      throw error;
    }
    // Silently swallow Clerk context errors in demo mode
    console.warn("[MotoJusta] Clerk not configured — running in demo mode");
  }

  render() {
    if (this.state.hasError) {
      return this.props.fallback ?? this.props.children;
    }
    return this.props.children;
  }
}
