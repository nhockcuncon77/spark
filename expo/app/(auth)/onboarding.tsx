import React, { useState, useRef } from "react";
import {
    View,
    Dimensions,
    FlatList,
    Pressable,
    StyleSheet,
    NativeScrollEvent,
    NativeSyntheticEvent,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter, Href } from "expo-router";
import { Typography } from "../../components/ui/Typography";
import { GradientBackground } from "../../components/ui/GradientBackground";
import { LinearGradient } from "expo-linear-gradient";
import Animated, {
    FadeIn,
    FadeInUp,
    useSharedValue,
    useAnimatedStyle,
    withRepeat,
    withSequence,
    withTiming,
    Easing,
    interpolate,
} from "react-native-reanimated";
import {
    Users,
    MessageCircle,
    Star,
    Sparkles,
    Shield,
    Lock,
    Heart,
    Zap,
} from "lucide-react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get("window");

const ONBOARDING_KEY = "@spark_onboarding_complete";

interface OnboardingSlide {
    id: string;
    headline: string;
    subtext: string;
    icon: React.ReactNode;
    gradient: [string, string];
}

const slides: OnboardingSlide[] = [
    {
        id: "1",
        headline: "Meet the person first.",
        subtext: "Spark hides photos until you've connected through personality and conversation.",
        icon: <Users size={48} color="#FFFFFF" />,
        gradient: ["#7C3AED", "#8B5CF6"],
    },
    {
        id: "2",
        headline: "Match by vibes.",
        subtext: "Discover people through hobbies, interests, and personality—not pictures.",
        icon: <Heart size={48} color="#FFFFFF" />,
        gradient: ["#8B5CF6", "#A78BFA"],
    },
    {
        id: "3",
        headline: "Looks unlock after real connection.",
        subtext: "Exchange meaningful messages. When both agree, photos reveal.",
        icon: <Lock size={48} color="#FFFFFF" />,
        gradient: ["#7C3AED", "#6D28D9"],
    },
    {
        id: "4",
        headline: "Connections, not swipes.",
        subtext: "After revealing, rate your match to help find your type.",
        icon: <Star size={48} color="#FFFFFF" />,
        gradient: ["#6D28D9", "#7C3AED"],
    },
    {
        id: "5",
        headline: "Your AI Match Guide",
        subtext: "AI bio generator, conversation coach, and a guide who learns your preferences.",
        icon: <Sparkles size={48} color="#FFD166" />,
        gradient: ["#7C3AED", "#8B5CF6"],
    },
    {
        id: "6",
        headline: "Verify. Trust. Connect.",
        subtext: "Strict identity checks keep Spark authentic and safe.",
        icon: <Shield size={48} color="#47FFA8" />,
        gradient: ["#6D28D9", "#7C3AED"],
    },
];

// Abstract visual component for each slide
const SlideVisual = ({ slide, isActive }: { slide: OnboardingSlide; isActive: boolean }) => {
    const pulseScale = useSharedValue(1);

    React.useEffect(() => {
        if (isActive) {
            pulseScale.value = withRepeat(
                withSequence(
                    withTiming(1.1, { duration: 1500, easing: Easing.inOut(Easing.ease) }),
                    withTiming(1, { duration: 1500, easing: Easing.inOut(Easing.ease) })
                ),
                -1,
                true
            );
        }
    }, [isActive]);

    const animatedStyle = useAnimatedStyle(() => ({
        transform: [{ scale: pulseScale.value }],
    }));

    return (
        <View style={styles.visualContainer}>
            {/* Glow background */}
            <Animated.View style={[styles.glowOuter, animatedStyle]}>
                <LinearGradient
                    colors={[`${slide.gradient[0]}40`, `${slide.gradient[1]}20`, "transparent"]}
                    style={styles.glowGradient}
                />
            </Animated.View>

            {/* Icon container */}
            <LinearGradient
                colors={slide.gradient}
                style={styles.iconContainer}
            >
                {slide.icon}
            </LinearGradient>

            {/* Decorative elements */}
            <View style={[styles.floatingDot, { top: 20, left: 40 }]}>
                <View style={[styles.dot, { backgroundColor: slide.gradient[0] }]} />
            </View>
            <View style={[styles.floatingDot, { top: 60, right: 30 }]}>
                <View style={[styles.dot, { backgroundColor: slide.gradient[1], width: 8, height: 8 }]} />
            </View>
            <View style={[styles.floatingDot, { bottom: 40, left: 60 }]}>
                <View style={[styles.dot, { backgroundColor: slide.gradient[0], width: 6, height: 6 }]} />
            </View>
        </View>
    );
};

