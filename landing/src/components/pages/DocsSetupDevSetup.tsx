import { DocCard, DocCardGroup } from "../docs/DocCard";
import { DocCallout } from "../docs/DocCallout";
import { CodeBlock, InlineCode } from "../docs/DocProse";

export const DocsSetupDevSetup = () => (
  <>
    <h1 className="text-4xl font-bold mb-2 text-white">Developer Setup</h1>
    <p className="text-text-secondary text-lg mb-10">
      Get your local environment ready to build, run, test, and debug Spark.
    </p>

    <section className="mb-10">
      <h2 className="text-2xl font-semibold mb-4 text-white">Overview</h2>
      <p className="text-text-secondary mb-4">
        This guide helps you: set up the backend (Go + Fiber + GraphQL), prepare PostgreSQL & Redis, run Drizzle migrations, develop the Expo app, and iterate quickly.
      </p>
      <DocCardGroup cols={3}>
        <DocCard title="Architecture" href="/docs/setup/architecture" icon="🖥️">
          How backend, frontend, and database work together.
        </DocCard>
        <DocCard title="Self-host" href="/docs/setup/self-host" icon="🚀">
          Run locally with Docker Compose or deploy on Kubernetes.
        </DocCard>
        <DocCard title="Contribute" href="/docs/setup/contributing" icon="🤝">
          Guidelines to open PRs and build features.
        </DocCard>
      </DocCardGroup>
    </section>

    <section className="mb-10">
      <h2 className="text-2xl font-semibold mb-4 text-white">Prerequisites</h2>
      <ul className="list-disc list-inside space-y-1 text-text-secondary mb-4">
        <li>Git, Go (matches services/go.mod), Node.js 18+ or 20+</li>
        <li>Bun or npm/yarn, Docker & Docker Compose</li>
        <li>PostgreSQL 16+, Redis 7+ (optional if using Docker)</li>
        <li>Expo CLI & Expo Go app, .env for backend secrets</li>
      </ul>
      <DocCallout type="warning" emoji="🔐">
        The backend requires <InlineCode>DATABASE_URL</InlineCode> and <InlineCode>REDIS_URL</InlineCode>. In Docker Compose these are set automatically; otherwise set them yourself.
      </DocCallout>
    </section>

    <section className="mb-10">
      <h2 className="text-2xl font-semibold mb-4 text-white">Clone the repo</h2>
      <CodeBlock>{`git clone https://github.com/nhockcuncon77/spark.git
cd spark`}</CodeBlock>
      <p className="text-text-secondary mt-4">
        Project layout: <InlineCode>services/</InlineCode> (Go backend), <InlineCode>db/</InlineCode> (Drizzle), <InlineCode>docs/</InlineCode>, <InlineCode>expo/</InlineCode> (React Native).
      </p>
    </section>

    <section className="mb-10">
      <h2 className="text-2xl font-semibold mb-4 text-white">Environment configuration</h2>
      <p className="text-text-secondary mb-2">Create <InlineCode>spark/.env</InlineCode>:</p>
      <CodeBlock>{`# Database & Cache
DATABASE_URL=postgres://spark:spark_password@localhost:5432/spark?sslmode=disable
REDIS_URL=redis://localhost:6379

# App configuration
ENVIRONMENT=DEV
JWT_SECRET=replace_me`}</CodeBlock>
      <DocCallout type="info" emoji="📝">
        In Docker Compose, DATABASE_URL and REDIS_URL are set in the backend service. Other env vars still need .env.
      </DocCallout>
    </section>

    <section className="mb-10">
      <h2 className="text-2xl font-semibold mb-4 text-white">Bring up local infrastructure</h2>
      <p className="text-text-secondary mb-2">From repo root:</p>
      <CodeBlock>{`docker compose up --build
# or: docker compose up --build -d`}</CodeBlock>
      <p className="text-text-secondary mt-4">Verify: <InlineCode>curl http://localhost:9000/health</InlineCode></p>
    </section>

    <section className="mb-10">
      <h2 className="text-2xl font-semibold mb-4 text-white">Run the backend (Go)</h2>
      <CodeBlock>{`cd services
go mod download
go build -o spark .
./spark`}</CodeBlock>
      <p className="text-text-secondary mt-4">Server listens on port 9000.</p>
    </section>

    <section className="mb-10">
      <h2 className="text-2xl font-semibold mb-4 text-white">Frontend (Expo)</h2>
      <CodeBlock>{`cd expo
bun install   # or npm install
bun run dev   # or expo start`}</CodeBlock>
      <p className="text-text-secondary mt-4">Configure the app to point to your backend (e.g. http://localhost:9000/graphql). Use Expo Go and scan the QR.</p>
    </section>

    <DocCardGroup cols={2}>
      <DocCard title="Self-host Spark" href="/docs/setup/self-host" icon="🚀">
        Deploy locally or in Kubernetes.
      </DocCard>
      <DocCard title="Contribution Guidelines" href="/docs/setup/contributing" icon="🤝">
        How to propose changes and open PRs.
      </DocCard>
    </DocCardGroup>
  </>
);
