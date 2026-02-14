import { Link } from "react-router-dom";

export const DocsPrivacy = () => (
  <>
    <h1 className="text-4xl font-bold mb-2 text-white">Privacy Policy</h1>
    <p className="text-text-muted text-sm mb-10">Last updated: December 2025</p>

    <div className="space-y-8 text-text-secondary">
      <p>
        Spark is designed to protect your identity, your autonomy, and your
        right to control your own data. This policy explains what we
        collect, why we collect it, and how we keep it safe.
      </p>
      <section>
        <h2 className="text-2xl font-semibold text-white mt-8 mb-4">Summary</h2>
        <ul className="list-disc list-inside space-y-1">
          <li>We never show your photos until both sides choose to reveal.</li>
          <li>Identity verification data is encrypted and never shared with other users.</li>
          <li>You can delete your account and data at any time.</li>
          <li>We use data to improve matching and safety, not for advertising.</li>
        </ul>
      </section>
      <section>
        <h2 className="text-2xl font-semibold text-white mt-8 mb-4">Data we collect</h2>
        <p>
          We collect account information (email, name, profile details),
          verification data (for identity checks), usage and safety signals,
          and optional preferences. Photos and messages are stored securely
          and only shown according to your choices.
        </p>
      </section>
      <section>
        <h2 className="text-2xl font-semibold text-white mt-8 mb-4">Your rights</h2>
        <p>
          You can access, correct, export, or delete your data. To delete
          your account, use the app (Profile → Settings → Delete Account) or
          the <Link to="/delete-account" className="text-brand-purple-light hover:underline">delete account page</Link>.
        </p>
      </section>
      <p className="mt-12 text-text-muted text-sm">
        For the full policy or questions, contact{" "}
        <a href="mailto:support@spark.example.com" className="text-brand-purple-light hover:underline">
          support@spark.example.com
        </a>
        .
      </p>
    </div>
  </>
);
