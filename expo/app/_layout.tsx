import React, { useEffect, useCallback, useState, useMemo, useRef } from "react";
import {
  View,
  Text,
  ActivityIndicator,
  StyleSheet,
  Animated,
  Platform,
  Dimensions,
} from "react-native";
import { DarkTheme, ThemeProvider } from "@react-navigation/native";
import { Stack, useRouter, useSegments, Href } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { useFonts } from "expo-font";
import * as SplashScreen from "expo-splash-screen";
import { useVideoPlayer, VideoView } from "expo-video";
import "react-native-reanimated";
import "../global.css";

import { useStore } from "../store/useStore";
import { graphqlAuthService } from "../services/graphql-auth";
import apiService from "../services/api";
import { setAccessToken as setGraphQLToken } from "../services/graphql-client";
import { PostHogProvider } from "posthog-react-native";
import { config } from "@/constants/config";
import { usePushNotifications } from "../services/push-notification-service";
import { useSubscriptionStore } from "../store/useSubscriptionStore";

// Video splash only on native; web shows app immediately
const splashVideoSource =
  Platform.OS === "web" ? null : require("../assets/splash1.mp4");

// Custom dark theme matching our design system
const SparkDarkTheme = {
  ...DarkTheme,
  colors: {
    ...DarkTheme.colors,
    background: "#0B0223",
    card: "#1D0F45",
    border: "rgba(255, 255, 255, 0.1)",
    primary: "#6A1BFF",
    text: "#FFFFFF",
  },
};

