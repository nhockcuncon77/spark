import { useState } from "react";
import { Link } from "react-router-dom";
import { Navbar } from "../layout/Navbar";
import { Footer } from "../layout/Footer";
import { register, persistAuth, getAppUrl } from "../../lib/auth-api";
import { Mail, Lock, User, Calendar } from "lucide-react";

const GENDERS = ["MALE", "FEMALE", "NON_BINARY", "OTHER"];

export const Register = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [dob, setDob] = useState("");
  const [gender, setGender] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (!email.trim() || !password || !firstName.trim() || !lastName.trim() || !dob || !gender) {
      setError("Please fill in all fields.");
      return;
    }
    if (password.length < 8) {
      setError("Password must be at least 8 characters.");
      return;
    }
    const date = new Date(dob);
    if (isNaN(date.getTime())) {
      setError("Please enter a valid date of birth.");
      return;
    }
    setLoading(true);
    try {
      const result = await register({
        email: email.trim(),
        password,
        first_name: firstName.trim(),
        last_name: lastName.trim(),
        dob: date.toISOString(),
        gender,
      });
      if (result.success && result.payload) {
        persistAuth(result.payload);
        window.location.href = getAppUrl();
        return;
      }
      setError(result.error || "Registration failed.");
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
            Create account<span className="text-brand-purple">.</span>
          </h1>
          <p className="text-text-secondary">Join Spark and meet people for who they are</p>
        </div>

        <div className="bg-bg-surface/80 rounded-2xl p-8 border border-border-medium">
          <form onSubmit={handleSubmit} className="space-y-5">
            {error && (
              <div className="rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 text-sm p-3">
                {error}
              </div>
            )}

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-text-secondary mb-2">First name</label>
                <div className="flex items-center gap-3 rounded-xl bg-white/5 border border-border-subtle focus-within:border-brand-purple px-4 py-3">
                  <User className="w-5 h-5 text-text-muted shrink-0" />
                  <input
                    type="text"
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                    placeholder="First"
                    className="flex-1 bg-transparent text-white placeholder:text-text-muted outline-none min-w-0"
                    autoComplete="given-name"
                    disabled={loading}
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-text-secondary mb-2">Last name</label>
                <div className="flex items-center gap-3 rounded-xl bg-white/5 border border-border-subtle focus-within:border-brand-purple px-4 py-3">
                  <User className="w-5 h-5 text-text-muted shrink-0" />
                  <input
                    type="text"
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                    placeholder="Last"
                    className="flex-1 bg-transparent text-white placeholder:text-text-muted outline-none min-w-0"
                    autoComplete="family-name"
                    disabled={loading}
                  />
                </div>
              </div>
            </div>

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
              <label className="block text-sm font-medium text-text-secondary mb-2">Password (min 8 characters)</label>
              <div className="flex items-center gap-3 rounded-xl bg-white/5 border border-border-subtle focus-within:border-brand-purple px-4 py-3">
                <Lock className="w-5 h-5 text-text-muted shrink-0" />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="flex-1 bg-transparent text-white placeholder:text-text-muted outline-none"
                  autoComplete="new-password"
                  disabled={loading}
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-text-secondary mb-2">Date of birth</label>
              <div className="flex items-center gap-3 rounded-xl bg-white/5 border border-border-subtle focus-within:border-brand-purple px-4 py-3">
                <Calendar className="w-5 h-5 text-text-muted shrink-0" />
                <input
                  type="date"
                  value={dob}
                  onChange={(e) => setDob(e.target.value)}
                  className="flex-1 bg-transparent text-white outline-none"
                  disabled={loading}
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-text-secondary mb-2">Gender</label>
              <select
                value={gender}
                onChange={(e) => setGender(e.target.value)}
                className="w-full rounded-xl bg-white/5 border border-border-subtle focus:border-brand-purple px-4 py-3 text-white outline-none"
                disabled={loading}
              >
                <option value="">Select</option>
                {GENDERS.map((g) => (
                  <option key={g} value={g}>
                    {g.replace("_", " ")}
                  </option>
                ))}
              </select>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-4 rounded-xl font-semibold text-white bg-brand-purple hover:bg-brand-purple-light focus:ring-2 focus:ring-brand-purple focus:ring-offset-2 focus:ring-offset-bg-primary disabled:opacity-60 disabled:cursor-not-allowed transition-colors"
            >
              {loading ? "Creating account…" : "Create account"}
            </button>
          </form>

          <p className="mt-6 text-center text-text-muted text-sm">
            Already have an account?{" "}
            <Link to="/login" className="text-brand-purple-light hover:underline font-medium">
              Sign in
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
