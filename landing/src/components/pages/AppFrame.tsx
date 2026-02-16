/**
 * Full-screen iframe that loads the Expo web app (static build in /app).
 * Rendered by the React (ReactJS) landing app so /app always shows something.
 */
import { useState } from "react";

export function AppFrame() {
  const [loaded, setLoaded] = useState(false);

  return (
    <div className="fixed inset-0 flex flex-col bg-[#0B0223]">
      {!loaded && (
        <div className="absolute inset-0 z-10 flex items-center justify-center text-white">
          <div className="text-center">
            <div className="mb-4 h-10 w-10 animate-spin rounded-full border-2 border-[#7C3AED] border-t-transparent mx-auto" />
            <p className="text-lg font-medium">Loading Spark...</p>
            <p className="mt-2 text-sm text-white/70">If this doesn’t load, open DevTools (F12) and check the Console.</p>
          </div>
        </div>
      )}
      <iframe
        title="Spark App"
        src="/app/index.html"
        className="flex-1 w-full border-0 min-h-0"
        onLoad={() => setLoaded(true)}
      />
    </div>
  );
}