function RootLayoutNav() {
  const router = useRouter();
  const segments = useSegments();
  const { isAuthenticated, isLoading, setAuthLoading, login, logout, accessToken } =
    useStore();

  // Push notifications hook
  usePushNotifications();

  // Subscription store
  const { fetchSubscriptionStatus, fetchPlans } = useSubscriptionStore();

  // Memoized login handler
  const handleLogin = useCallback(
    (user: Parameters<typeof login>[0], token: string) => {
      login(user, token);
    },
    [login],
  );

  // Restore session on app launch
  useEffect(() => {
    setAuthLoading(true);
    // On web: stop showing loading after 4s so user sees something if restore hangs
    const timeout =
      Platform.OS === "web"
        ? setTimeout(() => setAuthLoading(false), 4000)
        : undefined;

    const restoreSession = async () => {
      try {
        const result = await graphqlAuthService.restoreSession();

        if (result.success && result.user) {
          const userProfile = {
            id: result.user.id,
            email: result.user.email,
            firstName: result.user.first_name || "User",
            lastName: result.user.last_name || "",
            bio: result.user.bio || "",
            hobbies: result.user.hobbies || [],
            personalityTraits: result.user.personality_traits
              ? Object.fromEntries(
                result.user.personality_traits.map((t) => [t.key, t.value]),
              )
              : {},
            photos: result.user.photos || [],
            isVerified: result.user.is_verified,
            isPhotosRevealed: false,
          };

          // Get the stored access token
          const storedToken = result.accessToken || accessToken;
          if (storedToken) {
            handleLogin(userProfile, storedToken);
            apiService.setToken(storedToken);
            await setGraphQLToken(storedToken);

            // Sync onboarding state so index redirects to app (not hobbies) when done
            const status = graphqlAuthService.getOnboardingStatus(result.user);
            if (status.isComplete) {
              useStore.getState().completeOnboarding();
            }

            fetchPlans();
            fetchSubscriptionStatus();
          }
        }
      } catch (error) {
        console.error("Failed to restore session:", error);
        logout();
      } finally {
        setAuthLoading(false);
      }
    };

    restoreSession();
    return () => {
      if (timeout) clearTimeout(timeout);
    };
  }, [handleLogin, setAuthLoading, accessToken]);

  // Set API token when access token changes
  useEffect(() => {
    if (accessToken) {
      apiService.setToken(accessToken);
      setGraphQLToken(accessToken);
    }
  }, [accessToken]);

  // Handle navigation based on auth state
  useEffect(() => {
    if (isLoading) return;

    const inAuthGroup = segments[0] === "(auth)";

    if (!isAuthenticated && !inAuthGroup) {
      if (Platform.OS === "web" && typeof window !== "undefined") {
        const base = window.location.origin;
        window.location.replace(`${base}/login`);
        return;
      }
      router.replace("/(auth)/welcome");
    } else if (isAuthenticated && inAuthGroup) {
      // Check actual user data for onboarding status
      const checkAndNavigate = async () => {
        const storedUser = await graphqlAuthService.getStoredUser();
        if (storedUser) {
          const status = graphqlAuthService.getOnboardingStatus(storedUser);
          if (status.nextScreen) {
            // Only redirect if not already on an onboarding screen
            const currentScreen = segments[1];
            if (
              currentScreen === "welcome" ||
              currentScreen === "login" ||
              currentScreen === "signup" ||
              currentScreen === "verify-code" ||
              currentScreen === "email-login"
            ) {
              router.replace(status.nextScreen as Href);
            }
          } else {
            // Onboarding complete, go to main app
            router.replace("/(tabs)/swipe" as Href);
          }
        } else {
          // No user data means session is invalid - logout and redirect to welcome
          logout();
          router.replace("/(auth)/welcome" as Href);
        }
      };

      checkAndNavigate();
    }
  }, [isAuthenticated, isLoading, segments, router]);

  // Show loading screen while checking auth (explicit styles on web so it's visible in iframe)
  if (isLoading) {
    const loadingContainerStyle =
      Platform.OS === "web"
        ? {
            flex: 1,
            minHeight: "100vh",
            width: "100%",
            backgroundColor: "#0B0223",
            justifyContent: "center" as const,
            alignItems: "center" as const,
          }
        : undefined;
    return (
      <View
        style={loadingContainerStyle}
        className="flex-1 bg-background items-center justify-center"
      >
        <ActivityIndicator size="large" color="#7C3AED" />
        {Platform.OS === "web" && (
          <Text style={{ color: "#FFFFFF", marginTop: 16, fontSize: 16 }}>
            Loading Spark...
          </Text>
        )}
      </View>
    );
  }

  const stackContentStyle =
    Platform.OS === "web"
      ? { backgroundColor: "#0B0223", flex: 1, minHeight: "100vh" }
      : { backgroundColor: "#0B0223", flex: 1 };

  return (
    <Stack
      screenOptions={{
        contentStyle: stackContentStyle,
      }}
    >
      <Stack.Screen
        name="(auth)"
        options={{
          headerShown: false,
          animation: "fade",
        }}
      />
      <Stack.Screen
        name="(tabs)"
        options={{
          headerShown: false,
          animation: "fade",
        }}
      />
      <Stack.Screen
        name="modal"
        options={{
          presentation: "modal",
          title: "Modal",
          headerShown: false,
        }}
      />
      <Stack.Screen
        name="chat/[id]"
        options={{
          headerShown: false,
          animation: "slide_from_right",
        }}
      />
      <Stack.Screen
        name="maytri-history"
        options={{
          headerShown: false,
          animation: "slide_from_right",
        }}
      />
      <Stack.Screen
        name="user/[id]"
        options={{
          headerShown: false,
          animation: "slide_from_right",
        }}
      />
      <Stack.Screen
        name="community/[id]"
        options={{
          headerShown: false,
          animation: "slide_from_right",
        }}
      />
      <Stack.Screen
        name="(modals)/edit-profile"
        options={{
          headerShown: false,
          animation: "slide_from_right",
        }}
      />
      <Stack.Screen
        name="subscription"
        options={{
          headerShown: false,
          animation: "slide_from_bottom",
        }}
      />
      <Stack.Screen
        name="index"
        options={{
          headerShown: false,
        }}
      />
    </Stack>
  );
}

// Prevent native splash screen from auto-hiding
SplashScreen.preventAutoHideAsync().catch(() => {
  /* reloading the app might trigger some race conditions, ignore them */
});

