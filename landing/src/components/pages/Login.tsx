import { useState } from "react";
import { Link } from "react-router-dom";
import { Navbar } from "../layout/Navbar";
import { Footer } from "../layout/Footer";
import { loginWithPassword, persistAuth, getAppUrl } from "../../lib/auth-api";
import { Mail, Lock, Eye, EyeOff } from "lucide-react";

export const Login = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (!email.trim() || !password) {
      setError("Please enter email and password.");
      return;
    }
    setLoading(true);
    try {
      const result = await loginWithPassword(email.trim(), password);
      if (result.success && result.payload) {
        persistAuth(result.payload);
        window.location.href = getAppUrl();
        return;
      }
      setError(result.error || "Invalid email or password.");
    } catch (err) {
      setError("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-bg-primary text-text-primary selection:bg-brand-purple selection:text-white">
      <Navbar />
      <main className="container max-w-md mx-auto px-4 py-16 md:py-24">
        <div className="text-center mb-10">
          <h1 className="text-4xl md:text-5xl font-bold mb-2">
            Welcome back<span className="text-brand-purple">.</span>
          </h1>
          <p className="text-text-secondary">Sign in to continue to Spark</p>
        </div>

        <div className="bg-bg-surface/80 rounded-2xl p-8 border border-border-medium">
          <form onSubmit={handleSubmit} className="space-y-5">
            {error && (
              <div className="rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 text-sm p-3">
                {error}
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-text-secondary mb-2">Email</label>
              <div className="flex items-center gap-3 rounded-xl bg-white/5 border border-border-subtle focus-within:border-brand-purple px-4 py-3">
                <Mail className="w-5 h-5 text-text-muted shrink-0" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  className="flex-1 bg-transparent text-white placeholder:text-text-muted outline-none"
                  autoComplete="email"
                  disabled={loading}
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-text-secondary mb-2">Password</label>
              <div className="flex items-center gap-3 rounded-xl bg-white/5 border border-border-subtle focus-within:border-brand-purple px-4 py-3">
                <Lock className="w-5 h-5 text-text-muted shrink-0" />
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="flex-1 bg-transparent text-white placeholder:text-text-muted outline-none"
                  autoComplete="current-password"
                  disabled={loading}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="p-1 text-text-muted hover:text-white"
                  aria-label={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-4 rounded-xl font-semibold text-white bg-brand-purple hover:bg-brand-purple-light focus:ring-2 focus:ring-brand-purple focus:ring-offset-2 focus:ring-offset-bg-primary disabled:opacity-60 disabled:cursor-not-allowed transition-colors"
            >
              {loading ? "Signing in…" : "Sign in"}
            </button>
          </form>

          <p className="mt-6 text-center text-text-muted text-sm">
            Don&apos;t have an account?{" "}
            <Link to="/register" className="text-brand-purple-light hover:underline font-medium">
              Sign up
            </Link>
          </p>
        </div>

        <p className="mt-8 text-center">
          <Link to="/join" className="text-text-secondary hover:text-white text-sm">
            ← Back to Join Spark
          </Link>
        </p>
      </main>
      <Footer />
    </div>
  );
};
