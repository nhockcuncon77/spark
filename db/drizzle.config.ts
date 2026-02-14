import type { Config } from "drizzle-kit";

if (
  !process.env.DB_HOST ||
  !process.env.DB_USER ||
  !process.env.DB_PASSWORD ||
  !process.env.DB_NAME ||
  !process.env.DB_PORT
) {
  console.error(
    "DB_HOST, DB_USER, DB_PASSWORD, DB_NAME, or DB_PORT environment variable is not set",
  );
  process.exit(1);
}

export default {
  schema: "./schema.ts",
  out: "./drizzle",
  dialect: "postgresql",
  dbCredentials: {
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    port: Number(process.env.DB_PORT),
    ssl: process.env.DB_SSL === "true" ? true : false,
  },
} satisfies Config;
