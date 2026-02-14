import React, { useState, useEffect, useCallback } from "react";
import {
  View,
  FlatList,
  StatusBar,
  RefreshControl,
  ActivityIndicator,
  Alert,
  StyleSheet,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { router } from "expo-router";
import { Typography } from "../../components/ui/Typography";
import { Button } from "../../components/ui/Button";
import {
  PostCard,
  CreatePostModal,
  UploadProgressBar,
} from "../../components/community";
import { useCommunityStore, Post } from "../../store/useCommunityStore";
import { getCurrentUserId } from "../../utils/jwt";
import { Hand } from "lucide-react-native";
import { GradientBackground } from "../../components/ui/GradientBackground";
import { LinearGradient } from "expo-linear-gradient";

const TAB_BAR_HEIGHT = 88;

export default function SocialScreen() {
  const [showCreatePost, setShowCreatePost] = useState(false);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);

  const {
    posts,
    isLoadingPosts,
    isLoadingMorePosts,
    hasMorePosts,
    postsError,
    pendingUpload,
    fetchFeedPosts,
    loadMorePosts,
    createPost,
    togglePostLike,
    deletePost,
    reportContent,
    pokeUser,
  } = useCommunityStore();

  useEffect(() => {
    getCurrentUserId().then(setCurrentUserId);
  }, []);

  useEffect(() => {
    fetchFeedPosts();
  }, [fetchFeedPosts]);

  const handleRefresh = useCallback(() => {
    fetchFeedPosts(true);
  }, [fetchFeedPosts]);

  const handleLoadMore = useCallback(() => {
    if (hasMorePosts && !isLoadingMorePosts) {
      loadMorePosts();
    }
  }, [hasMorePosts, isLoadingMorePosts, loadMorePosts]);

  const handlePostPress = useCallback((postId: string) => {
    router.push(`/community/${postId}`);
  }, []);

  const handleCreatePost = useCallback(
    (
      content: string,
      files?: { uri: string; type?: "image" | "video" | "audio" | "file" }[],
    ) => {
      createPost(content, files);
    },
    [createPost],
  );

  const handlePoke = useCallback(
    async (userId: string) => {
      const success = await pokeUser(userId);
      if (success) {
        Alert.alert("Poked! 👋", "They'll know you're interested!");
      } else {
        Alert.alert("Oops", "Couldn't send poke. Try again!");
      }
    },
    [pokeUser],
  );

  const handleReport = useCallback(
    async (postId: string) => {
      Alert.prompt(
        "Report Post",
        "Why are you reporting this post?",
        [
          { text: "Cancel", style: "cancel" },
          {
            text: "Report",
            onPress: async (reason: string | undefined) => {
              if (reason?.trim()) {
                const success = await reportContent(postId, reason);
                if (success) {
                  Alert.alert(
                    "Reported",
                    "Thanks for keeping our community safe!",
                  );
                }
              }
            },
          },
        ],
        "plain-text",
      );
    },
    [reportContent],
  );

  const handleDeletePost = useCallback(
    async (postId: string) => {
      const success = await deletePost(postId);
      if (success) {
        Alert.alert("Deleted", "Your post has been removed.");
      } else {
        Alert.alert("Error", "Couldn't delete post. Try again!");
      }
    },
    [deletePost],
  );

  const handleUserPress = useCallback((userId: string) => {
    router.push(`/user/${userId}`);
  }, []);

  const renderPost = useCallback(
    ({ item, index }: { item: Post; index: number }) => (
      <PostCard
        post={item}
        index={index}
        currentUserId={currentUserId || undefined}
        onPress={() => handlePostPress(item.id)}
        onLike={() => togglePostLike(item.id)}
        onComment={() => handlePostPress(item.id)}
        onUserPress={() => handleUserPress(item.user_id)}
        onPoke={() => handlePoke(item.user_id)}
        onReport={() => handleReport(item.id)}
        onDelete={() => handleDeletePost(item.id)}
      />
    ),
    [
      currentUserId,
      handlePostPress,
      handleUserPress,
      togglePostLike,
      handlePoke,
      handleReport,
      handleDeletePost,
    ],
  );

  const renderHeader = () => (
    <>
      <UploadProgressBar upload={pendingUpload} />

      <View className="mx-4 mt-4 mb-2">
        <LinearGradient
          colors={["rgba(30,22,54,0.95)", "rgba(16,10,40,0.6)"]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.pokeCardWrapper}
        >
          <View className="flex-row items-center">
            {/* Gradient circular avatar with Hand icon */}
            <LinearGradient
              colors={["#7C3AED", "#F472B6"]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.pokeAvatarGradient}
            >
              <View style={styles.pokeAvatarInner}>
                <Hand size={18} color="#FFF" />
              </View>
            </LinearGradient>

            <View className="flex-1 ml-3">
              <Typography variant="label" className="text-white font-semibold">
                Poke to Connect
              </Typography>
              <Typography variant="caption" className="text-white/60">
                Interested in someone? Send a quick poke to break the ice.
              </Typography>
            </View>

            {/*<TouchableOpacity
              activeOpacity={0.85}
              onPress={() => setShowCreatePost(true)}
              style={styles.pokeCTA}
            >
              <LinearGradient
                colors={["#A78BFA", "#7C3AED"]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.pokeCTAGradient}
              >
                <Typography
                  variant="label"
                  className="text-[#080314] font-semibold"
                >
                  Poke
                </Typography>
              </LinearGradient>
            </TouchableOpacity>*/}
          </View>
        </LinearGradient>
      </View>
    </>
  );

  const renderEmpty = () => {
    if (isLoadingPosts) {
      return (
        <View className="py-16 items-center">
          <ActivityIndicator size="large" color="#A78BFA" />
          <Typography variant="body" className="text-white/50 mt-4">
            Loading posts...
          </Typography>
        </View>
      );
    }

    if (postsError) {
      return (
        <View className="py-16 items-center px-8">
          <Typography variant="h3" className="text-white/70 text-center mb-2">
            Something went wrong
          </Typography>
          <Typography variant="body" className="text-white/50 text-center mb-4">
            {postsError}
          </Typography>
          <Button variant="primary" onPress={handleRefresh}>
            Try Again
          </Button>
        </View>
      );
    }

    return (
      <View className="py-16 items-center px-8">
        <Typography variant="h3" className="text-white/70 text-center mb-2">
          No posts yet
        </Typography>
        <Typography variant="body" className="text-white/50 text-center">
          Be the first to share something with the community!
        </Typography>
      </View>
    );
  };

  const renderFooter = () => {
    if (isLoadingMorePosts) {
      return (
        <View className="py-4 items-center">
          <ActivityIndicator size="small" color="#A78BFA" />
        </View>
      );
    }
    return null;
  };

  return (
    <GradientBackground>
      <SafeAreaView style={{ flex: 1 }} edges={["top", "left", "right"]}>
        <StatusBar barStyle="light-content" />

        {/* Header */}
        <View
          className="px-4 py-4 flex-row justify-between items-center"
          style={styles.headerBar}
        >
          <View>
            <Typography variant="h1" className="text-white">
              Community
            </Typography>
            <Typography variant="caption" className="text-white/50">
              Connect through shared interests
            </Typography>
          </View>
          <Button
            variant="primary"
            size="sm"
            className="h-9"
            onPress={() => setShowCreatePost(true)}
          >
            <Typography
              variant="label"
              className="text-[#080314] font-semibold"
            >
              + Post
            </Typography>
          </Button>
        </View>

        <FlatList
          data={posts}
          renderItem={renderPost}
          keyExtractor={(item) => item.id}
          ListHeaderComponent={renderHeader}
          ListEmptyComponent={renderEmpty}
          ListFooterComponent={renderFooter}
          onEndReached={handleLoadMore}
          onEndReachedThreshold={0.3}
          refreshControl={
            <RefreshControl
              refreshing={isLoadingPosts && posts.length > 0}
              onRefresh={handleRefresh}
              tintColor="#A78BFA"
              colors={["#A78BFA"]}
            />
          }
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{
            paddingBottom: TAB_BAR_HEIGHT,
          }}
          style={{ flex: 1 }}
          removeClippedSubviews
          initialNumToRender={10}
          maxToRenderPerBatch={5}
          updateCellsBatchingPeriod={50}
          windowSize={10}
        />

        <CreatePostModal
          visible={showCreatePost}
          onClose={() => setShowCreatePost(false)}
          onSubmit={handleCreatePost}
        />
      </SafeAreaView>
    </GradientBackground>
  );
}

const styles = StyleSheet.create({
  headerBar: {
    borderBottomWidth: 1,
    borderBottomColor: "rgba(255,255,255,0.04)",
    paddingBottom: 10,
  },
  pokeCardWrapper: {
    borderRadius: 14,
    padding: 12,

    backgroundColor: "rgba(30,22,54,0.55)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.03)",
    shadowColor: "#000",
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 4,
  },
  pokeAvatarGradient: {
    width: 48,
    height: 48,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  pokeAvatarInner: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(255,255,255,0.06)",
  },
  pokeCTA: {
    marginLeft: 12,
  },
  pokeCTAGradient: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
  },
});
