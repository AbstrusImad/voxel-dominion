'use client';

import { Component, ReactNode } from 'react';
import { ErrorState } from './ErrorState';

export interface DataErrorBoundaryProps {
  children: ReactNode;
  label?: string;
}

interface State {
  hasError: boolean;
  message: string;
}

// Catches render-time failures in a single data section so the rest of the
// page (hero, foundry, static content) keeps rendering. Read failures
// themselves are handled inside the data hook.
export class DataErrorBoundary extends Component<DataErrorBoundaryProps, State> {
  constructor(props: DataErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, message: '' };
  }

  static getDerivedStateFromError(error: unknown): State {
    return { hasError: true, message: String((error as { message?: string })?.message ?? error) };
  }

  reset = () => this.setState({ hasError: false, message: '' });

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex items-center justify-center px-4 py-10">
          <ErrorState
            compact
            message={
              this.state.message || `Something failed while rendering the ${this.props.label ?? 'panel'}.`
            }
            onRetry={this.reset}
          />
        </div>
      );
    }
    return this.props.children;
  }
}
