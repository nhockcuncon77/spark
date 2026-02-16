/**
 * App shell after login: header with user + logout, then full-screen Expo app iframe.
 * So you always see something (header) even if the iframe is still loading or black.
 */
import { useState } from "react";
import { getAuth, clearAuth } from "../lib/auth";

function AppHeader() {
  const auth = getAuth();
  if (!auth) return null;

  const handleLogout = () => {
    clearAuth();
    window.location.replace("/login");
  };

  return (
    <header className="flex items-center justify-between px-4 py-3 bg-[#1D0F45] border-b border-white/10 shrink-0">
      <span className="text-lg font-semibold text-white">Spark</span>
      <div className="flex items-center gap-4">
        <span className="text-sm text-white/80 truncate max-w-[180px]" title={auth.user.email}>
          {auth.user.firstName || auth.user.email}
        </span>
        <button
          type="button"
          onClick={handleLogout}
          className="text-sm text-[#A78BFA] hover:text-white transition-colors"
        >
          Log out
        </button>
      </div>
    </header>
  );
}

export function AppShell() {
  const [iframeLoaded, setIframeLoaded] = useState(false);

  return (
    <div className="fixed inset-0 flex flex-col bg-[#0B0223]">
      <AppHeader />
      <div className="flex-1 flex flex-col min-h-0 relative">
        {!iframeLoaded && (
          <div className="absolute inset-0 z-10 flex items-center justify-center bg-[#0B0223]">
            <div className="text-center text-white">
              <div className="mb-4 h-10 w-10 animate-spin rounded-full border-2 border-[#7C3AED] border-t-transparent mx-auto" />
              <p className="text-lg font-medium">Loading Spark app...</p>
              <p className="mt-2 text-sm text-white/60">Discover, Maytri, Community, Chat, Profile</p>
            </div>
          </div>
        )}
        <iframe
          title="Spark App"
          src="/app/index.html"
          className="flex-1 w-full border-0 min-h-0"
          onLoad={() => setIframeLoaded(true)}
        />
      </div>
    </div>
  );
}
