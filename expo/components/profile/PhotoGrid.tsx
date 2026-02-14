import React from "react";
import { View, ScrollView, Pressable } from "react-native";
import { Image } from "expo-image";
import { Lock } from "lucide-react-native";
import { Typography } from "../ui/Typography";
import { BlurView } from "expo-blur";

interface PhotoGridProps {
    photos: string[];
    isLocked?: boolean;
    onPhotoPress?: (photo: string) => void;
    onUnlockPress?: () => void;
}

export const PhotoGrid: React.FC<PhotoGridProps> = ({
    photos,
    isLocked = false,
    onPhotoPress,
    onUnlockPress,
}) => {
    if (!photos || photos.length === 0) return null;

    return (
        <View className="px-6 mb-6">
            <Typography variant="h3" className="mb-3 text-white">
                Photos
            </Typography>
            <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={{ gap: 12 }}
            >
                {photos.map((photo, index) => (
                    <Pressable
                        key={index}
                        onPress={() => isLocked ? onUnlockPress?.() : onPhotoPress?.(photo)}
                        className="relative"
                    >
                        <Image
                            source={photo}
                            style={{ width: 140, height: 180, borderRadius: 12 }}
                            contentFit="cover"
                            transition={200}
                        />
                        {isLocked && index > 0 && ( // First photo might be visible or blurred depending on specific business rule, assuming main profile always visible but gallery locked? Prompt says "locked photos show gaussian blur". Let's blur all except maybe avatar which is in header.
                            <View className="absolute inset-0 items-center justify-center rounded-xl overflow-hidden">
                                <BlurView intensity={20} tint="dark" className="absolute inset-0" />
                                <View className="bg-black/60 p-3 rounded-full">
                                    <Lock size={20} color="#A6A6B2" />
                                </View>
                            </View>
                        )}
                    </Pressable>
                ))}
                {/* Add Photo Placeholder if empty or just at end? For read-only, probably not. */}
            </ScrollView>
        </View>
    );
};
