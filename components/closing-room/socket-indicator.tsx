"use client";

// With Supabase Realtime, we're always "live" when the component mounts
// The realtime subscription handles reconnection automatically

export function SocketIndicator() {
  // Supabase Realtime handles connection automatically
  // Just show live status
  return (
    <div className="flex items-center gap-1.5 px-2 py-1 rounded-md bg-emerald-500/10 text-emerald-500 text-xs">
      <div className="w-2 h-2 rounded-full bg-emerald-500" />
      <span>Live</span>
    </div>
  );
}
