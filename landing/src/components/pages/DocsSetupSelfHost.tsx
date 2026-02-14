import { DocCard, DocCardGroup } from "../docs/DocCard";
import { DocCallout } from "../docs/DocCallout";
import { CodeBlock, InlineCode } from "../docs/DocProse";

export const DocsSetupSelfHost = () => (
  <>
    <h1 className="text-4xl font-bold mb-2 text-white">Self-host Spark</h1>
    <p className="text-text-secondary text-lg mb-10">
      Deploy Spark using Docker Compose or Kubernetes, and set up the mobile app via Expo or APKs.
    </p>

    <section className="mb-10">
      <h2 className="text-2xl font-semibold mb-4 text-white">Overview</h2>
      <DocCardGroup cols={3}>
        <DocCard title="Docker Compose" href="#docker-compose" icon="📦">
          Easiest way to run locally or on a single VM — Postgres, Redis, migrations, Go backend.
        </DocCard>
        <DocCard title="Kubernetes" href="#kubernetes" icon="☁️">
          Recommended for production — deployment manifest with Ingress and TLS.
        </DocCard>
        <DocCard title="Mobile App" href="#mobile" icon="📱">
          Expo EAS for QR installs, or build APKs for Android.
        </DocCard>
      </DocCardGroup>
    </section>

    <section className="mb-10">
      <h2 className="text-2xl font-semibold mb-4 text-white">Prerequisites</h2>
      <ul className="list-disc list-inside space-y-1 text-text-secondary mb-4">
        <li>Docker and Docker Compose (for local/VM)</li>
        <li>Kubernetes cluster with kubectl (for K8s)</li>
        <li>Domain and TLS certificate (recommended for production)</li>
        <li>.env file for secrets and configuration</li>
      </ul>
      <DocCallout type="warning" emoji="🔐">
        The backend requires <InlineCode>DATABASE_URL</InlineCode> and <InlineCode>REDIS_URL</InlineCode>, set automatically by Docker Compose. Other env vars must be provided via .env or your orchestrator.
      </DocCallout>
    </section>

    <section id="docker-compose" className="mb-10">
      <h2 className="text-2xl font-semibold mb-4 text-white">Docker Compose</h2>
      <p className="text-text-secondary mb-4">
        The Compose setup runs: Postgres, Redis, a migration job (Drizzle), and the Go backend (port 9000).
      </p>
      <p className="text-text-secondary mb-2">1. Create a <InlineCode>.env</InlineCode> in the repo root (spark/.env). Compose sets:</p>
      <ul className="list-disc list-inside text-text-secondary mb-4">
        <li><InlineCode>DATABASE_URL</InlineCode> → postgres://spark:spark_password@postgres:5432/spark?sslmode=disable</li>
        <li><InlineCode>REDIS_URL</InlineCode> → redis://redis:6379</li>
      </ul>
      <p className="text-text-secondary mb-2">2. Build and start:</p>
      <CodeBlock>{`docker compose up --build
# or detached:
docker compose up --build -d`}</CodeBlock>
      <p className="text-text-secondary mb-2">3. Verify:</p>
      <CodeBlock>curl http://localhost:9000/health</CodeBlock>
    </section>

    <section id="kubernetes" className="mb-10">
      <h2 className="text-2xl font-semibold mb-4 text-white">Kubernetes</h2>
      <p className="text-text-secondary mb-4">
        Use the provided deployment manifest. Deployment (containerPort 9000), Service (port 80 → 9000), Ingress with NGINX annotations and TLS.
      </p>
      <CodeBlock>{`# spark/deployment.yaml
kubectl apply -f deployment.yaml`}</CodeBlock>
      <p className="text-text-secondary mb-4">
        Provide <InlineCode>DATABASE_URL</InlineCode> and <InlineCode>REDIS_URL</InlineCode> via Secret + Deployment envFrom.
      </p>
      <DocCallout type="info" emoji="🛠️">
        Add readiness/liveness probes (e.g. GET /health) and resource limits for production.
      </DocCallout>
    </section>

    <section id="mobile" className="mb-10">
      <h2 className="text-2xl font-semibold mb-4 text-white">Mobile App Options</h2>
      <p className="text-text-secondary mb-4">
        <strong className="text-white">Expo (recommended):</strong> Install Expo Go, scan the latest build QR — works on iOS and Android. No store submission needed for testing.
      </p>
      <p className="text-text-secondary mb-4">
        <strong className="text-white">APK (Android):</strong> Build from source or EAS, or download from releases; install on device or emulator.
      </p>
      <p className="text-text-secondary mb-4">
        <strong className="text-white">From scratch:</strong> Clone repo, configure GraphQL endpoint in app config, run <InlineCode>expo start</InlineCode>; for production use <InlineCode>eas build -p android</InlineCode> / <InlineCode>eas build -p ios</InlineCode>.
      </p>
      <p className="text-text-secondary">
        Ensure the app points to your backend: GraphQL at <InlineCode>https://your-domain/graphql</InlineCode>, plus REST for health, uploads, webhooks.
      </p>
    </section>

    <DocCardGroup cols={2}>
      <DocCard title="Architecture" href="/docs/setup/architecture" icon="🖥️">
        How backend, frontend, and database fit together.
      </DocCard>
      <DocCard title="Developer Setup" href="/docs/setup/dev-setup" icon="🔧">
        Local development environment.
      </DocCard>
    </DocCardGroup>
  </>
);
