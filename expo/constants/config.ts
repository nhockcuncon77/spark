if (!process.env.EXPO_PUBLIC_BLINDLY_API_URL) {
  throw new Error("BLINDLY_API_URL environment variable is not set");
}
if (!process.env.EXPO_PUBLIC_POSTHOG_API_KEY) {
  throw new Error("POSTHOG_API_KEY environment variable is not set");
}
if (!process.env.EXPO_PUBLIC_POSTHOG_HOST_URL) {
  throw new Error("POSTHOG_HOST_URL environment variable is not set");
}

export const config = {
  api_host: process.env.EXPO_PUBLIC_BLINDLY_API_URL,
  ACCESS_TOKEN_KEY: "spark_access_token",
  posthog_api_key: process.env.EXPO_PUBLIC_POSTHOG_API_KEY,
  posthog_host_url: process.env.EXPO_PUBLIC_POSTHOG_HOST_URL,
};
