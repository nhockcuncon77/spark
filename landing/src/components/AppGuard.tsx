import { useEffect, useState } from "react";
import { useLocation } from "react-router-dom";
import { getAuth } from "../lib/auth";

/**
 * Protects /app: if localStorage has no token+user, redirect to /login.
 * Otherwise render children. One read of localStorage — no async API, no persist.
 */
export function AppGuard({ children }: { children: React.ReactNode }) {
  const location = useLocation();
  const [ok, setOk] = useState<boolean | null>(null);

  useEffect(() => {
    const auth = getAuth();
    if (!auth) {
      const loginUrl = `/login?redirect=${encodeURIComponent(location.pathname + location.search)}`;
      window.location.replace(loginUrl);
      return;
    }
    setOk(true);
  }, [location.pathname, location.search]);

  if (ok === null) {
    return (
      <div className="fixed inset-0 flex items-center justify-center bg-[#0B0223]">
        <div className="text-center text-white">
          <div className="mb-4 h-10 w-10 animate-spin rounded-full border-2 border-[#7C3AED] border-t-transparent mx-auto" />
          <p className="text-lg font-medium">Loading...</p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
