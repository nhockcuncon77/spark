import React from "react";
import { View, Pressable, StyleSheet } from "react-native";
import { Typography } from "../ui/Typography";
import { Heart } from "lucide-react-native";
import { LinearGradient } from "expo-linear-gradient";
import Animated, {
    FadeIn,
    useSharedValue,
    useAnimatedStyle,
    withSpring,
} from "react-native-reanimated";
import * as Haptics from "expo-haptics";

interface RatingSliderProps {
    value: number;
    onChange: (value: number) => void;
    disabled?: boolean;
}

export const RatingSlider: React.FC<RatingSliderProps> = ({
    value,
    onChange,
    disabled = false,
}) => {
    const handleSelect = (rating: number) => {
        if (disabled) return;
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        onChange(rating);
    };

    const getRatingLabel = () => {
        if (value === 0) return "Tap a heart to rate";
        if (value <= 3) return "Not a match";
        if (value <= 5) return "Could be better";
        if (value <= 7) return "Pretty good!";
        if (value <= 9) return "Amazing match!";
        return "Perfect 10! 💯";
    };

    const getRatingColor = () => {
        if (value === 0) return "#6B6B80";
        if (value <= 3) return "#FF4C6D";
        if (value <= 5) return "#FFB067";
        if (value <= 7) return "#FFD166";
        if (value <= 9) return "#B387FF";
        return "#47FFA8";
    };

    return (
        <View style={styles.container}>
            <Animated.View entering={FadeIn.duration(500)}>
                <Typography
                    variant="label"
                    className="text-center mb-4"
                    style={{ color: getRatingColor() }}
                >
                    {getRatingLabel()}
                </Typography>
            </Animated.View>

            <View style={styles.heartsRow}>
                {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((rating) => {
                    const isSelected = rating <= value;
                    const isHigh = rating >= 8;

                    return (
                        <Pressable
                            key={rating}
                            onPress={() => handleSelect(rating)}
                            disabled={disabled}
                            style={styles.heartButton}
                        >
                            <Animated.View
                                style={[
                                    styles.heartContainer,
                                    isSelected && styles.heartContainerSelected,
                                ]}
                            >
                                {isSelected ? (
                                    <LinearGradient
                                        colors={
                                            isHigh
                                                ? ["#8A3CFF", "#47FFA8"]
                                                : ["#FF4C6D", "#FFB067"]
                                        }
                                        start={{ x: 0, y: 0 }}
                                        end={{ x: 1, y: 1 }}
                                        style={styles.heartGradient}
                                    >
                                        <Heart
                                            size={20}
                                            color="#FFFFFF"
                                            fill="#FFFFFF"
                                        />
                                    </LinearGradient>
                                ) : (
                                    <View style={styles.heartEmpty}>
                                        <Heart size={20} color="#6B6B80" />
                                    </View>
                                )}
                            </Animated.View>
                            <Typography
                                variant="caption"
                                className="mt-1"
                                style={{ color: isSelected ? getRatingColor() : "#6B6B80" }}
                            >
                                {rating}
                            </Typography>
                        </Pressable>
                    );
                })}
            </View>

            {/* Rating explanation */}
            <View style={styles.explanation}>
                <Typography variant="caption" className="text-white/40 text-center">
                    Rate 8+ means you'd like to go on a date!
                </Typography>
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        paddingVertical: 16,
    },
    heartsRow: {
        flexDirection: "row",
        justifyContent: "center",
        flexWrap: "wrap",
        gap: 4,
    },
    heartButton: {
        alignItems: "center",
        padding: 4,
    },
    heartContainer: {
        width: 32,
        height: 32,
        justifyContent: "center",
        alignItems: "center",
        borderRadius: 16,
    },
    heartContainerSelected: {
        transform: [{ scale: 1.1 }],
    },
    heartGradient: {
        width: 32,
        height: 32,
        borderRadius: 16,
        justifyContent: "center",
        alignItems: "center",
    },
    heartEmpty: {
        width: 32,
        height: 32,
        justifyContent: "center",
        alignItems: "center",
        backgroundColor: "rgba(255,255,255,0.05)",
        borderRadius: 16,
        borderWidth: 1,
        borderColor: "rgba(255,255,255,0.1)",
    },
    explanation: {
        marginTop: 16,
    },
});
