import { useState } from "react";
import { Link, NavLink, Outlet, useNavigate, useLocation } from "react-router-dom";

const nav = [
  {
    tab: "About Spark",
    groups: [
      {
        group: "About",
        pages: [{ label: "About", path: "/docs/about" }],
      },
    ],
  },
  {
    tab: "Documentation",
    groups: [
      {
        group: "Setup",
        pages: [
          { label: "Architecture", path: "/docs/setup/architecture" },
          { label: "Self-host", path: "/docs/setup/self-host" },
          { label: "Developer Setup", path: "/docs/setup/dev-setup" },
          { label: "Contributing", path: "/docs/setup/contributing" },
        ],
      },
    ],
  },
  {
    tab: "Legal",
    groups: [
      {
        group: "Legal",
        pages: [
          { label: "Privacy", path: "/docs/privacy" },
          { label: "Terms", path: "/docs/terms" },
          { label: "CSAE", path: "/docs/csae" },
        ],
      },
    ],
  },
];

export const DocsLayout = () => {
  const navigate = useNavigate();
  const location = useLocation();
  return (
    <div className="min-h-screen bg-bg-primary text-text-primary selection:bg-brand-purple selection:text-white flex flex-col">
      {/* Top bar */}
      <header className="sticky top-0 z-40 border-b border-border-subtle bg-bg-primary/90 backdrop-blur-md">
        <div className="container flex items-center justify-between h-14 px-4">
          <Link
            to="/"
            className="text-xl font-bold tracking-tight text-white hover:text-brand-purple-light transition-colors"
          >
            Spark<span className="text-brand-purple">.</span>
          </Link>
          <div className="flex items-center gap-4 text-sm">
            <a
              href="https://spark-frontend-tlcj.onrender.com"
              target="_blank"
              rel="noopener noreferrer"
              className="text-text-secondary hover:text-white transition-colors"
            >
              App
            </a>
            <a
              href="https://github.com/nhockcuncon77/spark"
              target="_blank"
              rel="noopener noreferrer"
              className="text-text-secondary hover:text-white transition-colors"
            >
              GitHub
            </a>
            <a
              href="mailto:support@spark.example.com"
              className="text-text-secondary hover:text-white transition-colors"
            >
              Contact
            </a>
          </div>
        </div>
      </header>

      <div className="flex flex-1">
        {/* Sidebar - Mintlify-style */}
        <aside className="hidden lg:block w-64 shrink-0 border-r border-border-subtle bg-bg-surface/50">
          <nav className="sticky top-14 h-[calc(100vh-3.5rem)] overflow-y-auto py-6 pl-4 pr-2">
            {nav.map((section) => (
              <div key={section.tab} className="mb-8">
                <div className="text-xs font-semibold uppercase tracking-wider text-text-muted mb-3 px-2">
                  {section.tab}
                </div>
                {section.groups.map((grp) => (
                  <div key={grp.group} className="mb-4">
                    <div className="text-xs font-medium text-text-faint mb-2 px-2">
                      {grp.group}
                    </div>
                    <ul className="space-y-0.5">
                      {grp.pages.map((page) => (
                        <li key={page.path}>
                          <NavLink
                            to={page.path}
                            className={({ isActive }) =>
                              `block rounded-lg px-3 py-2 text-sm transition-colors ${
                                isActive
                                  ? "bg-brand-purple/20 text-brand-purple-light font-medium"
                                  : "text-text-secondary hover:text-white hover:bg-white/5"
                              }`
                            }
                          >
                            {page.label}
                          </NavLink>
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
            ))}
          </nav>
        </aside>

        {/* Main content */}
        <main className="flex-1 min-w-0">
          {/* Mobile doc nav */}
          <div className="lg:hidden border-b border-border-subtle px-4 py-3">
            <select
              className="w-full rounded-lg bg-bg-surface border border-border-medium text-text-primary px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-purple"
              onChange={(e) => {
                const v = e.target.value;
                if (v) navigate(v);
              }}
              value={location.pathname}
            >
              {nav.flatMap((section) =>
                section.groups.flatMap((grp) =>
                  grp.pages.map((page) => (
                    <option key={page.path} value={page.path}>
                      {section.tab} → {page.label}
                    </option>
                  ))
                )
              )}
            </select>
          </div>
          <div className="max-w-3xl mx-auto px-4 sm:px-6 py-10 pb-20">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
};
