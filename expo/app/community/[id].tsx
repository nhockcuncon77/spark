import React, { useEffect, useCallback, useState, memo, useRef } from "react";
import {
  View,
  FlatList,
  TextInput,
  Pressable,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  Alert,
  ScrollView,
} from "react-native";
import { Image } from "expo-image";
import { useVideoPlayer, VideoView } from "expo-video";
import { useAudioPlayer } from "expo-audio";
import { useLocalSearchParams, router } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { Typography } from "../../components/ui/Typography";
import { Avatar } from "../../components/ui/Avatar";
import { GradientBackground } from "../../components/ui/GradientBackground";
import {
  useCommunityStore,
  Post,
  Comment,
} from "../../store/useCommunityStore";
import { getCurrentUserId } from "../../utils/jwt";
import {
  ChevronLeft,
  Heart,
  MessageSquare,
  Eye,
  Send,
  Hand,
  X,
  Play,
  Pause,
  FileText,
} from "lucide-react-native";
import Animated, {
  FadeIn,
  useAnimatedStyle,
  useSharedValue,
  withSequence,
  withSpring,
} from "react-native-reanimated";

// ============= Types =============

interface MediaItem {
  type: "IMAGE" | "VIDEO" | "AUDIO" | "FILE";
  url: string;
}

interface OptimisticPostState {
  isLiked: boolean;
  likes: number;
}

interface OptimisticCommentState {
  [commentId: string]: {
    isLiked: boolean;
    likes: number;
  };
}

// ============= Helpers =============

function formatTimestamp(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / (1000 * 60));
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffMins < 1) return "Just now";
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;
  return date.toLocaleDateString();
}

function formatCount(count: number): string {
  if (count >= 1000000) return `${(count / 1000000).toFixed(1)}M`;
  if (count >= 1000) return `${(count / 1000).toFixed(1)}K`;
  return count.toString();
}

function getFileExtension(url: string): string {
  const parts = url.split(".");
  return parts[parts.length - 1]?.toUpperCase() || "FILE";
}

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

// ============= Media Components =============

const ImageMedia: React.FC<{ url: string }> = ({ url }) => (
  <Pressable onPress={(e) => e.stopPropagation()}>
    <Image
      source={{ uri: url }}
      style={{ width: "100%", aspectRatio: 1 }}
      contentFit="cover"
      cachePolicy="disk"
      transition={200}
    />
  </Pressable>
);

const VideoMedia: React.FC<{ url: string }> = ({ url }) => {
  const [error, setError] = React.useState(false);

  const player = useVideoPlayer(
    {
      uri: url,
      useCaching: false,
    },
    (player) => {
      player.muted = false;
      player.loop = true;
      player.volume = 0.5;
    },
  );

  React.useEffect(() => {
    const subscription = player.addListener(
      "statusChange",
      ({ status, error: playerError }) => {
        if (status === "error") {
          console.error("Video error:", playerError);
          setError(true);
        } else if (status === "readyToPlay") {
          player.play();
        }
      },
    );

    return () => subscription.remove();
  }, [player, url]);

  if (error) {
    return (
      <View className="w-full aspect-video bg-white/5 rounded-xl items-center justify-center border border-white/10">
        <Typography variant="caption" className="text-red-500 text-center px-4">
          Video playback error
        </Typography>
        <Typography variant="caption" className="text-white/50 text-xs mt-1">
          Format not supported
        </Typography>
      </View>
    );
  }

  return (
    <Pressable onPress={(e) => e.stopPropagation()}>
      <View
        style={{
          width: "100%",
          aspectRatio: 16 / 9,
          backgroundColor: "#000",
          borderRadius: 12,
          overflow: "hidden",
        }}
      >
        <VideoView
          player={player}
          style={{ width: "100%", height: "100%" }}
          contentFit="contain"
          nativeControls={true}
          allowsFullscreen={true}
          allowsPictureInPicture={false}
        />
      </View>
    </Pressable>
  );
};

