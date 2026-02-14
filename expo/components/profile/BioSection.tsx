import React from "react";
import { View, Pressable, ActivityIndicator } from "react-native";
import { Typography } from "../ui/Typography";
import { GlassCard } from "../ui/GlassCard";
import { Sparkles } from "lucide-react-native";

interface BioSectionProps {
    bio: string;
    isOwnProfile?: boolean;
    onAIGenerate?: () => void;
    isGenerating?: boolean;
}

export const BioSection: React.FC<BioSectionProps> = ({
    bio,
    isOwnProfile = false,
    onAIGenerate,
    isGenerating = false,
}) => {
    return (
        <View className="px-6 mb-6">
            <View className="flex-row justify-between items-center mb-3">
                <Typography variant="h3" className="text-white">
                    Bio
                </Typography>
                {isOwnProfile && (
                    <Pressable
                        onPress={onAIGenerate}
                        disabled={isGenerating}
                        className="flex-row items-center bg-[#FFD166]/10 px-3 py-1.5 rounded-full border border-[#FFD166]/20 active:bg-[#FFD166]/20"
                    >
                        {isGenerating ? (
                            <ActivityIndicator size="small" color="#FFD166" />
                        ) : (
                            <>
                                <Sparkles size={14} color="#FFD166" />
                                <Typography variant="caption" className="ml-1.5 text-[#FFD166] font-medium">
                                    AI Rewrite
                                </Typography>
                            </>
                        )}
                    </Pressable>
                )}
            </View>
            <GlassCard className="p-4" intensity={20}>
                <Typography variant="body" className="leading-relaxed text-white/90">
                    {bio || (isOwnProfile ? "Add a bio to tell people about yourself!" : "No bio yet.")}
                </Typography>
            </GlassCard>
        </View>
    );
};
