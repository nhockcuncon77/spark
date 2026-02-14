import React, { useState, useEffect } from "react";
import {
  View,
  FlatList,
  Pressable,
  StatusBar,
  LayoutAnimation,
  Platform,
  UIManager,
  Image,
  ActivityIndicator,
  RefreshControl,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter, Href } from "expo-router";
import { Typography } from "../../components/ui/Typography";
import { Avatar } from "../../components/ui/Avatar";
import { Badge } from "../../components/ui/Badge";
import { Button } from "../../components/ui/Button";
import { useConnectionsStore } from "../../store/useConnectionsStore";
import {
  useActivitiesStore,
  UserProfileActivity,
} from "../../store/useActivitiesStore";
import { Connection } from "../../services/chat-service";
import {
  Lock,
  Unlock,
  Hand,
  Eye,
  MessageCircle,
  ArrowUpRight,
  ArrowDownLeft,
  RefreshCw,
  X,
} from "lucide-react-native";
import { BlurView } from "expo-blur";
import { GradientBackground } from "../../components/ui/GradientBackground";
import { MiniStreak } from "../../components/ui/StreakBadge";

// Enable LayoutAnimation for Android
if (
  Platform.OS === "android" &&
  UIManager.setLayoutAnimationEnabledExperimental
) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

type TabType = "messages" | "pokes" | "views";

