'use client';

import { useEffect } from 'react';
import { AlertCircle, RefreshCw } from 'lucide-react';

export default function ErrorBoundary({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('App Router encountered an error:', error);
  }, [error]);

  return (
    <div className="min-h-screen bg-[#070a12] text-slate-100 flex flex-col items-center justify-center p-6 text-center">
      <div className="w-16 h-16 rounded-2xl bg-red-950/40 border border-red-800/60 flex items-center justify-center text-red-400 mb-4 shadow-xl">
        <AlertCircle className="w-8 h-8" />
      </div>
      <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-white mb-2">
        Something went wrong
      </h1>
      <p className="text-sm text-slate-400 max-w-md mb-6 leading-relaxed">
        {error.message || 'An unexpected error occurred while loading this view.'}
      </p>
      <button
        onClick={() => reset()}
        className="cursor-pointer min-h-[44px] px-6 py-2.5 rounded-full bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-semibold flex items-center gap-2 shadow-lg shadow-indigo-950/40 transition-all hover:scale-105 active:scale-95"
      >
        <RefreshCw className="w-4 h-4" />
        <span>Try Again</span>
      </button>
    </div>
  );
}