const AudioMedia: React.FC<{ url: string }> = ({ url }) => {
  const player = useAudioPlayer({ uri: url });
  const [isPlaying, setIsPlaying] = React.useState(false);

  const togglePlayback = useCallback(
    (e: any) => {
      e.stopPropagation();
      if (isPlaying) {
        player.pause();
      } else {
        player.play();
      }
      setIsPlaying(!isPlaying);
    },
    [isPlaying, player],
  );

  return (
    <Pressable onPress={(e) => e.stopPropagation()}>
      <View className="w-full h-[140px] bg-white/5 rounded-xl items-center justify-center border border-white/10">
        <Pressable
          onPress={togglePlayback}
          className="items-center justify-center"
        >
          <View className="w-16 h-16 rounded-full bg-[#6A1BFF] items-center justify-center mb-2">
            {isPlaying ? (
              <Pause size={32} color="white" fill="white" />
            ) : (
              <Play size={32} color="white" fill="white" />
            )}
          </View>
          <Typography variant="caption" className="text-white/70">
            Audio File
          </Typography>
        </Pressable>
      </View>
    </Pressable>
  );
};

const FileMedia: React.FC<{ url: string }> = ({ url }) => {
  const extension = getFileExtension(url);
  const fileName = url.split("/").pop() || "Unknown File";

  return (
    <Pressable onPress={(e) => e.stopPropagation()}>
      <View className="w-full h-[140px] bg-white/5 rounded-xl items-center justify-center border border-white/10 px-4">
        <FileText size={40} color="rgba(255,255,255,0.7)" />
        <Typography
          variant="caption"
          className="text-white/70 mt-2 text-center"
          numberOfLines={2}
        >
          {fileName}
        </Typography>
        <View className="mt-2 bg-white/10 px-3 py-1 rounded-full">
          <Typography variant="caption" className="text-white/50 text-xs">
            {extension}
          </Typography>
        </View>
      </View>
    </Pressable>
  );
};

const MediaRenderer: React.FC<{ item: MediaItem }> = ({ item }) => {
  switch (item.type) {
    case "IMAGE":
      return <ImageMedia url={item.url} />;
    case "VIDEO":
      return <VideoMedia url={item.url} />;
    case "AUDIO":
      return <AudioMedia url={item.url} />;
    case "FILE":
      return <FileMedia url={item.url} />;
    default:
      return null;
  }
};

// ============= Media Section Renderer =============

const MediaSection: React.FC<{
  items: MediaItem[];
  title: string;
}> = ({ items, title }) => {
  if (items.length === 0) return null;

  return (
    <View className="mb-3">
      {items.length > 1 && (
        <Typography variant="caption" className="text-white/50 mb-2 ml-1">
          {title} ({items.length})
        </Typography>
      )}
      {items.length === 1 ? (
        <View className="rounded-xl overflow-hidden">
          <MediaRenderer item={items[0]} />
        </View>
      ) : (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{
            gap: 12,
          }}
        >
          {items.map((item, idx) => (
            <View key={idx} className="rounded-xl overflow-hidden w-[280px]">
              <MediaRenderer item={item} />
            </View>
          ))}
        </ScrollView>
      )}
    </View>
  );
};

// ============= Post Header Component =============

interface PostHeaderProps {
  post: Post;
  optimisticState: OptimisticPostState;
  onLike: () => void;
  onPoke: () => void;
}

