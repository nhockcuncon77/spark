import { DocCard, DocCardGroup } from "../docs/DocCard";
import { CodeBlock, InlineCode } from "../docs/DocProse";

export const DocsSetupArchitecture = () => (
  <>
    <h1 className="text-4xl font-bold mb-2 text-white">System Architecture</h1>
    <p className="text-text-secondary text-lg mb-10">
      A detailed overview of Spark&apos;s codebase, backend, frontend, and database.
    </p>

    <section className="mb-10">
      <h2 className="text-2xl font-semibold mb-4 text-white">Overview</h2>
      <p className="text-text-secondary mb-4">
        Spark is composed of three main layers:
      </p>
      <ul className="list-disc list-inside space-y-1 text-text-secondary mb-6">
        <li>Backend service (Go) providing GraphQL and selected HTTP endpoints via Fiber.</li>
        <li>Frontend mobile application using React Native (Expo).</li>
        <li>PostgreSQL and Redis backing stores, with schema managed via Drizzle ORM.</li>
      </ul>
      <p className="text-text-secondary mb-4">
        A lightweight application proxy routes traffic to the appropriate protocol (GraphQL vs REST) behind a single origin.
      </p>
      <DocCardGroup cols={3}>
        <DocCard title="Backend" href="/docs/setup/architecture" icon="🖥️">
          GraphQL-first API with GoFiber, plus HTTP endpoints for health, file ops, webhooks.
        </DocCard>
        <DocCard title="Frontend" href="/docs/setup/architecture" icon="📱">
          React Native (Expo) application, OTA updates via Expo EAS, iOS & Android.
        </DocCard>
        <DocCard title="Database" href="/docs/setup/architecture" icon="🗄️">
          PostgreSQL with Drizzle schema and migrations; Redis for caching & ephemeral data.
        </DocCard>
      </DocCardGroup>
    </section>

    <section className="mb-10">
      <h2 className="text-2xl font-semibold mb-4 text-white">High-level topology</h2>
      <p className="text-text-secondary mb-4">
        A single host (domain) terminates TLS and forwards requests to the Go backend. GraphQL is the primary interface; REST endpoints handle health checks, webhooks, file IO. PostgreSQL stores core entities (users, matches, chats, posts, etc.); Redis is used for caching, sessions, rate limits.
      </p>
    </section>

    <section className="mb-10">
      <h2 className="text-2xl font-semibold mb-4 text-white">Backend</h2>
      <p className="text-text-secondary mb-2">Technology: Go, Fiber, GraphQL, REST.</p>
      <p className="text-text-secondary mb-4">
        Common REST endpoints: <InlineCode>GET /health</InlineCode> (liveness), <InlineCode>POST /webhooks/...</InlineCode>, <InlineCode>GET /files/:id</InlineCode>, <InlineCode>POST /upload</InlineCode>.
      </p>
    </section>

    <section className="mb-10">
      <h2 className="text-2xl font-semibold mb-4 text-white">Frontend (Expo)</h2>
      <p className="text-text-secondary">
        React Native via Expo; EAS for builds and OTA updates. The app consumes GraphQL primarily; HTTP for uploads and health.
      </p>
    </section>

    <section className="mb-10">
      <h2 className="text-2xl font-semibold mb-4 text-white">Database</h2>
      <p className="text-text-secondary mb-2">
        PostgreSQL: users, matches, chats, posts, comments, user_files, reports, verifications. Redis: session store, caching, rate limiting.
      </p>
    </section>

    <DocCardGroup cols={2}>
      <DocCard title="Self-host" href="/docs/setup/self-host" icon="🚀">
        Deploy via Docker Compose or Kubernetes.
      </DocCard>
      <DocCard title="Developer Setup" href="/docs/setup/dev-setup" icon="🔧">
        Set up your local development environment.
      </DocCard>
    </DocCardGroup>
  </>
);
