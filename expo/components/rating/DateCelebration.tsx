import React, { useEffect } from "react";
import { View, StyleSheet, Dimensions } from "react-native";
import { Typography } from "../ui/Typography";
import { Avatar } from "../ui/Avatar";
import { Heart, PartyPopper } from "lucide-react-native";
import { LinearGradient } from "expo-linear-gradient";
import Animated, {
    FadeIn,
    FadeInUp,
    ZoomIn,
    useSharedValue,
    useAnimatedStyle,
    withRepeat,
    withSequence,
    withTiming,
    withDelay,
    Easing,
} from "react-native-reanimated";
import * as Haptics from "expo-haptics";
import ConfettiCannon from "react-native-confetti-cannon";

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get("window");

interface DateCelebrationProps {
    myPhoto?: string;
    myName: string;
    theirPhoto?: string;
    theirName: string;
    onContinue: () => void;
}

export const DateCelebration: React.FC<DateCelebrationProps> = ({
    myPhoto,
    myName,
    theirPhoto,
    theirName,
    onContinue,
}) => {
    // Pulsing heart animation
    const heartScale = useSharedValue(1);
    const heartOpacity = useSharedValue(0.6);

    useEffect(() => {
        // Trigger celebration haptic
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

        // Start pulse animation
        heartScale.value = withRepeat(
            withSequence(
                withTiming(1.2, { duration: 600, easing: Easing.inOut(Easing.ease) }),
                withTiming(1, { duration: 600, easing: Easing.inOut(Easing.ease) })
            ),
            -1,
            true
        );

        heartOpacity.value = withRepeat(
            withSequence(
                withTiming(1, { duration: 600 }),
                withTiming(0.6, { duration: 600 })
            ),
            -1,
            true
        );
    }, []);

    const heartStyle = useAnimatedStyle(() => ({
        transform: [{ scale: heartScale.value }],
        opacity: heartOpacity.value,
    }));

    return (
        <View style={styles.container}>
            {/* Confetti */}
            <ConfettiCannon
                count={100}
                origin={{ x: SCREEN_WIDTH / 2, y: 0 }}
                autoStart
                fadeOut
                colors={["#8A3CFF", "#B387FF", "#47FFA8", "#FFD166", "#FF4C6D"]}
                explosionSpeed={350}
                fallSpeed={3000}
            />

            {/* Content */}
            <View style={styles.content}>
                {/* Title */}
                <Animated.View
                    entering={ZoomIn.duration(600)}
                    style={styles.titleContainer}
                >
                    <LinearGradient
                        colors={["#8A3CFF", "#47FFA8"]}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 0 }}
                        style={styles.titleGradient}
                    >
                        <PartyPopper size={28} color="#FFFFFF" />
                        <Typography variant="h1" className="text-white text-3xl font-bold ml-3">
                            It's a Date!
                        </Typography>
                    </LinearGradient>
                </Animated.View>

                {/* Avatars with heart */}
                <Animated.View
                    entering={FadeInUp.duration(800).delay(300)}
                    style={styles.avatarsContainer}
                >
                    {/* My Avatar */}
                    <View style={styles.avatarWrapper}>
                        <LinearGradient
                            colors={["#8A3CFF", "#B387FF"]}
                            style={styles.avatarBorder}
                        >
                            <View style={styles.avatarInner}>
                                <Avatar source={myPhoto} fallback={myName} size="xl" />
                            </View>
                        </LinearGradient>
                        <Typography variant="label" className="text-white mt-2">
                            You
                        </Typography>
                    </View>

                    {/* Connecting Heart */}
                    <Animated.View style={[styles.heartContainer, heartStyle]}>
                        <LinearGradient
                            colors={["#FF4C6D", "#FFB067"]}
                            style={styles.heartGradient}
                        >
                            <Heart size={28} color="#FFFFFF" fill="#FFFFFF" />
                        </LinearGradient>
                    </Animated.View>

                    {/* Their Avatar */}
                    <View style={styles.avatarWrapper}>
                        <LinearGradient
                            colors={["#47FFA8", "#8A3CFF"]}
                            style={styles.avatarBorder}
                        >
                            <View style={styles.avatarInner}>
                                <Avatar source={theirPhoto} fallback={theirName} size="xl" />
                            </View>
                        </LinearGradient>
                        <Typography variant="label" className="text-white mt-2">
                            {theirName}
                        </Typography>
                    </View>
                </Animated.View>

                {/* Message */}
                <Animated.View
                    entering={FadeIn.duration(600).delay(600)}
                    style={styles.messageContainer}
                >
                    <Typography variant="body" className="text-white/70 text-center leading-6">
                        You both rated each other 8 or above!{"\n"}
                        Time to plan something special 💜
                    </Typography>
                </Animated.View>

                {/* Continue Button */}
                <Animated.View
                    entering={FadeInUp.duration(600).delay(900)}
                    style={styles.buttonContainer}
                >
                    <LinearGradient
                        colors={["#8A3CFF", "#B387FF"]}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 0 }}
                        style={styles.button}
                    >
                        <Typography
                            className="text-white font-bold text-base"
                            onPress={onContinue}
                        >
                            Continue Chatting 💬
                        </Typography>
                    </LinearGradient>
                </Animated.View>
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: "#080017",
        justifyContent: "center",
        alignItems: "center",
    },
    content: {
        alignItems: "center",
        paddingHorizontal: 24,
    },
    titleContainer: {
        marginBottom: 40,
    },
    titleGradient: {
        flexDirection: "row",
        alignItems: "center",
        paddingHorizontal: 24,
        paddingVertical: 16,
        borderRadius: 20,
    },
    avatarsContainer: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "center",
        marginBottom: 32,
    },
    avatarWrapper: {
        alignItems: "center",
    },
    avatarBorder: {
        padding: 4,
        borderRadius: 100,
    },
    avatarInner: {
        backgroundColor: "#080017",
        padding: 3,
        borderRadius: 100,
    },
    heartContainer: {
        marginHorizontal: -20,
        zIndex: 10,
    },
    heartGradient: {
        width: 56,
        height: 56,
        borderRadius: 28,
        justifyContent: "center",
        alignItems: "center",
        borderWidth: 4,
        borderColor: "#080017",
    },
    messageContainer: {
        marginBottom: 32,
        paddingHorizontal: 20,
    },
    buttonContainer: {
        width: "100%",
    },
    button: {
        paddingVertical: 16,
        borderRadius: 16,
        alignItems: "center",
        justifyContent: "center",
    },
});