const PostHeader = memo(function PostHeader({
  post,
  optimisticState,
  onLike,
  onPoke,
}: PostHeaderProps) {
  const likeScale = useSharedValue(1);
  const pokeScale = useSharedValue(1);

  // Group media by type
  const mediaGroups = React.useMemo(() => {
    if (!post.media || post.media.length === 0) return null;

    const groups: {
      images: MediaItem[];
      videos: MediaItem[];
      audio: MediaItem[];
      files: MediaItem[];
    } = {
      images: [],
      videos: [],
      audio: [],
      files: [],
    };

    post.media.forEach((item) => {
      switch (item.type) {
        case "IMAGE":
          groups.images.push(item);
          break;
        case "VIDEO":
          groups.videos.push(item);
          break;
        case "AUDIO":
          groups.audio.push(item);
          break;
        case "FILE":
          groups.files.push(item);
          break;
      }
    });

    return groups;
  }, [post.media]);

  const handleLike = useCallback(() => {
    likeScale.value = withSequence(
      withSpring(1.3, { damping: 2, stiffness: 400 }),
      withSpring(1, { damping: 4, stiffness: 300 }),
    );
    onLike();
  }, [likeScale, onLike]);

  const handlePoke = useCallback(() => {
    pokeScale.value = withSequence(
      withSpring(1.4, { damping: 2, stiffness: 400 }),
      withSpring(1, { damping: 4, stiffness: 300 }),
    );
    onPoke();
  }, [pokeScale, onPoke]);

  const likeAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: likeScale.value }],
  }));

  const pokeAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: pokeScale.value }],
  }));

  const handleUserPress = useCallback((userId: string) => {
    router.push(`/user/${userId}`);
  }, []);

  return (
    <Animated.View
      entering={FadeIn.duration(300)}
      className="border-b border-white/10"
    >
      {/* Header */}
      <View className="flex-row items-center px-4 py-3">
        <Pressable
          className="flex-row items-center flex-1"
          onPress={() => handleUserPress(post.user_id)}
        >
          <Avatar
            source={post.user.pfp || undefined}
            fallback={post.user.name}
            size="md"
            locked={true}
            glow
          />
          <View className="ml-3 flex-1">
            <View className="flex-row items-center gap-2">
              <Typography variant="label" className="font-bold text-white">
                {post.user.name}
              </Typography>
              {post.user.is_verified && (
                <View className="w-4 h-4 rounded-full bg-[#6A1BFF] items-center justify-center">
                  <Typography className="text-[8px] text-white">✓</Typography>
                </View>
              )}
            </View>
            <Typography variant="caption" className="text-white/50">
              {formatTimestamp(post.created_at)}
            </Typography>
          </View>
        </Pressable>
      </View>

      {/* Content */}
      <View className="px-4 pb-3">
        <Typography
          variant="body"
          className="text-white leading-relaxed text-base"
        >
          {post.content}
        </Typography>
      </View>

      {/* Media Sections */}
      {mediaGroups && (
        <View className="px-4 pb-3">
          <MediaSection items={mediaGroups.images} title="Images" />
          <MediaSection items={mediaGroups.videos} title="Videos" />
          <MediaSection items={mediaGroups.audio} title="Audio" />
          <MediaSection items={mediaGroups.files} title="Files" />
        </View>
      )}

      {/* Stats */}
      <View className="flex-row items-center gap-5 px-4 py-3 border-t border-white/5">
        {/* Like */}
        <AnimatedPressable
          onPress={handleLike}
          style={likeAnimatedStyle}
          className="flex-row items-center gap-2"
        >
          <Heart
            size={22}
            color={
              optimisticState.isLiked ? "#EF4444" : "rgba(255,255,255,0.6)"
            }
            fill={optimisticState.isLiked ? "#EF4444" : "transparent"}
          />
          <Typography
            variant="label"
            className={
              optimisticState.isLiked ? "text-red-500" : "text-white/60"
            }
          >
            {formatCount(optimisticState.likes)}
          </Typography>
        </AnimatedPressable>

        {/* Comment */}
        <View className="flex-row items-center gap-2">
          <MessageSquare size={22} color="rgba(255,255,255,0.6)" />
          <Typography variant="label" className="text-white/60">
            {formatCount(post.comments)}
          </Typography>
        </View>

        {/* Views */}
        <View className="flex-row items-center gap-2">
          <Eye size={20} color="rgba(255,255,255,0.4)" />
          <Typography variant="label" className="text-white/40">
            {formatCount(post.views)}
          </Typography>
        </View>

        {/* Poke */}
        <AnimatedPressable
          onPress={handlePoke}
          style={pokeAnimatedStyle}
          className="flex-row items-center gap-2 ml-auto"
        >
          <Hand size={20} color="#7C3AED" />
          <Typography variant="label" className="text-[#7C3AED]">
            Poke
          </Typography>
        </AnimatedPressable>
      </View>

      {/* Comments Header */}
      <View className="px-4 py-3 border-t border-white/10">
        <Typography variant="h3" className="text-white font-bold">
          Comments
        </Typography>
      </View>
    </Animated.View>
  );
});

// ============= Memoized Comment Item =============
// (Keep the existing MemoizedCommentItem component as-is)

interface MemoizedCommentItemProps {
  comment: Comment;
  currentUserId?: string;
  optimisticLikes: { isLiked: boolean; likes: number };
  onLike: () => void;
  onReply: () => void;
  onDelete: () => void;
}

