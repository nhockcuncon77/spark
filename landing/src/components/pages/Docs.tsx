import { Navbar } from "../layout/Navbar";
import { Footer } from "../layout/Footer";
import { Link } from "react-router-dom";

export const Docs = () => {
  return (
    <div className="min-h-screen bg-bg-primary text-text-primary selection:bg-brand-purple selection:text-white">
      <Navbar />
      <main className="container max-w-4xl mx-auto px-4 py-16">
        <h1 className="text-4xl font-bold mb-2">
          Spark<span className="text-brand-purple">.</span> Documentation
        </h1>
        <p className="text-text-secondary text-lg mb-12">
          Meet the person first. Looks later.
        </p>

        <section className="mb-12">
          <h2 className="text-2xl font-semibold mb-4 text-white">
            What is Spark?
          </h2>
          <p className="text-text-secondary leading-relaxed mb-4">
            Spark is a personality-first dating app. Profiles show hobbies,
            personality traits, values, and short bios. Photos stay hidden until
            both people have connected and choose to reveal them.
          </p>
          <p className="text-text-secondary leading-relaxed">
            This design puts connection before appearance and encourages real
            conversation.
          </p>
        </section>

        <section className="mb-12">
          <h2 className="text-2xl font-semibold mb-4 text-white">
            How it works
          </h2>
          <ol className="list-decimal list-inside space-y-3 text-text-secondary">
            <li>
              <strong className="text-text-primary">Onboarding</strong> — Verify
              identity, choose hobbies, answer personality questions, write a
              bio (optional AI help), upload photos (hidden by default).
            </li>
            <li>
              <strong className="text-text-primary">Discovery</strong> — Browse
              profiles without photos; no swiping, intentional browsing.
            </li>
            <li>
              <strong className="text-text-primary">Match & chat</strong> —
              Mutual interest opens a chat; optional AI reply suggestions.
            </li>
            <li>
              <strong className="text-text-primary">Reveal</strong> — After
              meaningful conversation, either can request a photo reveal; both
              must accept.
            </li>
            <li>
              <strong className="text-text-primary">Rating</strong> — Private
              rating after reveal; ratings improve future recommendations
              (never public).
            </li>
          </ol>
        </section>

        <section className="mb-12">
          <h2 className="text-2xl font-semibold mb-4 text-white">
            Getting started
          </h2>
          <p className="text-text-secondary mb-4">
            Download the Spark app, create an account, and complete onboarding.
            You’ll need a valid ID for verification. Then browse profiles and
            start conversations — photos unlock only when you both agree.
          </p>
          <p className="text-text-secondary">
            For developers: the project is a monorepo with a Go backend (
            <code className="bg-bg-surface px-1 rounded">services/</code>), React
            Native app (<code className="bg-bg-surface px-1 rounded">expo/</code>
            ), and this landing site (
            <code className="bg-bg-surface px-1 rounded">landing/</code>). See the
            repo README for setup and deployment.
          </p>
        </section>

        <section className="mb-12">
          <h2 className="text-2xl font-semibold mb-4 text-white">Legal</h2>
          <ul className="space-y-2">
            <li>
              <Link
                to="/docs/privacy"
                className="text-brand-purple-light hover:underline"
              >
                Privacy Policy
              </Link>
            </li>
            <li>
              <Link
                to="/docs/terms"
                className="text-brand-purple-light hover:underline"
              >
                Terms of Service
              </Link>
            </li>
            <li>
              <Link
                to="/delete-account"
                className="text-brand-purple-light hover:underline"
              >
                Delete account
              </Link>
            </li>
          </ul>
        </section>

        <p className="text-text-muted text-sm">
          © {new Date().getFullYear()} Spark. Built for deeper connections.
        </p>
      </main>
      <Footer />
    </div>
  );
};
