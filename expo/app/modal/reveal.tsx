import React, { useState, useEffect } from 'react';
import { View, StyleSheet, Image } from 'react-native';
import { useRouter } from 'expo-router';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withSpring,
} from 'react-native-reanimated';
import { Typography } from '../../components/ui/Typography';
import { Button } from '../../components/ui/Button';
import { AlertTriangle } from 'lucide-react-native';

// Mock User Data for the reveal
const REVEALED_USER = {
  id: 'u2',
  firstName: 'Jordan',
  photo: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e',
};

export default function RevealModal() {
  const router = useRouter();
  const [step, setStep] = useState<'animating' | 'rating'>('animating');
  const [rating, setRating] = useState<number | null>(null);

  // Animation Values
  const opacity = useSharedValue(0);
  const scale = useSharedValue(0.8);
  const blurOpacity = useSharedValue(1);

  useEffect(() => {
    // Start Reveal Animation sequence
    const timeout = setTimeout(() => {
        // Fade out the "lock" overlay
        blurOpacity.value = withTiming(0, { duration: 800 });
        // Fade in and scale up the photo
        opacity.value = withTiming(1, { duration: 800 });
        scale.value = withSpring(1, { damping: 12 });

        // Transition to rating UI
        setTimeout(() => {
            setStep('rating');
        }, 1200);
    }, 500);

    return () => clearTimeout(timeout);
  }, []);

  const animatedImageStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ scale: scale.value }],
  }));

  const animatedBlurStyle = useAnimatedStyle(() => ({
    opacity: blurOpacity.value,
  }));

  const handleRating = (score: number) => {
    setRating(score);
  };

  const handleSubmit = () => {
    console.log(`Rated: ${rating}`);
    router.back();
  };

  return (
    <View className="flex-1 bg-background items-center justify-center px-6">

      {/* Reveal Area */}
      <View className="items-center mb-10 relative">
        <View className="w-64 h-64 rounded-full bg-surface-elevated items-center justify-center overflow-hidden border-4 border-primary/20 shadow-2xl shadow-primary/20">
            {/* The Revealed Image */}
            <Animated.View style={[StyleSheet.absoluteFill, animatedImageStyle]}>
                <Image
                    source={{ uri: REVEALED_USER.photo }}
                    className="w-full h-full"
                    resizeMode="cover"
                />
            </Animated.View>

            {/* The "Locked" Overlay (fading out) */}
            <Animated.View style={[StyleSheet.absoluteFill, { backgroundColor: '#16161B', alignItems: 'center', justifyContent: 'center' }, animatedBlurStyle]}>
                <Typography variant="h1" color="muted" className="text-6xl opacity-20">?</Typography>
            </Animated.View>
        </View>

        <View className="mt-8 items-center h-20">
            <Typography variant="h1" className="mb-2 text-3xl">
                {step === 'animating' ? 'Revealing...' : `It's ${REVEALED_USER.firstName}!`}
            </Typography>
            {step === 'rating' && (
                <Typography variant="body" color="muted" className="text-center">
                    How accurate was your mental image?
                </Typography>
            )}
        </View>
      </View>

      {/* Rating Section */}
      {step === 'rating' && (
        <View className="w-full">
            {/* Numeric Rating 1-10 */}
            <View className="flex-row flex-wrap justify-center gap-2 mb-8">
                {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((num) => (
                    <Button
                        key={num}
                        variant={rating === num ? 'primary' : 'secondary'}
                        size="sm"
                        className={`w-10 h-10 px-0 items-center justify-center ${rating === num ? '' : 'bg-surface-elevated'}`}
                        onPress={() => handleRating(num)}
                    >
                        <Typography
                            variant="label"
                            color={rating === num ? 'default' : 'muted'}
                            className="font-bold"
                        >
                            {num}
                        </Typography>
                    </Button>
                ))}
            </View>

            {/* Explanation for 7 threshold */}
            <View className="h-20 mb-4">
                {rating !== null && (
                    <View className="bg-surface-elevated p-4 rounded-xl border border-white/5">
                        <Typography variant="caption" color="ai" className="mb-1 font-bold uppercase tracking-wider">
                            {rating >= 7 ? "High Match!" : "Feedback Recorded"}
                        </Typography>
                        <Typography variant="caption" color="muted">
                            {rating >= 7
                                ? "Great! We'll show you more people like this."
                                : "Thanks. We'll refine your recommendations to match your taste."
                            }
                        </Typography>
                    </View>
                )}
            </View>

            <Button
                variant="primary"
                size="lg"
                className="w-full mb-4"
                disabled={rating === null}
                onPress={handleSubmit}
            >
                Continue Chatting
            </Button>

            <Button
                variant="ghost"
                className="w-full"
                icon={<AlertTriangle size={16} color="#EF4444" />}
                onPress={() => console.log("Report")}
            >
                <Typography color="danger">Report Profile</Typography>
            </Button>
        </View>
      )}
    </View>
  );
}