export default function ChatScreen() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<TabType>("messages");
  const [pokeFilter, setPokeFilter] = useState<"received" | "sent">("received");
  const [viewFilter, setViewFilter] = useState<"viewed_you" | "you_viewed">(
    "viewed_you",
  );

  // Use Zustand stores
  const {
    connections,
    isLoading: isLoadingConnections,
    isRefreshing: isRefreshingConnections,
    error: connectionsError,
    fetchConnections,
    refresh: refreshConnections,
  } = useConnectionsStore();

  const {
    receivedActivities,
    sentActivities,
    isLoading: isLoadingActivities,
    isRefreshing: isRefreshingActivities,
    error: activitiesError,
    fetchActivities,
    refresh: refreshActivities,
    getReceivedPokes,
    getSentPokes,
    getViewedYou,
    getYouViewed,
  } = useActivitiesStore();

  // Initial fetch
  useEffect(() => {
    fetchConnections();
    fetchActivities();
  }, [fetchConnections, fetchActivities]);

  // Handle refresh for all data
  const handleRefresh = async () => {
    await Promise.all([refreshConnections(), refreshActivities()]);
  };

  const isRefreshing = isRefreshingConnections || isRefreshingActivities;

  const handleTabChange = (tab: TabType) => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setActiveTab(tab);
  };

  const handleChatPress = (chatId: string) => {
    router.push(`/chat/${chatId}` as Href);
  };

  const handleProfilePress = (userId: string) => {
    router.push(`/user/${userId}` as Href);
  };

  // Get filtered activities using store selectors
  const [receivedPokes, setReceivedPokes] = useState<UserProfileActivity[]>([]);
  const [sentPokes, setSentPokes] = useState<UserProfileActivity[]>([]);
  const [viewedYou, setViewedYou] = useState<UserProfileActivity[]>([]);
  const [youViewed, setYouViewed] = useState<UserProfileActivity[]>([]);

  useEffect(() => {
    setReceivedPokes(getReceivedPokes());
    setSentPokes(getSentPokes());
    setViewedYou(getViewedYou());
    setYouViewed(getYouViewed());
  }, [activeTab]);

  // --- Render Components ---

  const renderMessageItem = ({ item }: { item: Connection }) => {
    const profile = item.connection_profile;
    const progressPercent = item.percentage_complete;

    return (
      <Pressable
        onPress={() => handleChatPress(item.chat.id)}
        className="flex-row items-center p-4 border-b border-white/5 active:bg-white/5"
      >
        <View className="mr-4">
          <Avatar
            source={profile.pfp}
            fallback={profile.name}
            locked={!item.match.is_unlocked}
            size="md"
          />
          {profile.is_online && (
            <View className="absolute bottom-0 right-0 w-3 h-3 rounded-full bg-success border-2 border-background" />
          )}
        </View>
        <View className="flex-1 justify-center">
          <View className="flex-row justify-between items-baseline mb-1">
            <View className="flex-row items-center gap-2">
              <Typography variant="h3" className="text-base">
                {profile.name}
              </Typography>
              {item.match.streak_count && item.match.streak_count > 0 && (
                <MiniStreak
                  count={item.match.streak_count}
                  isAtRisk={item.match.streak_at_risk}
                />
              )}
              {item.percentage_complete >= 99 && !item.match.is_unlocked && (
                <Badge
                  label="Can Unlock"
                  variant="ai"
                  size="sm"
                  icon={<Unlock size={8} color="#FFD166" />}
                />
              )}
            </View>
            <Typography variant="caption" color="muted">
              {new Date(item.chat.created_at).toLocaleDateString()}
            </Typography>
          </View>
          <View className="flex-row justify-between items-center">
            <Typography
              variant="body"
              color={item.unread_messages > 0 ? "default" : "muted"}
              numberOfLines={1}
              className="flex-1 mr-4 text-sm"
            >
              {item.last_message || "Start the conversation!"}
            </Typography>
            {item.unread_messages > 0 && (
              <Badge
                label={item.unread_messages}
                variant="primary"
                size="sm"
                className="min-w-[20px] h-5 px-1.5 items-center justify-center rounded-full"
              />
            )}
          </View>

          {/* Unlock Progress */}
          {!item.match.is_unlocked && (
            <View
              className="mt-3 p-2 rounded-lg border border-white/5"
              style={{ backgroundColor: "rgba(30,22,54,0.55)" }}
            >
              {/* Header */}
              <View className="flex-row items-center justify-between mb-2">
                <View className="flex-row items-center gap-1.5">
                  <Lock size={12} color="#8E8AA8" />
                  <Typography
                    variant="caption"
                    className="font-medium text-[#CFCBDF]"
                  >
                    Unlock Photos
                  </Typography>
                </View>

                <Typography
                  variant="caption"
                  className="font-bold"
                  style={{
                    color:
                      item.percentage_complete >= 1 ? "#A78BFA" : "#6E6A85",
                  }}
                >
                  {progressPercent}%
                </Typography>
              </View>

              {/* Progress Bar */}
              <View
                className="h-1.5 rounded-full overflow-hidden"
                style={{ backgroundColor: "#1C1433" }}
              >
                <View
                  className="h-full rounded-full"
                  style={{
                    width: `${Math.min(progressPercent, 100)}%`,
                    backgroundColor:
                      item.percentage_complete >= 1
                        ? "#7C3AED"
                        : "rgba(124,58,237,0.45)",
                  }}
                />
              </View>
            </View>
          )}
        </View>
      </Pressable>
    );
  };

  const renderInteractionItem = ({
    item,
    type,
    direction,
  }: {
    item: UserProfileActivity;
    type: "poke" | "view";
    direction: "incoming" | "outgoing";
  }) => {
    const profile = item.target_user;
    const isLocked = true; // Photos are blurred by default

    return (
      <Pressable
        onPress={() => handleProfilePress(profile.id)}
        className="flex-row items-center p-4 border-b border-white/5 active:bg-white/5"
      >
        <View className="mr-4 relative">
          <View className="w-14 h-14 rounded-full overflow-hidden bg-surface-elevated border border-white/10">
            <Image
              source={{ uri: profile.pfp }}
              className="w-full h-full"
              resizeMode="cover"
            />
            {isLocked && (
              <View className="absolute inset-0 bg-primary/30 items-center justify-center overflow-hidden">
                <BlurView
                  intensity={40}
                  tint="dark"
                  className="absolute inset-0"
                />
                <Lock size={20} color="#FFFFFF" />
              </View>
            )}
          </View>
          <View className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full bg-surface border-2 border-background items-center justify-center shadow-sm">
            {type === "poke" ? (
              <Hand size={12} color="#7C3AED" />
            ) : (
              <Eye size={12} color="#3B82F6" />
            )}
          </View>
        </View>

        <View className="flex-1">
          <View className="flex-row items-center justify-between">
            <Typography variant="h3" className="text-base">
              {profile.name}
            </Typography>
            <Typography variant="caption" color="muted">
              {new Date(profile.created_at).toLocaleDateString()}
            </Typography>
          </View>
          <View className="flex-row items-center mt-1">
            {direction === "incoming" ? (
              <ArrowDownLeft
                size={14}
                color={type === "poke" ? "#7C3AED" : "#3B82F6"}
                className="mr-1"
              />
            ) : (
              <ArrowUpRight size={14} color="#A6A6B2" className="mr-1" />
            )}
            <Typography variant="body" color="muted">
              {type === "poke"
                ? direction === "incoming"
                  ? "Poked you! 👋"
                  : "You poked them"
                : direction === "incoming"
                  ? "Viewed your profile"
                  : "You viewed them"}
            </Typography>
          </View>
        </View>

        <View className="ml-2">
          <Button
            variant="outline"
            size="sm"
            className="h-8 px-3"
            onPress={() => handleProfilePress(profile.id)}
          >
            <Typography variant="label" color="primary">
              View
            </Typography>
          </Button>
        </View>
      </Pressable>
    );
  };

  // Loading component
  const LoadingView = () => (
    <View className="flex-1 items-center justify-center py-16">
      <ActivityIndicator size="large" color="#7C3AED" />
      <Typography variant="body" color="muted" className="mt-4">
        Loading...
      </Typography>
    </View>
  );

  // Error component
  const ErrorView = ({
    message,
    onRetry,
  }: {
    message: string;
    onRetry: () => void;
  }) => (
    <View className="flex-1 items-center justify-center px-8 py-16">
      <View className="w-20 h-20 rounded-full bg-surface-elevated items-center justify-center mb-4">
        <X size={40} color="#EF4444" />
      </View>
      <Typography variant="h2" className="text-center mb-2">
        Something went wrong
      </Typography>
      <Typography variant="body" color="muted" className="text-center mb-6">
        {message}
      </Typography>
      <Button variant="primary" onPress={onRetry}>
        <View className="flex-row items-center gap-2">
          <RefreshCw size={18} color="#FFFFFF" />
          <Typography className="text-white">Try Again</Typography>
        </View>
      </Button>
    </View>
  );

  return (
    <GradientBackground>
      <SafeAreaView className="flex-1">
        <StatusBar barStyle="light-content" />

        {/* Header & Tabs */}
        <View className="z-10 bg-transparent">
          <View className="px-4 py-3 border-b border-white/5">
            <Typography variant="h1" className="text-white">
              Connections
            </Typography>
          </View>

          {/* Custom Tab Bar */}
          <View className="flex-row px-2 pt-2">
            {[
              { key: "messages", label: "Messages", icon: MessageCircle },
              { key: "pokes", label: "Pokes", icon: Hand },
              { key: "views", label: "Views", icon: Eye },
            ].map((tab) => {
              const isActive = activeTab === tab.key;
              const Icon = tab.icon;
              return (
                <Pressable
                  key={tab.key}
                  onPress={() => handleTabChange(tab.key as TabType)}
                  className="flex-1 items-center py-3 relative"
                >
                  <View className="flex-row items-center gap-2 mb-1">
                    <Icon size={18} color={isActive ? "#6A1BFF" : "#A6A6B2"} />
                    <Typography
                      variant="label"
                      className={
                        isActive ? "text-primary font-bold" : "text-muted"
                      }
                    >
                      {tab.label}
                    </Typography>
                  </View>
                  {isActive && (
                    <View className="absolute bottom-0 w-full h-0.5 bg-[#6A1BFF] rounded-full shadow-[0_0_8px_#6A1BFF]" />
                  )}
                </Pressable>
              );
            })}
          </View>
        </View>

        {/* Sub-Filters */}
        {activeTab !== "messages" && (
          <View className="px-4 py-2 border-b border-white/5 flex-row gap-2">
            {activeTab === "pokes" ? (
              <>
                <Button
                  variant={pokeFilter === "received" ? "primary" : "secondary"}
                  size="sm"
                  onPress={() => setPokeFilter("received")}
                  className="h-8"
                >
                  Received
                </Button>
                <Button
                  variant={pokeFilter === "sent" ? "primary" : "secondary"}
                  size="sm"
                  onPress={() => setPokeFilter("sent")}
                  className="h-8"
                >
                  Sent
                </Button>
              </>
            ) : (
              <>
                <Button
                  variant={
                    viewFilter === "viewed_you" ? "primary" : "secondary"
                  }
                  size="sm"
                  onPress={() => setViewFilter("viewed_you")}
                  className="h-8"
                >
                  Viewed You
                </Button>
                <Button
                  variant={
                    viewFilter === "you_viewed" ? "primary" : "secondary"
                  }
                  size="sm"
                  onPress={() => setViewFilter("you_viewed")}
                  className="h-8"
                >
                  You Viewed
                </Button>
              </>
            )}
          </View>
        )}

        {/* Content Area */}
        <View className="flex-1">
          {activeTab === "messages" &&
            (connectionsError && connections.length === 0 ? (
              <ErrorView
                message={connectionsError || "An error occurred"}
                onRetry={fetchConnections}
              />
            ) : isLoadingConnections && connections.length === 0 ? (
              <LoadingView />
            ) : connections.length > 0 ? (
              <FlatList
                data={connections}
                renderItem={renderMessageItem}
                keyExtractor={(item) => item.chat.id}
                contentContainerStyle={{ paddingBottom: 20 }}
                showsVerticalScrollIndicator={false}
                refreshControl={
                  <RefreshControl
                    refreshing={isRefreshing}
                    onRefresh={handleRefresh}
                    tintColor="#6A1BFF"
                  />
                }
              />
            ) : (
              <EmptyState
                icon={MessageCircle}
                title="No Conversations Yet"
                message="Match with someone to start chatting!"
                action={() => router.push("/(tabs)/swipe" as Href)}
                actionLabel="Start Swiping"
              />
            ))}

          {activeTab === "pokes" &&
            (activitiesError &&
            receivedActivities.length === 0 &&
            sentActivities.length === 0 ? (
              <ErrorView
                message={activitiesError || "An error occurred"}
                onRetry={fetchActivities}
              />
            ) : isLoadingActivities ? (
              <LoadingView />
            ) : (
              <FlatList
                data={pokeFilter === "received" ? receivedPokes : sentPokes}
                renderItem={({ item }) =>
                  renderInteractionItem({
                    item,
                    type: "poke",
                    direction:
                      pokeFilter === "received" ? "incoming" : "outgoing",
                  })
                }
                keyExtractor={(item) => `poke-${item.id}`}
                contentContainerStyle={{ paddingBottom: 20, flexGrow: 1 }}
                showsVerticalScrollIndicator={false}
                refreshControl={
                  <RefreshControl
                    refreshing={isRefreshing}
                    onRefresh={handleRefresh}
                    tintColor="#6A1BFF"
                  />
                }
                ListEmptyComponent={
                  <EmptyState
                    icon={Hand}
                    title={
                      pokeFilter === "received"
                        ? "No Pokes Received"
                        : "No Pokes Sent"
                    }
                    message={
                      pokeFilter === "received"
                        ? "When someone pokes you, they'll appear here!"
                        : "Poke someone to let them know you're interested!"
                    }
                  />
                }
              />
            ))}

          {activeTab === "views" &&
            (activitiesError &&
            receivedActivities.length === 0 &&
            sentActivities.length === 0 ? (
              <ErrorView
                message={activitiesError || "An error occurred"}
                onRetry={fetchActivities}
              />
            ) : isLoadingActivities ? (
              <LoadingView />
            ) : (
              <FlatList
                data={viewFilter === "viewed_you" ? viewedYou : youViewed}
                renderItem={({ item }) =>
                  renderInteractionItem({
                    item,
                    type: "view",
                    direction:
                      viewFilter === "viewed_you" ? "incoming" : "outgoing",
                  })
                }
                keyExtractor={(item) => `view-${item.id}`}
                contentContainerStyle={{ paddingBottom: 20, flexGrow: 1 }}
                showsVerticalScrollIndicator={false}
                refreshControl={
                  <RefreshControl
                    refreshing={isRefreshing}
                    onRefresh={handleRefresh}
                    tintColor="#6A1BFF"
                  />
                }
                ListEmptyComponent={
                  <EmptyState
                    icon={Eye}
                    title={
                      viewFilter === "viewed_you"
                        ? "No Profile Views Yet"
                        : "You Haven't Viewed Anyone"
                    }
                    message={
                      viewFilter === "viewed_you"
                        ? "When someone views your profile, they'll show up here."
                        : "Start swiping to discover new profiles!"
                    }
                  />
                }
              />
            ))}
        </View>
      </SafeAreaView>
    </GradientBackground>
  );
}

interface EmptyStateProps {
  icon: React.ComponentType<{ size: number; color: string }>;
  title: string;
  message: string;
  action?: () => void;
  actionLabel?: string;
}

const EmptyState = ({
  icon: Icon,
  title,
  message,
  action,
  actionLabel = "Start Swiping",
}: EmptyStateProps) => (
  <View className="flex-1 items-center justify-center px-8 py-16">
    <View className="w-20 h-20 rounded-full bg-surface-elevated items-center justify-center mb-4">
      <Icon size={40} color="#7C3AED" />
    </View>
    <Typography variant="h2" className="text-center mb-2">
      {title}
    </Typography>
    <Typography variant="body" color="muted" className="text-center mb-6">
      {message}
    </Typography>
    {action && (
      <Button variant="primary" onPress={action}>
        {actionLabel}
      </Button>
    )}
  </View>
);
