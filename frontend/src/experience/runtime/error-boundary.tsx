"use client";

/**
 * Error boundary primitives for NIDUS Experience V2.
 * They keep one failing shell, chapter, or scene from crashing the whole landing page.
 */
import { Component, type ErrorInfo, type ReactNode } from "react";
import { logExperienceError } from "./logger";

type ExperienceErrorBoundaryProps = {
  boundaryId: string;
  children: ReactNode;
  fallback?: ReactNode;
};

type ExperienceErrorBoundaryState = {
  hasError: boolean;
};

function DefaultExperienceFallback({ label }: { label: string }) {
  return (
    <section className="min-h-[40vh] bg-[#f7f3ea] px-4 py-16 text-[#071d36] sm:px-6 lg:px-8" role="status" aria-live="polite">
      <div className="mx-auto max-w-3xl rounded-2xl border border-[#071d36]/10 bg-white/80 p-6 shadow-[0_20px_70px_rgba(7,29,54,0.08)]">
        <p className="text-xs font-black uppercase tracking-[0.24em] text-[#b9913f]">Experience recovered</p>
        <p className="mt-3 text-base font-semibold leading-7 text-[#40516a]">{label} could not render, so the journey continued safely.</p>
      </div>
    </section>
  );
}

export class ExperienceErrorBoundary extends Component<ExperienceErrorBoundaryProps, ExperienceErrorBoundaryState> {
  state: ExperienceErrorBoundaryState = { hasError: false };

  static getDerivedStateFromError(): ExperienceErrorBoundaryState {
    return { hasError: true };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    logExperienceError(`boundary:${this.props.boundaryId}`, `Recovered from ${this.props.boundaryId} failure`, {
      error: error.message,
      componentStack: errorInfo.componentStack
    });
  }

  render() {
    if (this.state.hasError) {
      return this.props.fallback ?? <DefaultExperienceFallback label={this.props.boundaryId} />;
    }
    return this.props.children;
  }
}
