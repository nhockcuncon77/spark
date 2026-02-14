import { DocCard, DocCardGroup } from "../docs/DocCard";

export const DocsSetupContributing = () => (
  <>
    <h1 className="text-4xl font-bold mb-2 text-white">Contribution Guidelines</h1>
    <p className="text-text-secondary text-lg mb-10">
      How to propose changes, write tests, and land high-quality PRs for Spark.
    </p>

    <section className="mb-10">
      <h2 className="text-2xl font-semibold mb-4 text-white">Welcome</h2>
      <p className="text-text-secondary mb-4">
        Thanks for your interest in contributing to Spark! This guide explains how to file issues, propose changes, write tests, and open pull requests that can be reviewed and merged smoothly.
      </p>
      <p className="text-text-secondary mb-4">Spark&apos;s stack includes:</p>
      <ul className="list-disc list-inside space-y-1 text-text-secondary">
        <li>Backend: Go + Fiber, GraphQL-first (selected REST endpoints)</li>
        <li>Mobile: React Native (Expo)</li>
        <li>Data: PostgreSQL with Drizzle, Redis for cache</li>
        <li>Ops: Docker Compose for local dev, Kubernetes for production</li>
      </ul>
    </section>

    <section className="mb-10">
      <h2 className="text-2xl font-semibold mb-4 text-white">Core Principles</h2>
      <ul className="list-disc list-inside space-y-1 text-text-secondary">
        <li>Quality over speed: reliability, readability, test coverage.</li>
        <li>Small, focused changes: keep PRs scoped and easy to review.</li>
        <li>Documentation matters: update docs for new APIs and flows.</li>
        <li>Security and privacy first: protect user data, no secrets in repo.</li>
        <li>Transparent AI: keep AI features labeled, opt-in, and documented.</li>
      </ul>
    </section>

    <section className="mb-10">
      <h2 className="text-2xl font-semibold mb-4 text-white">What Can I Work On?</h2>
      <DocCardGroup cols={3}>
        <DocCard title="Bug fixes" href="/docs/setup/contributing" icon="🐛">
          Reproducible issues with clear steps, logs, and a minimal patch.
        </DocCard>
        <DocCard title="Features" href="/docs/setup/contributing" icon="✨">
          Discuss scope and UX beforehand, ship behind flags if risky.
        </DocCard>
        <DocCard title="Docs & DX" href="/docs/setup/contributing" icon="📖">
          Improve guides, examples, tooling, and developer ergonomics.
        </DocCard>
      </DocCardGroup>
    </section>

    <section className="mb-10">
      <h2 className="text-2xl font-semibold mb-4 text-white">Reporting Issues</h2>
      <ul className="list-decimal list-inside space-y-2 text-text-secondary">
        <li>Search existing issues to avoid duplicates.</li>
        <li>Provide a minimal reproduction: steps, expected vs actual, logs/screenshots, environment details.</li>
        <li>For security-sensitive issues, contact maintainers privately.</li>
      </ul>
      <p className="text-text-secondary mt-4">Use clear titles and labels (e.g. bug, enhancement, docs, security).</p>
    </section>

    <section className="mb-10">
      <h2 className="text-2xl font-semibold mb-4 text-white">Proposing Changes</h2>
      <p className="text-text-secondary mb-4">Before larger features or architectural changes, open a short design discussion:</p>
      <ul className="list-disc list-inside space-y-1 text-text-secondary">
        <li>Problem statement and goals</li>
        <li>Proposed approach (endpoints, GraphQL schema, client UX)</li>
        <li>Data model impact and migration strategy</li>
        <li>Risks and alternatives</li>
      </ul>
    </section>

    <section className="mb-10">
      <h2 className="text-2xl font-semibold mb-4 text-white">Development Workflow</h2>
      <ol className="list-decimal list-inside space-y-2 text-text-secondary">
        <li>Fork and clone the repo.</li>
        <li>Create a feature branch (feat/short-description or fix/short-description).</li>
        <li>Set up local stack with Docker Compose; configure Expo to target your backend.</li>
        <li>Write code with tests and update docs.</li>
        <li>Run formatters and linters; ensure go test ./... passes.</li>
        <li>Push and open a PR with the checklist below.</li>
      </ol>
    </section>

    <section className="mb-10">
      <h2 className="text-2xl font-semibold mb-4 text-white">Pull Request Checklist</h2>
      <ul className="list-disc list-inside space-y-1 text-text-secondary">
        <li>Problem and solution clearly described</li>
        <li>Small, focused changes; split PRs if scope is large</li>
        <li>Tests added/updated; CI passes</li>
        <li>Docs updated (including navigation when adding pages)</li>
        <li>No secrets or sensitive data committed</li>
        <li>Manual verification steps and screenshots for UI changes</li>
      </ul>
      <p className="text-text-secondary mt-4">PR title format: feat(scope): summary, fix(scope): summary, docs(scope): summary.</p>
    </section>

    <section className="mb-10">
      <h2 className="text-2xl font-semibold mb-4 text-white">Security</h2>
      <p className="text-text-secondary">
        If you discover a vulnerability, do not open a public issue. Contact maintainers privately with steps to reproduce and impact. Never commit secrets; use parameterized queries and validate inputs.
      </p>
    </section>

    <DocCardGroup cols={2}>
      <DocCard title="Dev Setup" href="/docs/setup/dev-setup" icon="🔧">
        Prepare your local environment and run tests.
      </DocCard>
      <DocCard title="Self-host" href="/docs/setup/self-host" icon="🚀">
        Deploy via Docker Compose or Kubernetes.
      </DocCard>
    </DocCardGroup>
  </>
);
