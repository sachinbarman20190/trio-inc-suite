import Link from 'next/link';
import { Home, Compass } from 'lucide-react';

export default function NotFound() {
  return (
    <div className="min-h-screen bg-[#070a12] text-slate-100 flex flex-col items-center justify-center p-6 text-center">
      <div className="w-16 h-16 rounded-2xl bg-indigo-950/40 border border-indigo-800/60 flex items-center justify-center text-indigo-400 mb-4 shadow-xl">
        <Compass className="w-8 h-8" />
      </div>
      <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-white mb-2">
        Page Not Found
      </h1>
      <p className="text-sm text-slate-400 max-w-md mb-6 leading-relaxed">
        The requested path could not be found within the Trio INC. internal hub.
      </p>
      <Link
        href="/"
        className="cursor-pointer min-h-[44px] px-6 py-2.5 rounded-full bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-semibold flex items-center gap-2 shadow-lg shadow-indigo-950/40 transition-all hover:scale-105 active:scale-95"
      >
        <Home className="w-4 h-4" />
        <span>Return to Dashboard</span>
      </Link>
    </div>
  );
}
