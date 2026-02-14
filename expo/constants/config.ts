// EXPO_PUBLIC_* are read at build time. Set in Render (or .env) when building so the web app gets the right API URL.
// Fallbacks allow static export to succeed when building without env (e.g. CI); set env in production build.
const apiHost =
  process.env.EXPO_PUBLIC_SPARK_API_URL ||
  process.env.EXPO_PUBLIC_BLINDLY_API_URL ||
  process.env.EXPO_PUBLIC_API_URL ||
  "";

export const config = {
  api_host: apiHost || "https://api.spark.example.com",
  ACCESS_TOKEN_KEY: "spark_access_token",
  posthog_api_key: process.env.EXPO_PUBLIC_POSTHOG_API_KEY || "",
  posthog_host_url: process.env.EXPO_PUBLIC_POSTHOG_HOST_URL || "https://app.posthog.com",
};