function SplashVideo({
  onLoaded,
  onFinish,
}: {
  onLoaded: () => void;
  onFinish: () => void;
}) {
  const hasCalledLoaded = useRef(false);
  const player = useVideoPlayer(splashVideoSource!, (p) => {
    p.loop = false;
    p.play();
  });

  useEffect(() => {
    // Call onLoaded once player is ready
    if (!hasCalledLoaded.current) {
      hasCalledLoaded.current = true;
      onLoaded();
    }

    const subscription = player.addListener("playToEnd", () => {
      onFinish();
    });

    return () => {
      subscription.remove();
    };
  }, [player, onLoaded, onFinish]);

  return (
    <VideoView
      player={player}
      style={StyleSheet.absoluteFill}
      contentFit="cover"
      nativeControls={false}
    />
  );
}

function AnimatedSplashScreen({ children }: { children: React.ReactNode }) {
  const animation = useMemo(() => new Animated.Value(1), []);
  const [isAppReady, setAppReady] = useState(false);
  const [isSplashVideoComplete, setSplashVideoComplete] = useState(false);
  const [isSplashAnimationComplete, setAnimationComplete] = useState(false);
  const isWeb = Platform.OS === "web";

  // On web, expo-video often never fires playToEnd so the splash blocks the app. Skip video and dismiss quickly.
  useEffect(() => {
    if (isWeb && isAppReady && !isSplashVideoComplete) {
      const t = setTimeout(() => setSplashVideoComplete(true), 400);
      return () => clearTimeout(t);
    }
  }, [isWeb, isAppReady, isSplashVideoComplete]);

  useEffect(() => {
    if (isAppReady && isSplashVideoComplete) {
      Animated.timing(animation, {
        toValue: 0,
        duration: 200,
        useNativeDriver: Platform.OS !== "web",
      }).start(() => setAnimationComplete(true));
    }
  }, [isAppReady, isSplashVideoComplete, animation]);

  const onVideoLoaded = useCallback(async () => {
    try {
      await SplashScreen.hideAsync();
    } catch (e) {
      // ignore
    } finally {
      setAppReady(true);
    }
  }, []);

  const videoElement = useMemo(() => {
    if (isWeb) {
      return null;
    }
    return (
      <SplashVideo
        onLoaded={onVideoLoaded}
        onFinish={() => setSplashVideoComplete(true)}
      />
    );
  }, [onVideoLoaded, isWeb]);

  // On web: show app immediately, no splash overlay
  useEffect(() => {
    if (isWeb) {
      SplashScreen.hideAsync().catch(() => {});
      setAppReady(true);
      setSplashVideoComplete(true);
      setAnimationComplete(true);
    }
  }, [isWeb]);

  const innerStyle =
    isWeb && typeof window !== "undefined"
      ? { flex: 1 as const, minHeight: window.innerHeight }
      : { flex: 1 as const };

  return (
    <View style={innerStyle}>
      {isAppReady && children}
      {!isSplashAnimationComplete && (
        <Animated.View
          pointerEvents="none"
          style={[
            StyleSheet.absoluteFill,
            {
              backgroundColor: "#0B0223",
              opacity: animation,
            },
          ]}
        >
          {videoElement}
        </Animated.View>
      )}
    </View>
  );
}

