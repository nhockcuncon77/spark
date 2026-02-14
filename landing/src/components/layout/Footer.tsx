export const Footer = () => {
  return (
    <footer className="py-12 border-t border-border-subtle bg-bg-surface">
      <div className="container">
        <div className="flex flex-col md:flex-row justify-between items-center gap-6">
          <div className="flex flex-col items-center md:items-start gap-2">
            <span className="text-xl font-bold text-white">
              Spark<span className="text-brand-purple">.</span>
            </span>
            <p className="text-text-muted text-sm">
              Meet the person first. Looks later.
            </p>
          </div>

          <div className="flex gap-8 text-sm text-text-secondary">
            <a
              href="https://spark.example.com/docs/legal/privacy"
              className="hover:text-brand-purple-light transition-colors"
            >
              Privacy
            </a>
            <a
              href="https://spark.example.com/docs/legal/terms"
              className="hover:text-brand-purple-light transition-colors"
            >
              Terms
            </a>
            <a
              href="/delete-account"
              className="hover:text-brand-purple-light transition-colors"
            >
              Delete Account
            </a>
            <a
              href="mailto:support@spark.example.com"
              className="hover:text-brand-purple-light transition-colors"
            >
              Contact
            </a>
          </div>
        </div>

        <div className="mt-8 pt-8 border-t border-border-subtle text-center text-xs text-text-faint">
          <p>© {new Date().getFullYear()} Spark. Built with love in India.</p>
        </div>
      </div>
    </footer>
  );
};
