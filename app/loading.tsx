export default function Loading() {
  return (
    <div className="min-h-screen bg-[#070a12] flex flex-col items-center justify-center p-6">
      <div className="w-10 h-10 border-3 border-indigo-500 border-t-transparent rounded-full animate-spin mb-4" />
      <p className="text-xs uppercase tracking-widest text-slate-400 font-semibold">
        Loading Trio Hub...
      </p>
    </div>
  );
}