const MemoizedCommentItem = memo(function MemoizedCommentItem({
  comment,
  currentUserId,
  optimisticLikes,
  onLike,
  onReply,
  onDelete,
}: MemoizedCommentItemProps) {
  const likeScale = useSharedValue(1);
  const isOwnComment = currentUserId === comment.user_id;

  const handleLike = useCallback(() => {
    likeScale.value = withSequence(
      withSpring(1.4, { damping: 2, stiffness: 400 }),
      withSpring(1, { damping: 4, stiffness: 300 }),
    );
    onLike();
  }, [likeScale, onLike]);

  const likeAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: likeScale.value }],
  }));

  const handleOptions = useCallback(() => {
    if (!isOwnComment) return;
    Alert.alert(
      "Delete Comment",
      "Are you sure you want to delete this comment?",
      [
        { text: "Cancel", style: "cancel" },
        { text: "Delete", style: "destructive", onPress: onDelete },
      ],
    );
  }, [isOwnComment, onDelete]);

  const handleUserPress = useCallback((userId: string) => {
    router.push(`/user/${userId}`);
  }, []);

  return (
    <View className="px-4 py-3 border-b border-white/5">
      <View className="flex-row">
        <Pressable onPress={() => handleUserPress(comment.user_id)}>
          <Avatar
            source={comment.user.pfp || undefined}
            fallback={comment.user.name}
            size="sm"
            locked={true}
          />
        </Pressable>
        <View className="flex-1 ml-3">
          {/* Header */}
          <View className="flex-row items-center justify-between">
            <View className="flex-row items-center gap-2 flex-1">
              <Typography
                variant="label"
                className="font-bold text-white text-sm"
              >
                {comment.user.name}
              </Typography>
              {comment.user.is_verified && (
                <View className="w-3.5 h-3.5 rounded-full bg-[#6A1BFF] items-center justify-center">
                  <Typography className="text-[7px] text-white">✓</Typography>
                </View>
              )}
              <Typography variant="caption" className="text-white/40">
                {formatTimestamp(comment.created_at)}
              </Typography>
            </View>
            {isOwnComment && (
              <Pressable onPress={handleOptions} className="p-1 -mr-1">
                <Typography className="text-white/40 text-xs">⋮</Typography>
              </Pressable>
            )}
          </View>

          {/* Reply indicator */}
          {comment.reply_to_id && (
            <View className="flex-row items-center gap-1 mb-1">
              <Typography variant="caption" className="text-[#7C3AED] text-xs">
                ↩ Reply
              </Typography>
            </View>
          )}

          {/* Content */}
          <Typography
            variant="body"
            className="text-white/80 text-sm leading-relaxed mt-1"
          >
            {comment.content}
          </Typography>

          {/* Actions */}
          <View className="flex-row items-center gap-4 mt-2">
            <AnimatedPressable
              onPress={handleLike}
              style={likeAnimatedStyle}
              className="flex-row items-center gap-1.5"
            >
              <Heart
                size={14}
                color={
                  optimisticLikes.isLiked ? "#EF4444" : "rgba(255,255,255,0.4)"
                }
                fill={optimisticLikes.isLiked ? "#EF4444" : "transparent"}
              />
              {optimisticLikes.likes > 0 && (
                <Typography
                  variant="caption"
                  className={`text-xs ${optimisticLikes.isLiked ? "text-red-500" : "text-white/40"}`}
                >
                  {optimisticLikes.likes}
                </Typography>
              )}
            </AnimatedPressable>

            <Pressable onPress={onReply}>
              <Typography
                variant="caption"
                className="text-white/40 text-xs font-medium"
              >
                Reply
              </Typography>
            </Pressable>
          </View>
        </View>
      </View>
    </View>
  );
});

