import React, { useCallback, useMemo } from "react";
import {
  View,
  Pressable,
  Alert,
  ActionSheetIOS,
  Platform,
  ScrollView,
} from "react-native";
import { Image } from "expo-image";
import { useVideoPlayer, VideoView } from "expo-video";
import { useAudioPlayer } from "expo-audio";
import { Typography } from "../ui/Typography";
import { Avatar } from "../ui/Avatar";
import {
  Heart,
  MessageSquare,
  Eye,
  MoreHorizontal,
  Hand,
  Play,
  Pause,
  FileText,
} from "lucide-react-native";
import { Post } from "../../store/useCommunityStore";
import Animated, {
  FadeInDown,
  useAnimatedStyle,
  useSharedValue,
  withSequence,
  withSpring,
} from "react-native-reanimated";

interface PostCardProps {
  post: Post;
  index?: number;
  currentUserId?: string;
  onPress?: () => void;
  onLike?: () => void;
  onComment?: () => void;
  onUserPress?: () => void;
  onPoke?: () => void;
  onReport?: () => void;
  onDelete?: () => void;
}

interface MediaItem {
  type: "IMAGE" | "VIDEO" | "AUDIO" | "FILE";
  url: string;
}

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

// Media Item Components
const ImageMedia: React.FC<{ url: string }> = ({ url }) => (
  <Pressable onPress={(e) => e.stopPropagation()}>
    <Image
      source={{ uri: url }}
      style={{ width: 280, height: 280 }}
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
      // Disable caching for format compatibility
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
      <View className="w-[280px] h-[280px] bg-white/5 rounded-xl items-center justify-center border border-white/10">
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
          width: 280,
          height: 280,
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
      <View className="w-[280px] h-[120px] bg-white/5 rounded-xl items-center justify-center border border-white/10">
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
      <View className="w-[280px] h-[120px] bg-white/5 rounded-xl items-center justify-center border border-white/10 px-4">
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

export function PostCard({
  post,
  index = 0,
  currentUserId,
  onPress,
  onLike,
  onComment,
  onUserPress,
  onPoke,
  onReport,
  onDelete,
}: PostCardProps) {
  const likeScale = useSharedValue(1);
  const pokeScale = useSharedValue(1);
  const isOwnPost = currentUserId === post.user_id;

  // Group media by type for better organization
  const mediaGroups = useMemo(() => {
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
    onLike?.();
  }, [likeScale, onLike]);

  const handlePoke = useCallback(() => {
    pokeScale.value = withSequence(
      withSpring(1.4, { damping: 2, stiffness: 400 }),
      withSpring(1, { damping: 4, stiffness: 300 }),
    );
    onPoke?.();
  }, [pokeScale, onPoke]);

  const likeAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: likeScale.value }],
  }));

  const pokeAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: pokeScale.value }],
  }));

  const showOptions = useCallback(() => {
    const options = ["Cancel"];
    const actions: (() => void)[] = [];

    if (!isOwnPost) {
      options.push("Report");
      actions.push(() => onReport?.());
    } else {
      options.push("Delete");
      actions.push(() => {
        Alert.alert(
          "Delete Post",
          "Are you sure you want to delete this post?",
          [
            { text: "Cancel", style: "cancel" },
            {
              text: "Delete",
              style: "destructive",
              onPress: () => onDelete?.(),
            },
          ],
        );
      });
    }

    if (Platform.OS === "ios") {
      ActionSheetIOS.showActionSheetWithOptions(
        {
          options,
          cancelButtonIndex: 0,
          destructiveButtonIndex: isOwnPost ? 1 : undefined,
        },
        (buttonIndex) => {
          if (buttonIndex > 0 && actions[buttonIndex - 1]) {
            actions[buttonIndex - 1]();
          }
        },
      );
    } else {
      Alert.alert("Options", undefined, [
        { text: "Cancel", style: "cancel" },
        ...actions.map((action, i) => ({
          text: options[i + 1],
          onPress: action,
          style: (isOwnPost && i === 0 ? "destructive" : "default") as
            | "default"
            | "cancel"
            | "destructive",
        })),
      ]);
    }
  }, [isOwnPost, onReport, onDelete]);

  const renderMediaSection = (items: MediaItem[], title: string) => {
    if (items.length === 0) return null;

    return (
      <View className="mb-3">
        {items.length > 1 && (
          <Typography variant="caption" className="text-white/50 mb-2 ml-1">
            {title} ({items.length})
          </Typography>
        )}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{
            paddingRight: 16,
            gap: 12,
          }}
        >
          {items.map((item, idx) => (
            <View key={idx} className="rounded-xl overflow-hidden">
              <MediaRenderer item={item} />
            </View>
          ))}
        </ScrollView>
      </View>
    );
  };

  return (
    <Animated.View
      entering={FadeInDown.duration(300).delay(index * 50)}
      className="border-b border-white/5 bg-white/[0.02]"
    >
      <Pressable onPress={onPress} className="px-4 py-4">
        {/* Header */}
        <View className="flex-row justify-between items-start mb-3">
          <Pressable
            className="flex-row items-center flex-1"
            onPress={onUserPress}
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
                {post.user.is_online && (
                  <View className="w-2 h-2 rounded-full bg-[#14D679]" />
                )}
              </View>
              <Typography variant="caption" className="text-white/50">
                {formatTimestamp(post.created_at)}
              </Typography>
            </View>
          </Pressable>

          <Pressable onPress={showOptions} className="p-2 -mr-2">
            <MoreHorizontal size={20} color="rgba(255,255,255,0.5)" />
          </Pressable>
        </View>

        {/* Content */}
        <Typography
          variant="body"
          className="text-white/90 leading-relaxed mb-3"
        >
          {post.content}
        </Typography>

        {/* Media Sections */}
        {mediaGroups && (
          <View>
            {renderMediaSection(mediaGroups.images, "Images")}
            {renderMediaSection(mediaGroups.videos, "Videos")}
            {renderMediaSection(mediaGroups.audio, "Audio")}
            {renderMediaSection(mediaGroups.files, "Files")}
          </View>
        )}

        {/* Actions */}
        <View className="flex-row items-center gap-5 mt-1">
          {/* Like */}
          <AnimatedPressable
            onPress={handleLike}
            style={likeAnimatedStyle}
            className="flex-row items-center gap-2"
          >
            <Heart
              size={20}
              color={post.is_liked ? "#EF4444" : "rgba(255,255,255,0.5)"}
              fill={post.is_liked ? "#EF4444" : "transparent"}
            />
            <Typography
              variant="caption"
              className={post.is_liked ? "text-red-500" : "text-white/50"}
            >
              {formatCount(post.likes)}
            </Typography>
          </AnimatedPressable>

          {/* Comment */}
          <Pressable
            onPress={onComment}
            className="flex-row items-center gap-2"
          >
            <MessageSquare size={20} color="rgba(255,255,255,0.5)" />
            <Typography variant="caption" className="text-white/50">
              {formatCount(post.comments)}
            </Typography>
          </Pressable>

          {/* Views */}
          <View className="flex-row items-center gap-2">
            <Eye size={18} color="rgba(255,255,255,0.3)" />
            <Typography variant="caption" className="text-white/30">
              {formatCount(post.views)}
            </Typography>
          </View>

          {/* Poke - only for other users' posts */}
          {!isOwnPost && (
            <AnimatedPressable
              onPress={handlePoke}
              style={pokeAnimatedStyle}
              className="flex-row items-center gap-2 ml-auto"
            >
              <Hand size={18} color="#7C3AED" />
              <Typography variant="caption" className="text-[#7C3AED]">
                Poke
              </Typography>
            </AnimatedPressable>
          )}
        </View>
      </Pressable>
    </Animated.View>
  );
}

export default PostCard;
