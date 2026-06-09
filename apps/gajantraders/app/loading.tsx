import { Plane } from "lucide-react";

export default function Loading() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-zinc-50">
      <div className="flex flex-col items-center gap-4">
        <div className="relative">
          <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center animate-pulse">
            <Plane className="w-6 h-6 text-primary" />
          </div>
          <div className="absolute -top-1 -right-1 w-4 h-4">
            <div className="w-4 h-4 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
          </div>
        </div>
        <p className="text-sm text-zinc-400 font-medium">Loading...</p>
      </div>
    </div>
  );
}