export default function PostDetailScreen() {
  const { id: postId } = useLocalSearchParams<{ id: string }>();
  const [commentText, setCommentText] = useState("");
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [replyingTo, setReplyingTo] = useState<Comment | null>(null);
  const inputRef = useRef<TextInput>(null);
  const hasIncrementedView = useRef(false);

  const [optimisticPostLikes, setOptimisticPostLikes] =
    useState<OptimisticPostState>({
      isLiked: false,
      likes: 0,
    });
  const [optimisticCommentLikes, setOptimisticCommentLikes] =
    useState<OptimisticCommentState>({});

  const {
    currentPost,
    comments,
    isLoadingPost,
    isLoadingComments,
    isLoadingMoreComments,
    hasMoreComments,
    fetchPost,
    fetchComments,
    loadMoreComments,
    createComment,
    togglePostLike,
    toggleCommentLike,
    incrementPostView,
    deleteComment,
    pokeUser,
    clearCurrentPost,
  } = useCommunityStore();

  useEffect(() => {
    if (currentPost) {
      setOptimisticPostLikes({
        isLiked: currentPost.is_liked,
        likes: currentPost.likes,
      });
    }
  }, [currentPost?.id]);

  useEffect(() => {
    const newCommentLikes: OptimisticCommentState = {};
    comments.forEach((comment) => {
      if (!optimisticCommentLikes[comment.id]) {
        newCommentLikes[comment.id] = {
          isLiked: comment.is_liked,
          likes: comment.likes,
        };
      }
    });
    if (Object.keys(newCommentLikes).length > 0) {
      setOptimisticCommentLikes((prev) => ({ ...prev, ...newCommentLikes }));
    }
  }, [comments.length]);

  useEffect(() => {
    getCurrentUserId().then(setCurrentUserId);
  }, []);

  useEffect(() => {
    if (postId) {
      fetchPost(postId);
      fetchComments(postId, true);

      if (!hasIncrementedView.current) {
        hasIncrementedView.current = true;
        incrementPostView(postId);
      }
    }

    return () => {
      clearCurrentPost();
    };
  }, [postId]);

  const handleBack = useCallback(() => {
    router.back();
  }, []);

  const handleAddComment = useCallback(() => {
    if (!commentText.trim() || !postId) return;
    createComment(postId, commentText.trim(), replyingTo?.id);
    setCommentText("");
    setReplyingTo(null);
  }, [commentText, postId, replyingTo, createComment]);

  const handleLoadMore = useCallback(() => {
    if (postId && hasMoreComments && !isLoadingMoreComments) {
      loadMoreComments(postId);
    }
  }, [postId, hasMoreComments, isLoadingMoreComments, loadMoreComments]);

  const handlePostLike = useCallback(() => {
    if (!currentPost) return;

    setOptimisticPostLikes((prev) => ({
      isLiked: !prev.isLiked,
      likes: prev.isLiked ? prev.likes - 1 : prev.likes + 1,
    }));

    togglePostLike(currentPost.id);
  }, [currentPost?.id, togglePostLike]);

  const handlePoke = useCallback(async () => {
    if (!currentPost) return;
    const success = await pokeUser(currentPost.user_id);
    if (success) {
      Alert.alert("Poked! 👋", "They'll know you're interested!");
    }
  }, [currentPost?.user_id, pokeUser]);

  const handleReply = useCallback((comment: Comment) => {
    setReplyingTo(comment);
    inputRef.current?.focus();
  }, []);

  const handleCancelReply = useCallback(() => {
    setReplyingTo(null);
  }, []);

  const handleDeleteComment = useCallback(
    async (commentId: string) => {
      if (!postId) return;
      await deleteComment(commentId, postId);
    },
    [postId, deleteComment],
  );

  const handleCommentLike = useCallback(
    (commentId: string) => {
      setOptimisticCommentLikes((prev) => {
        const current = prev[commentId] || { isLiked: false, likes: 0 };
        return {
          ...prev,
          [commentId]: {
            isLiked: !current.isLiked,
            likes: current.isLiked ? current.likes - 1 : current.likes + 1,
          },
        };
      });

      toggleCommentLike(commentId);
    },
    [toggleCommentLike],
  );

  const renderComment = useCallback(
    ({ item }: { item: Comment }) => {
      const optimisticLikes = optimisticCommentLikes[item.id] || {
        isLiked: item.is_liked,
        likes: item.likes,
      };

      return (
        <MemoizedCommentItem
          comment={item}
          currentUserId={currentUserId || undefined}
          optimisticLikes={optimisticLikes}
          onLike={() => handleCommentLike(item.id)}
          onReply={() => handleReply(item)}
          onDelete={() => handleDeleteComment(item.id)}
        />
      );
    },
    [
      currentUserId,
      optimisticCommentLikes,
      handleCommentLike,
      handleReply,
      handleDeleteComment,
    ],
  );

  const renderHeader = useCallback(() => {
    if (!currentPost) return null;
    return (
      <PostHeader
        post={currentPost}
        optimisticState={optimisticPostLikes}
        onLike={handlePostLike}
        onPoke={handlePoke}
      />
    );
  }, [currentPost, optimisticPostLikes, handlePostLike, handlePoke]);

  const renderEmpty = useCallback(() => {
    if (isLoadingComments) {
      return (
        <View className="py-8 items-center">
          <ActivityIndicator size="small" color="#6A1BFF" />
        </View>
      );
    }
    return (
      <View className="py-8 items-center">
        <Typography variant="body" className="text-white/50">
          No comments yet. Be the first!
        </Typography>
      </View>
    );
  }, [isLoadingComments]);

  const renderFooter = useCallback(() => {
    if (isLoadingMoreComments) {
      return (
        <View className="py-4 items-center">
          <ActivityIndicator size="small" color="#6A1BFF" />
        </View>
      );
    }
    return null;
  }, [isLoadingMoreComments]);

  const keyExtractor = useCallback((item: Comment) => item.id, []);

  if (isLoadingPost && !currentPost) {
    return (
      <GradientBackground>
        <SafeAreaView className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" color="#6A1BFF" />
        </SafeAreaView>
      </GradientBackground>
    );
  }

  if (!currentPost && !isLoadingPost) {
    return (
      <GradientBackground>
        <SafeAreaView className="flex-1 items-center justify-center">
          <Typography variant="h3" className="text-white/70">
            Post not found
          </Typography>
          <Pressable onPress={handleBack} className="mt-4">
            <Typography variant="label" className="text-[#6A1BFF]">
              Go Back
            </Typography>
          </Pressable>
        </SafeAreaView>
      </GradientBackground>
    );
  }

  return (
    <GradientBackground>
      <SafeAreaView className="flex-1" edges={["top"]}>
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          className="flex-1"
        >
          <View className="flex-row items-center px-4 py-3 border-b border-white/10">
            <Pressable
              onPress={handleBack}
              className="p-2 -ml-2 rounded-full active:bg-white/10"
            >
              <ChevronLeft size={24} color="#FFF" />
            </Pressable>
            <Typography variant="h3" className="ml-2 text-white font-bold">
              Post
            </Typography>
          </View>

          <FlatList
            data={comments}
            renderItem={renderComment}
            keyExtractor={keyExtractor}
            ListHeaderComponent={renderHeader}
            ListEmptyComponent={renderEmpty}
            ListFooterComponent={renderFooter}
            onEndReached={handleLoadMore}
            onEndReachedThreshold={0.3}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={{ paddingBottom: 100 }}
            removeClippedSubviews
            maxToRenderPerBatch={10}
            windowSize={10}
          />

          {replyingTo && (
            <View className="px-4 py-2 bg-[#6A1BFF]/10 border-t border-[#6A1BFF]/30 flex-row items-center">
              <Typography variant="caption" className="text-[#7C3AED] flex-1">
                ↩ Replying to {replyingTo.user.name}
              </Typography>
              <Pressable onPress={handleCancelReply} className="p-1">
                <X size={16} color="#7C3AED" />
              </Pressable>
            </View>
          )}

          <View className="px-4 py-3 border-t border-white/10 bg-black/40 pb-6">
            <View className="flex-row items-center gap-3">
              <View className="flex-1 flex-row items-center bg-white/5 rounded-full px-4 py-2 border border-white/10">
                <TextInput
                  ref={inputRef}
                  value={commentText}
                  onChangeText={setCommentText}
                  placeholder={
                    replyingTo
                      ? `Reply to ${replyingTo.user.name}...`
                      : "Add a comment..."
                  }
                  placeholderTextColor="rgba(255,255,255,0.4)"
                  className="flex-1 text-white text-base py-1"
                  multiline
                  maxLength={500}
                />
              </View>
              <Pressable
                onPress={handleAddComment}
                disabled={!commentText.trim()}
                className={`w-10 h-10 rounded-full items-center justify-center ${
                  commentText.trim() ? "bg-[#6A1BFF]" : "bg-white/10"
                }`}
              >
                <Send
                  size={18}
                  color={commentText.trim() ? "#FFF" : "rgba(255,255,255,0.3)"}
                />
              </Pressable>
            </View>
          </View>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </GradientBackground>
  );
}
