import { motion } from "framer-motion";
import { Navbar } from "../layout/Navbar";
import { Footer } from "../layout/Footer";
import { Link } from "react-router-dom";
import { Globe, UserPlus, ShieldCheck } from "lucide-react";

// When user clicks "Open in browser", send them to login (then they get to /app after auth)
const SPARK_LOGIN_URL = "/login";
// Web app URL after login: set VITE_SPARK_APP_URL in .env or use /app if Expo web is served at /app
const SPARK_WEB_APP_URL = import.meta.env.VITE_SPARK_APP_URL || "/app/";

export const Join = () => {
  return (
    <div className="min-h-screen bg-bg-primary text-text-primary selection:bg-brand-purple selection:text-white">
      <Navbar />
      <main className="container max-w-3xl mx-auto px-4 py-16 md:py-24">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="text-center"
        >
          <h1 className="text-4xl md:text-6xl font-bold mb-4">
            Join Spark<span className="text-brand-purple">.</span>
          </h1>
          <p className="text-text-secondary text-lg md:text-xl mb-14 max-w-xl mx-auto">
            Use Spark in your browser. Create your account, complete verification, and start meeting people for who they are.
          </p>

          {/* Steps - Web first */}
          <div className="grid gap-8 md:grid-cols-3 text-left mb-16">
            <motion.div
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="rounded-2xl border border-border-medium bg-bg-surface/50 p-6"
            >
              <div className="w-12 h-12 rounded-xl bg-brand-purple/20 flex items-center justify-center mb-4">
                <Globe className="w-6 h-6 text-brand-purple-light" />
              </div>
              <h2 className="text-lg font-semibold text-white mb-2">1. Open Spark on web</h2>
              <p className="text-text-secondary text-sm">
                Use Spark in your browser — no download required. Works on desktop and mobile.
              </p>
            </motion.div>
            <motion.div
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="rounded-2xl border border-border-medium bg-bg-surface/50 p-6"
            >
              <div className="w-12 h-12 rounded-xl bg-brand-purple/20 flex items-center justify-center mb-4">
                <UserPlus className="w-6 h-6 text-brand-purple-light" />
              </div>
              <h2 className="text-lg font-semibold text-white mb-2">2. Create your account</h2>
              <p className="text-text-secondary text-sm">
                Sign up with email or phone. Add your interests and a short bio.
              </p>
            </motion.div>
            <motion.div
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="rounded-2xl border border-border-medium bg-bg-surface/50 p-6"
            >
              <div className="w-12 h-12 rounded-xl bg-brand-purple/20 flex items-center justify-center mb-4">
                <ShieldCheck className="w-6 h-6 text-brand-purple-light" />
              </div>
              <h2 className="text-lg font-semibold text-white mb-2">3. Verify & start matching</h2>
              <p className="text-text-secondary text-sm">
                Complete ID verification for safety, then browse profiles and chat before photos unlock.
              </p>
            </motion.div>
          </div>

          {/* Primary CTA: Open in browser → login/register */}
          <div className="mb-10">
            <a
              href={SPARK_LOGIN_URL}
              className="inline-flex items-center justify-center gap-3 px-10 py-5 bg-white text-bg-primary font-bold rounded-full text-xl hover:shadow-[0_0_50px_rgba(124,58,237,0.4)] hover:scale-105 transition-all"
            >
              <Globe size={24} />
              Open Spark in your browser
            </a>
          </div>

          <p className="text-text-muted text-sm mb-2">
            Mobile apps (App Store & Google Play) are coming later.
          </p>

          <p className="text-text-muted text-sm mb-8">
            By joining, you agree to our{" "}
            <Link to="/docs/terms" className="text-brand-purple-light hover:underline">Terms</Link>
            {" "}and{" "}
            <Link to="/docs/privacy" className="text-brand-purple-light hover:underline">Privacy Policy</Link>.
          </p>

          <Link
            to="/"
            className="text-text-secondary hover:text-white text-sm transition-colors"
          >
            ← Back to home
          </Link>
        </motion.div>
      </main>
      <Footer />
    </div>
  );
};
