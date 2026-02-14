import React, { useState, useEffect } from "react";
import {
    View,
    ScrollView,
    StyleSheet,
    Pressable,
    ActivityIndicator,
    Alert,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useLocalSearchParams, router } from "expo-router";
import { Typography } from "../../components/ui/Typography";
import { ChevronLeft, X } from "lucide-react-native";
import { GradientBackground } from "../../components/ui/GradientBackground";
import { LinearGradient } from "expo-linear-gradient";
import { RatingSlider } from "../../components/rating/RatingSlider";
import { ProfileReveal } from "../../components/rating/ProfileReveal";
import { DateCelebration } from "../../components/rating/DateCelebration";
import { chatService, Connection } from "../../services/chat-service";
import { useStore } from "../../store/useStore";
import Animated, { FadeIn, FadeInUp, SlideInDown } from "react-native-reanimated";
import * as Haptics from "expo-haptics";

type RatingState = "rating" | "waiting" | "celebration" | "no-date";

export default function RatingScreen() {
    const { chatId } = useLocalSearchParams<{ chatId: string }>();
    const { user } = useStore();

    const [connection, setConnection] = useState<Connection | null>(null);
    const [rating, setRating] = useState(0);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [ratingState, setRatingState] = useState<RatingState>("rating");
    const [isLoading, setIsLoading] = useState(true);

    // Fetch connection data
    useEffect(() => {
        const fetchConnection = async () => {
            try {
                const result = await chatService.getMyConnections();
                if (result.success && result.connections) {
                    const conn = result.connections.find((c) => c.chat.id === chatId);
                    if (conn) {
                        setConnection(conn);

                        // Check if we already have ratings
                        const postRating = conn.match.post_unlock_rating;
                        if (postRating.she_rating > 0 && postRating.he_rating > 0) {
                            // Both have rated
                            if (postRating.she_rating >= 8 && postRating.he_rating >= 8) {
                                setRatingState("celebration");
                            } else {
                                setRatingState("no-date");
                            }
                        }
                    }
                }
            } catch (error) {
                console.error("Failed to fetch connection:", error);
            } finally {
                setIsLoading(false);
            }
        };
        fetchConnection();
    }, [chatId]);

    const handleRatingChange = (value: number) => {
        setRating(value);
        if (value >= 8) {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
        }
    };

    const handleSubmitRating = async () => {
        if (rating === 0) {
            Alert.alert("Select a Rating", "Please select a rating from 1-10 before submitting.");
            return;
        }

        setIsSubmitting(true);
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);

        // TODO: Call backend mutation to submit rating
        // For now, we'll simulate the response
        setTimeout(() => {
            setIsSubmitting(false);

            // Simulate checking if both have rated 8+
            // In real implementation, this would come from the backend response
            if (rating >= 8) {
                // Simulate that the other person also rated 8+
                setRatingState("celebration");
            } else {
                // Go back to chat
                handleClose();
            }
        }, 1500);
    };

    const handleClose = () => {
        router.back();
    };

    const handleContinueChatting = () => {
        router.back();
    };

    if (isLoading) {
        return (
            <GradientBackground>
                <SafeAreaView className="flex-1 items-center justify-center">
                    <ActivityIndicator size="large" color="#8A3CFF" />
                    <Typography variant="body" className="mt-4 text-white/60">
                        Loading profile...
                    </Typography>
                </SafeAreaView>
            </GradientBackground>
        );
    }

    // Show celebration screen
    if (ratingState === "celebration" && connection) {
        return (
            <DateCelebration
                myPhoto={user?.photos?.[0]}
                myName={user?.firstName || "You"}
                theirPhoto={connection.connection_profile.pfp}
                theirName={connection.connection_profile.name}
                onContinue={handleContinueChatting}
            />
        );
    }

    // Show no-date message
    if (ratingState === "no-date") {
        return (
            <GradientBackground>
                <SafeAreaView className="flex-1 items-center justify-center px-6">
                    <Typography variant="h2" className="text-white text-center mb-4">
                        Thanks for your rating!
                    </Typography>
                    <Typography variant="body" className="text-white/60 text-center mb-8">
                        Unfortunately, the feelings weren't mutual this time. Keep chatting or find more matches!
                    </Typography>
                    <Pressable onPress={handleClose}>
                        <LinearGradient
                            colors={["#8A3CFF", "#B387FF"]}
                            style={styles.button}
                        >
                            <Typography className="text-white font-bold">
                                Continue
                            </Typography>
                        </LinearGradient>
                    </Pressable>
                </SafeAreaView>
            </GradientBackground>
        );
    }

    const profile = connection?.connection_profile;

    return (
        <GradientBackground>
            <SafeAreaView className="flex-1" edges={["top"]}>
                {/* Header */}
                <Animated.View
                    entering={FadeIn.duration(400)}
                    style={styles.header}
                >
                    <Pressable
                        onPress={handleClose}
                        className="p-2 rounded-full bg-white/10 active:bg-white/20"
                    >
                        <X size={24} color="#E6E6F0" />
                    </Pressable>
                    <Typography variant="h2" className="text-white text-xl font-bold flex-1 text-center mr-10">
                        Rate Your Match
                    </Typography>
                </Animated.View>

                <ScrollView
                    showsVerticalScrollIndicator={false}
                    contentContainerStyle={styles.scrollContent}
                >
                    {/* Profile Reveal */}
                    {profile && (
                        <ProfileReveal
                            profile={{
                                name: profile.name,
                                bio: profile.bio,
                                photos: profile.photos,
                                hobbies: profile.hobbies,
                                interests: profile.interests,
                                isVerified: profile.is_verified,
                                extra: profile.extra,
                            }}
                        />
                    )}

                    {/* Rating Section */}
                    <Animated.View
                        entering={SlideInDown.duration(600).delay(400)}
                        style={styles.ratingSection}
                    >
                        <View style={styles.ratingCard}>
                            <Typography variant="h3" className="text-white text-center mb-2">
                                How do you feel about {profile?.name || "them"}?
                            </Typography>
                            <Typography variant="caption" className="text-white/50 text-center mb-4">
                                Be honest! If you both rate 8 or higher, it's a date! 💜
                            </Typography>

                            <RatingSlider
                                value={rating}
                                onChange={handleRatingChange}
                                disabled={isSubmitting}
                            />

                            {/* Submit Button */}
                            <View className="mt-6">
                                <Pressable
                                    onPress={handleSubmitRating}
                                    disabled={rating === 0 || isSubmitting}
                                >
                                    <LinearGradient
                                        colors={
                                            rating === 0 || isSubmitting
                                                ? ["#3D2066", "#3D2066"]
                                                : ["#8A3CFF", "#B387FF"]
                                        }
                                        style={styles.submitButton}
                                    >
                                        {isSubmitting ? (
                                            <ActivityIndicator color="#FFFFFF" size="small" />
                                        ) : (
                                            <Typography className="text-white font-bold text-base">
                                                Submit Rating
                                            </Typography>
                                        )}
                                    </LinearGradient>
                                </Pressable>
                            </View>
                        </View>
                    </Animated.View>
                </ScrollView>
            </SafeAreaView>
        </GradientBackground>
    );
}

const styles = StyleSheet.create({
    header: {
        flexDirection: "row",
        alignItems: "center",
        paddingHorizontal: 16,
        paddingVertical: 12,
    },
    scrollContent: {
        paddingBottom: 40,
    },
    ratingSection: {
        paddingHorizontal: 24,
        paddingTop: 24,
    },
    ratingCard: {
        backgroundColor: "rgba(26, 1, 56, 0.8)",
        borderRadius: 24,
        padding: 24,
        borderWidth: 1,
        borderColor: "rgba(255,255,255,0.08)",
    },
    submitButton: {
        paddingVertical: 16,
        borderRadius: 16,
        alignItems: "center",
        justifyContent: "center",
    },
    button: {
        paddingHorizontal: 32,
        paddingVertical: 14,
        borderRadius: 16,
    },
});
