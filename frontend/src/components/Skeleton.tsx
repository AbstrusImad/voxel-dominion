'use client';

import { useEffect, useState } from 'react';

export interface SkeletonProps {
  className?: string;
}

export function Skeleton({ className }: SkeletonProps) {
  return <div className={`skeleton rounded ${className ?? ''}`} aria-hidden />;
}

export interface LoadingNoticeProps {
  label?: string;
}

// Shows a "still loading" hint after 5 seconds for slow networks.
export function LoadingNotice({ label }: LoadingNoticeProps) {
  const [slow, setSlow] = useState(false);
  useEffect(() => {
    const id = window.setTimeout(() => setSlow(true), 5000);
    return () => window.clearTimeout(id);
  }, []);
  return (
    <p className="text-center text-xs text-muted" role="status">
      {label ?? 'Surveying the world'}
      {slow && (
        <span className="block pt-1 text-faint">Still loading, the network may be slow.</span>
      )}
    </p>
  );
}
