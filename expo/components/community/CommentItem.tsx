import React, { useCallback } from "react";
import { View, Pressable, Alert, ActionSheetIOS, Platform } from "react-native";
import { Typography } from "../ui/Typography";
import { Avatar } from "../ui/Avatar";
import { Heart, CornerDownRight, MoreVertical, Trash2 } from "lucide-react-native";
import { Comment } from "../../store/useCommunityStore";
import Animated, {
    useAnimatedStyle,
    useSharedValue,
    withSequence,
    withSpring,
} from "react-native-reanimated";

interface CommentItemProps {
    comment: Comment;
    currentUserId?: string;
    onLike?: () => void;
    onReply?: () => void;
    onUserPress?: () => void;
    onDelete?: () => void;
}

function formatTimestamp(dateString: string): string {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / (1000 * 60));
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffMins < 1) return "now";
    if (diffMins < 60) return `${diffMins}m`;
    if (diffHours < 24) return `${diffHours}h`;
    if (diffDays < 7) return `${diffDays}d`;
    return date.toLocaleDateString();
}

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

export function CommentItem({
    comment,
    currentUserId,
    onLike,
    onReply,
    onUserPress,
    onDelete,
}: CommentItemProps) {
    const likeScale = useSharedValue(1);
    const isOwnComment = currentUserId === comment.user_id;

    const handleLike = useCallback(() => {
        likeScale.value = withSequence(
            withSpring(1.4, { damping: 2, stiffness: 400 }),
            withSpring(1, { damping: 4, stiffness: 300 })
        );
        onLike?.();
    }, [likeScale, onLike]);

    const likeAnimatedStyle = useAnimatedStyle(() => ({
        transform: [{ scale: likeScale.value }],
    }));

    const handleOptions = useCallback(() => {
        if (!isOwnComment) return;

        const handleDelete = () => {
            Alert.alert(
                "Delete Comment",
                "Are you sure you want to delete this comment?",
                [
                    { text: "Cancel", style: "cancel" },
                    {
                        text: "Delete",
                        style: "destructive",
                        onPress: () => onDelete?.(),
                    },
                ]
            );
        };

        if (Platform.OS === "ios") {
            ActionSheetIOS.showActionSheetWithOptions(
                {
                    options: ["Cancel", "Delete"],
                    cancelButtonIndex: 0,
                    destructiveButtonIndex: 1,
                },
                (buttonIndex) => {
                    if (buttonIndex === 1) {
                        handleDelete();
                    }
                }
            );
        } else {
            handleDelete();
        }
    }, [isOwnComment, onDelete]);

    return (
        <View className="px-4 py-3 border-b border-white/5">
            <View className="flex-row">
                <Pressable onPress={onUserPress}>
                    <Avatar
                        source={comment.user.pfp || undefined}
                        fallback={comment.user.name}
                        size="sm"
                    />
                </Pressable>

                <View className="flex-1 ml-3">
                    {/* Header */}
                    <View className="flex-row items-center justify-between">
                        <View className="flex-row items-center gap-2 flex-1">
                            <Pressable onPress={onUserPress}>
                                <Typography variant="label" className="font-bold text-white text-sm">
                                    {comment.user.name}
                                </Typography>
                            </Pressable>
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
                                <MoreVertical size={14} color="rgba(255,255,255,0.4)" />
                            </Pressable>
                        )}
                    </View>

                    {/* Reply indicator */}
                    {comment.reply_to_id && (
                        <View className="flex-row items-center gap-1 mb-1">
                            <CornerDownRight size={12} color="rgba(255,255,255,0.4)" />
                            <Typography variant="caption" className="text-white/40 text-xs">
                                replying
                            </Typography>
                        </View>
                    )}

                    {/* Content */}
                    <Typography variant="body" className="text-white/80 text-sm leading-relaxed">
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
                                color={comment.is_liked ? "#EF4444" : "rgba(255,255,255,0.4)"}
                                fill={comment.is_liked ? "#EF4444" : "transparent"}
                            />
                            {comment.likes > 0 && (
                                <Typography
                                    variant="caption"
                                    className={`text-xs ${comment.is_liked ? "text-red-500" : "text-white/40"}`}
                                >
                                    {comment.likes}
                                </Typography>
                            )}
                        </AnimatedPressable>

                        <Pressable onPress={onReply}>
                            <Typography variant="caption" className="text-white/40 text-xs font-medium">
                                Reply
                            </Typography>
                        </Pressable>
                    </View>
                </View>
            </View>
        </View>
    );
}

export default CommentItem;
