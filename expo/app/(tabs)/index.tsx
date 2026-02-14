import { Redirect } from "expo-router";

// This screen is hidden in the tab bar
// Redirect to the main swipe screen
export default function Index() {
  return <Redirect href="/(tabs)/swipe" />;
}