export default function OnboardingScreen() {
    const router = useRouter();
    const flatListRef = useRef<FlatList>(null);
    const [currentIndex, setCurrentIndex] = useState(0);

    const handleScroll = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
        const offsetX = event.nativeEvent.contentOffset.x;
        const index = Math.round(offsetX / SCREEN_WIDTH);
        setCurrentIndex(index);
    };

    const handleNext = () => {
        if (currentIndex < slides.length - 1) {
            flatListRef.current?.scrollToIndex({
                index: currentIndex + 1,
                animated: true,
            });
        } else {
            handleComplete();
        }
    };

    const handleSkip = () => {
        handleComplete();
    };

    const handleComplete = async () => {
        await AsyncStorage.setItem(ONBOARDING_KEY, "true");
        router.push("/(auth)/signup" as Href);
    };

    const renderSlide = ({ item, index }: { item: OnboardingSlide; index: number }) => (
        <View style={styles.slide}>
            <SlideVisual slide={item} isActive={index === currentIndex} />

            <Animated.View
                entering={FadeInUp.duration(600).delay(200)}
                style={styles.textContainer}
            >
                <Typography
                    variant="h1"
                    className="text-white text-center text-3xl mb-4"
                    style={{ fontWeight: "700", letterSpacing: -0.5 }}
                >
                    {item.headline}
                </Typography>
                <Typography
                    variant="body"
                    className="text-white/60 text-center leading-7 px-6"
                    style={{ fontSize: 16 }}
                >
                    {item.subtext}
                </Typography>
            </Animated.View>
        </View>
    );

    const isLastSlide = currentIndex === slides.length - 1;

    return (
        <GradientBackground>
            <SafeAreaView className="flex-1">
                {/* Skip button */}
                <View style={styles.header}>
                    <Pressable onPress={handleSkip} style={styles.skipButton}>
                        <Typography variant="label" className="text-white/50">
                            Skip
                        </Typography>
                    </Pressable>
                </View>

                {/* Slides */}
                <FlatList
                    ref={flatListRef}
                    data={slides}
                    renderItem={renderSlide}
                    keyExtractor={(item) => item.id}
                    horizontal
                    pagingEnabled
                    showsHorizontalScrollIndicator={false}
                    onScroll={handleScroll}
                    scrollEventThrottle={16}
                    getItemLayout={(_, index) => ({
                        length: SCREEN_WIDTH,
                        offset: SCREEN_WIDTH * index,
                        index,
                    })}
                />

                {/* Bottom section */}
                <View style={styles.footer}>
                    {/* Dot indicators */}
                    <View style={styles.dotsContainer}>
                        {slides.map((_, index) => (
                            <View
                                key={index}
                                style={[
                                    styles.dot,
                                    index === currentIndex
                                        ? styles.dotActive
                                        : styles.dotInactive,
                                ]}
                            />
                        ))}
                    </View>

                    {/* Next/Get Started button */}
                    <Pressable onPress={handleNext} style={styles.nextButtonContainer}>
                        <LinearGradient
                            colors={["#7C3AED", "#8B5CF6"]}
                            start={{ x: 0, y: 0 }}
                            end={{ x: 1, y: 0 }}
                            style={styles.nextButton}
                        >
                            <Typography className="text-white font-bold text-base">
                                {isLastSlide ? "Get Started" : "Next"}
                            </Typography>
                            {!isLastSlide && <Zap size={18} color="#FFFFFF" style={{ marginLeft: 8 }} />}
                        </LinearGradient>
                    </Pressable>
                </View>
            </SafeAreaView>
        </GradientBackground>
    );
}

const styles = StyleSheet.create({
    header: {
        flexDirection: "row",
        justifyContent: "flex-end",
        paddingHorizontal: 24,
        paddingVertical: 16,
    },
    skipButton: {
        padding: 8,
    },
    slide: {
        width: SCREEN_WIDTH,
        flex: 1,
        justifyContent: "center",
        paddingHorizontal: 24,
    },
    visualContainer: {
        alignItems: "center",
        justifyContent: "center",
        height: 200,
        marginBottom: 48,
    },
    glowOuter: {
        position: "absolute",
        width: 200,
        height: 200,
        borderRadius: 100,
    },
    glowGradient: {
        width: "100%",
        height: "100%",
        borderRadius: 100,
    },
    iconContainer: {
        width: 100,
        height: 100,
        borderRadius: 28,
        alignItems: "center",
        justifyContent: "center",
        shadowColor: "#7C3AED",
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.4,
        shadowRadius: 16,
        elevation: 8,
    },
    floatingDot: {
        position: "absolute",
    },
    textContainer: {
        alignItems: "center",
        paddingHorizontal: 16,
    },
    footer: {
        paddingHorizontal: 24,
        paddingBottom: 24,
        alignItems: "center",
    },
    dotsContainer: {
        flexDirection: "row",
        marginBottom: 24,
        gap: 8,
    },
    dot: {
        width: 8,
        height: 8,
        borderRadius: 4,
    },
    dotActive: {
        width: 24,
        backgroundColor: "#7C3AED",
    },
    dotInactive: {
        backgroundColor: "rgba(255, 255, 255, 0.2)",
    },
    nextButtonContainer: {
        width: "100%",
    },
    nextButton: {
        height: 56,
        borderRadius: 16,
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "center",
    },
});
