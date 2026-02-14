import { Navbar } from "../layout/Navbar";
import { Footer } from "../layout/Footer";
import { Link } from "react-router-dom";

export const DocsTerms = () => {
  return (
    <div className="min-h-screen bg-bg-primary text-text-primary selection:bg-brand-purple selection:text-white">
      <Navbar />
      <main className="container max-w-4xl mx-auto px-4 py-16">
        <Link to="/docs" className="text-brand-purple-light hover:underline text-sm mb-6 inline-block">
          ← Documentation
        </Link>
        <h1 className="text-4xl font-bold mb-2">Terms of Service</h1>
        <p className="text-text-muted text-sm mb-12">Last updated: December 2025</p>

        <div className="prose prose-invert max-w-none space-y-6 text-text-secondary">
          <p>
            Welcome to Spark. By creating an account or using the platform, you
            agree to these Terms of Service. If you do not agree, you must
            discontinue using Spark.
          </p>
          <section>
            <h2 className="text-xl font-semibold text-white mt-8 mb-2">1. Eligibility</h2>
            <p>To use Spark, you must:</p>
            <ul className="list-disc list-inside space-y-1 mt-2">
              <li>Be 18 years or older.</li>
              <li>Be legally permitted to use a dating service in your country.</li>
              <li>Create an account using true, accurate information.</li>
              <li>Not be previously banned from Spark.</li>
            </ul>
          </section>
          <section>
            <h2 className="text-xl font-semibold text-white mt-8 mb-2">2. Your account</h2>
            <p>
              You agree to keep your login credentials confidential, use Spark
              for personal non-commercial purposes, provide accurate profile
              information, and not impersonate others. You are responsible for
              all activity under your account.
            </p>
          </section>
          <section>
            <h2 className="text-xl font-semibold text-white mt-8 mb-2">3. Verification & safety</h2>
            <p>
              Spark may use identity verification (e.g. government ID and
              liveness checks) to promote safety. By using the app, you consent
              to applicable verification and safety policies.
            </p>
          </section>
          <section>
            <h2 className="text-xl font-semibold text-white mt-8 mb-2">4. Acceptable use</h2>
            <p>
              You must not harass, abuse, spam, or misuse the platform. We may
              suspend or terminate accounts that violate these terms or our
              community standards.
            </p>
          </section>
          <p className="mt-12 text-text-muted text-sm">
            For the full terms or questions, contact{" "}
            <a href="mailto:support@spark.example.com" className="text-brand-purple-light hover:underline">
              support@spark.example.com
            </a>
            .
          </p>
        </div>
      </main>
      <Footer />
    </div>
  );
};