// On web, force root DOM elements to fill viewport so app content is visible (runs after mount).
function useWebViewportHeight() {
  useEffect(() => {
    if (Platform.OS !== "web" || typeof document === "undefined") return;

    const styleId = "spark-viewport-fix";
    if (!document.getElementById(styleId)) {
      const style = document.createElement("style");
      style.id = styleId;
      style.textContent = `
        html, body { min-height: 100vh !important; height: 100% !important; margin: 0; }
        #root, #root > * { min-height: 100vh !important; height: 100% !important; box-sizing: border-box; }
      `;
      document.head.appendChild(style);
    }

    const setHeight = () => {
      const vh = window.innerHeight;
      document.documentElement.style.setProperty("min-height", `${vh}px`);
      document.body.style.setProperty("min-height", `${vh}px`);
      const root = document.getElementById("root");
      if (root) {
        root.style.setProperty("min-height", `${vh}px`);
        root.style.setProperty("height", "100%");
        root.style.setProperty("display", "flex");
        root.style.setProperty("flex-direction", "column");
        let el: HTMLElement | null = root.firstElementChild as HTMLElement | null;
        for (let i = 0; i < 4 && el; i++) {
          el.style.setProperty("min-height", `${vh}px`);
          el.style.setProperty("flex", "1");
          el.style.setProperty("display", "flex");
          el.style.setProperty("flex-direction", "column");
          el = el.firstElementChild as HTMLElement | null;
        }
      }
    };
    setHeight();
    window.addEventListener("resize", setHeight);
    const t = setTimeout(setHeight, 50);
    const t2 = setTimeout(setHeight, 500);
    return () => {
      window.removeEventListener("resize", setHeight);
      clearTimeout(t);
      clearTimeout(t2);
    };
  }, []);
}

export default function RootLayout() {
  useWebViewportHeight();

  const [fontsLoaded, fontError] = useFonts({
    // Lexend fonts
    "Lexend-Thin": require("../assets/fonts/Lexend/static/Lexend-Thin.ttf"),
    "Lexend-ExtraLight": require("../assets/fonts/Lexend/static/Lexend-ExtraLight.ttf"),
    "Lexend-Light": require("../assets/fonts/Lexend/static/Lexend-Light.ttf"),
    "Lexend-Regular": require("../assets/fonts/Lexend/static/Lexend-Regular.ttf"),
    "Lexend-Medium": require("../assets/fonts/Lexend/static/Lexend-Medium.ttf"),
    "Lexend-SemiBold": require("../assets/fonts/Lexend/static/Lexend-SemiBold.ttf"),
    "Lexend-Bold": require("../assets/fonts/Lexend/static/Lexend-Bold.ttf"),
    "Lexend-ExtraBold": require("../assets/fonts/Lexend/static/Lexend-ExtraBold.ttf"),
    "Lexend-Black": require("../assets/fonts/Lexend/static/Lexend-Black.ttf"),
    // Nunito fonts
    "Nunito-ExtraLight": require("../assets/fonts/Nunito/static/Nunito-ExtraLight.ttf"),
    "Nunito-Light": require("../assets/fonts/Nunito/static/Nunito-Light.ttf"),
    "Nunito-Regular": require("../assets/fonts/Nunito/static/Nunito-Regular.ttf"),
    "Nunito-Medium": require("../assets/fonts/Nunito/static/Nunito-Medium.ttf"),
    "Nunito-SemiBold": require("../assets/fonts/Nunito/static/Nunito-SemiBold.ttf"),
    "Nunito-Bold": require("../assets/fonts/Nunito/static/Nunito-Bold.ttf"),
    "Nunito-ExtraBold": require("../assets/fonts/Nunito/static/Nunito-ExtraBold.ttf"),
    "Nunito-Black": require("../assets/fonts/Nunito/static/Nunito-Black.ttf"),
  });

  // On web, don't block on fonts so the UI always shows (fonts will apply when loaded)
  const canShowUI = fontsLoaded || fontError || Platform.OS === "web";
  if (!canShowUI) {
    return null;
  }

  const content = (
    <ThemeProvider value={SparkDarkTheme}>
      <RootLayoutNav />
      <StatusBar style="light" />
    </ThemeProvider>
  );

  const rootStyle =
    Platform.OS === "web"
      ? {
          flex: 1 as const,
          minHeight: "100vh",
          width: "100%",
          backgroundColor: "#0B0223",
        }
      : { flex: 1 as const };

  return (
    <AnimatedSplashScreen>
      <GestureHandlerRootView style={rootStyle}>
        {config.posthog_api_key ? (
          <PostHogProvider
            apiKey={config.posthog_api_key}
            options={{
              host: config.posthog_host_url,
            }}
          >
            {content}
          </PostHogProvider>
        ) : (
          content
        )}
      </GestureHandlerRootView>
    </AnimatedSplashScreen>
  );
}

