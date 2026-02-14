import React from "react";
import { View } from "react-native";
import Animated, {
    useAnimatedStyle,
    useSharedValue,
    withTiming,
    withRepeat,
    withSequence,
} from "react-native-reanimated";
import { Typography } from "../ui/Typography";
import { PendingUpload } from "../../store/useCommunityStore";
import { useEffect } from "react";

interface UploadProgressBarProps {
    upload: PendingUpload | null;
}

export function UploadProgressBar({ upload }: UploadProgressBarProps) {
    const shimmerPosition = useSharedValue(0);

    useEffect(() => {
        if (upload && upload.status === "uploading") {
            shimmerPosition.value = withRepeat(
                withSequence(
                    withTiming(1, { duration: 1000 }),
                    withTiming(0, { duration: 0 })
                ),
                -1,
                false
            );
        }
    }, [upload, shimmerPosition]);

    const shimmerStyle = useAnimatedStyle(() => ({
        transform: [{ translateX: shimmerPosition.value * 200 - 100 }],
    }));

    if (!upload || upload.status === "done") return null;

    const isError = upload.status === "error";
    const isCreating = upload.status === "creating";

    return (
        <View className="px-4 py-2 bg-black/40 border-b border-white/10">
            <View className="flex-row items-center justify-between mb-1.5">
                <Typography variant="caption" className="text-white/70 font-medium">
                    {isError
                        ? "Upload failed"
                        : isCreating
                            ? "Creating post..."
                            : `Uploading... ${upload.progress}%`}
                </Typography>
                {isError && (
                    <Typography variant="caption" className="text-red-400 text-xs">
                        {upload.error}
                    </Typography>
                )}
            </View>

            {/* Progress bar */}
            <View className="h-1 bg-white/10 rounded-full overflow-hidden">
                <View
                    className={`h-full rounded-full ${isError ? "bg-red-500" : "bg-[#6A1BFF]"
                        }`}
                    style={{ width: `${upload.progress}%` }}
                >
                    {!isError && !isCreating && (
                        <Animated.View
                            className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent"
                            style={[shimmerStyle, { width: 100 }]}
                        />
                    )}
                </View>
            </View>
        </View>
    );
}

export default UploadProgressBar;
