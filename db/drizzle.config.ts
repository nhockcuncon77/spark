import type { Config } from "drizzle-kit";

function getDbCredentials() {
  const url = process.env.DATABASE_URL;
  if (url) {
    // Parse postgresql://user:password@host:port/database?sslmode=...
    const parsed = new URL(
      url.startsWith("postgresql://") ? url.replace(/^postgresql:\/\//, "https://") : url,
    );
    const dbName = (parsed.pathname || "/").slice(1).replace(/%2F/g, "/") || "postgres";
    const port = parsed.port ? Number(parsed.port) : 5432;
    const ssl = parsed.searchParams.get("sslmode") === "disable" ? false : true;
    return {
      host: parsed.hostname,
      user: decodeURIComponent(parsed.username),
      password: decodeURIComponent(parsed.password),
      database: dbName,
      port,
      ssl,
    };
  }
  if (
    process.env.DB_HOST &&
    process.env.DB_USER &&
    process.env.DB_PASSWORD != null &&
    process.env.DB_NAME &&
    process.env.DB_PORT
  ) {
    return {
      host: process.env.DB_HOST,
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
      database: process.env.DB_NAME,
      port: Number(process.env.DB_PORT),
      ssl: process.env.DB_SSL === "true",
    };
  }
  console.error(
    "Set DATABASE_URL (e.g. postgresql://user:pass@host:port/db) or DB_HOST, DB_USER, DB_PASSWORD, DB_NAME, DB_PORT",
  );
  process.exit(1);
}

const dbCredentials = getDbCredentials();

export default {
  schema: "./schema.ts",
  out: "./drizzle",
  dialect: "postgresql",
  dbCredentials,
} satisfies Config;
