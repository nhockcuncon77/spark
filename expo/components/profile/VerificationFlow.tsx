import React, { useState } from "react";
import { View, Pressable, Alert, ActivityIndicator, StyleSheet } from "react-native";
import { Typography } from "../ui/Typography";
import { Button } from "../ui/Button";
import { Camera, CheckCircle2, ShieldCheck, X, RotateCcw } from "lucide-react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Image } from "expo-image";
import * as ImagePicker from "expo-image-picker";
import { graphqlAuthService } from "../../services/graphql-auth";
import { uploadUserPhotos, getPhotoUrls } from "../../services/file-upload";
import { SafeAreaView } from "react-native-safe-area-context";

interface VerificationFlowProps {
    onComplete: () => void;
    onCancel: () => void;
}

export const VerificationFlow: React.FC<VerificationFlowProps> = ({ onComplete, onCancel }) => {
    const [step, setStep] = useState<'intro' | 'capture' | 'preview' | 'submitting' | 'success'>('intro');
    const [photo, setPhoto] = useState<string | null>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const takePhoto = async () => {
        try {
            const permissionResult = await ImagePicker.requestCameraPermissionsAsync();
            if (!permissionResult.granted) {
                Alert.alert("Permission Required", "Camera access is required for verification.");
                return;
            }

            const result = await ImagePicker.launchCameraAsync({
                cameraType: ImagePicker.CameraType.front,
                allowsEditing: true,
                aspect: [3, 4],
                quality: 0.8,
            });

            if (!result.canceled && result.assets && result.assets[0]) {
                setPhoto(result.assets[0].uri);
                setStep('preview');
            }
        } catch (err) {
            console.error("Camera error:", err);
            Alert.alert("Error", "Failed to open camera. Please try again.");
        }
    };

    const retakePhoto = () => {
        setPhoto(null);
        setStep('capture');
        takePhoto();
    };

    const submitVerification = async () => {
        if (!photo) return;

        setIsSubmitting(true);
        setError(null);
        setStep('submitting');

        try {
            // Step 1: Upload photo to get S3 URL
            const uploadResult = await uploadUserPhotos(
                [{ uri: photo, key: `verification_${Date.now()}.jpg` }],
                "private"
            );

            if (!uploadResult.success || !uploadResult.files?.length) {
                throw new Error(uploadResult.error || "Failed to upload photo");
            }

            const photoUrls = getPhotoUrls(uploadResult.files);
            if (!photoUrls.length) {
                throw new Error("No photo URL returned");
            }

            // Step 2: Create verification with uploaded URL
            const result = await graphqlAuthService.createVerification(photoUrls[0]);

            if (result.success) {
                setStep('success');
                setTimeout(() => {
                    onComplete();
                }, 2000);
            } else {
                setError(result.error || "Verification failed. Please try again.");
                setStep('preview');
            }
        } catch (err) {
            console.error("Verification error:", err);
            setError(err instanceof Error ? err.message : "An unexpected error occurred.");
            setStep('preview');
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <View style={styles.container}>
            <LinearGradient
                colors={["#080314", "#1A1033", "#080314"]}
                style={StyleSheet.absoluteFillObject}
            />
            <SafeAreaView style={styles.safeArea}>
                {/* Header */}
                <View style={styles.header}>
                    <View style={{ width: 40 }} />
                    <Typography variant="h3" className="text-white">
                        {step === 'intro' ? 'Get Verified' : step === 'success' ? 'Success!' : 'Verification'}
                    </Typography>
                    <Pressable
                        onPress={onCancel}
                        style={styles.closeButton}
                    >
                        <X size={20} color="white" />
                    </Pressable>
                </View>

                {/* Content */}
                <View style={styles.content}>
                    {step === 'intro' && (
                        <View style={styles.centerContent}>
                            {/* Icon */}
                            <View style={styles.iconContainer}>
                                <ShieldCheck size={56} color="#A78BFA" />
                            </View>

                            {/* Title & Description */}
                            <Typography variant="h1" className="text-white text-center mb-4">
                                Verify Your Profile
                            </Typography>
                            <Typography variant="body" className="text-white/60 text-center leading-6 mb-8 px-4">
                                Take a selfie holding a piece of paper with{" "}
                                <Typography className="text-[#A78BFA] font-bold">"Spark"</Typography>
                                {" "}written on it. This helps us confirm you're real!
                            </Typography>

                            {/* Benefits */}
                            <View style={styles.benefitsContainer}>
                                <View style={styles.benefitCard}>
                                    <View style={[styles.benefitIcon, { backgroundColor: 'rgba(20, 214, 121, 0.2)' }]}>
                                        <CheckCircle2 size={24} color="#14D679" />
                                    </View>
                                    <View style={{ flex: 1 }}>
                                        <Typography variant="body" className="text-white font-semibold">Get a Trust Badge</Typography>
                                        <Typography variant="caption" className="text-white/50">Show others you're authentic</Typography>
                                    </View>
                                </View>

                                <View style={styles.benefitCard}>
                                    <View style={[styles.benefitIcon, { backgroundColor: 'rgba(124, 58, 237, 0.2)' }]}>
                                        <ShieldCheck size={24} color="#A78BFA" />
                                    </View>
                                    <View style={{ flex: 1 }}>
                                        <Typography variant="body" className="text-white font-semibold">3x More Matches</Typography>
                                        <Typography variant="caption" className="text-white/50">Verified profiles get more attention</Typography>
                                    </View>
                                </View>
                            </View>

                            {/* CTA */}
                            <Button
                                variant="primary"
                                className="w-full"
                                onPress={() => {
                                    setStep('capture');
                                    takePhoto();
                                }}
                                icon={<Camera size={20} color="white" />}
                            >
                                Take Verification Photo
                            </Button>

                            <Pressable onPress={onCancel} style={{ marginTop: 16, paddingVertical: 12 }}>
                                <Typography variant="body" className="text-white/40 text-center">
                                    Maybe Later
                                </Typography>
                            </Pressable>
                        </View>
                    )}

                    {step === 'capture' && (
                        <View style={styles.centerContent}>
                            <ActivityIndicator size="large" color="#A78BFA" />
                            <Typography variant="body" className="text-white/60 mt-4">
                                Opening camera...
                            </Typography>
                        </View>
                    )}

                    {step === 'preview' && photo && (
                        <View style={{ flex: 1 }}>
                            {/* Instructions */}
                            <View style={styles.instructionBox}>
                                <Typography variant="body" className="text-white/80 text-center">
                                    Make sure <Typography className="text-[#A78BFA] font-bold">"Spark"</Typography> is clearly visible
                                </Typography>
                            </View>

                            {/* Photo Preview */}
                            <View style={styles.photoPreview}>
                                <Image
                                    source={photo}
                                    style={{ width: '100%', height: '100%' }}
                                    contentFit="cover"
                                />
                            </View>

                            {/* Error */}
                            {error && (
                                <View style={styles.errorBox}>
                                    <Typography variant="caption" className="text-red-400 text-center">
                                        {error}
                                    </Typography>
                                </View>
                            )}

                            {/* Actions */}
                            <View style={styles.actionRow}>
                                <Button
                                    variant="secondary"
                                    className="flex-1 bg-white/5 border-white/10"
                                    onPress={retakePhoto}
                                    icon={<RotateCcw size={18} color="#A78BFA" />}
                                >
                                    <Typography className="text-white">Retake</Typography>
                                </Button>

                                <Button
                                    variant="primary"
                                    className="flex-1"
                                    onPress={submitVerification}
                                    loading={isSubmitting}
                                    icon={<CheckCircle2 size={18} color="white" />}
                                >
                                    Submit
                                </Button>
                            </View>
                        </View>
                    )}

                    {step === 'submitting' && (
                        <View style={styles.centerContent}>
                            <ActivityIndicator size="large" color="#A78BFA" />
                            <Typography variant="h3" className="text-white mt-6 mb-2">
                                Submitting...
                            </Typography>
                            <Typography variant="body" className="text-white/60 text-center">
                                Please wait while we process your verification
                            </Typography>
                        </View>
                    )}

                    {step === 'success' && (
                        <View style={styles.centerContent}>
                            <View style={[styles.iconContainer, { backgroundColor: 'rgba(20, 214, 121, 0.15)' }]}>
                                <CheckCircle2 size={56} color="#14D679" />
                            </View>

                            <Typography variant="h1" className="text-white text-center mb-4">
                                Submitted! 🎉
                            </Typography>
                            <Typography variant="body" className="text-white/60 text-center leading-6 px-4">
                                Our team will review your submission.{"\n"}
                                This usually takes under 10 minutes.
                            </Typography>

                            <View style={styles.successNote}>
                                <Typography variant="caption" className="text-white/50 text-center">
                                    You'll receive a notification once verified ✨
                                </Typography>
                            </View>
                        </View>
                    )}
                </View>
            </SafeAreaView>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#080314',
    },
    safeArea: {
        flex: 1,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 24,
        paddingVertical: 16,
    },
    closeButton: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: 'rgba(255,255,255,0.1)',
        alignItems: 'center',
        justifyContent: 'center',
    },
    content: {
        flex: 1,
        paddingHorizontal: 24,
    },
    centerContent: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
    },
    iconContainer: {
        width: 112,
        height: 112,
        borderRadius: 56,
        backgroundColor: 'rgba(124, 58, 237, 0.15)',
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 32,
    },
    benefitsContainer: {
        width: '100%',
        gap: 12,
        marginBottom: 40,
    },
    benefitCard: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 16,
        backgroundColor: 'rgba(255,255,255,0.05)',
        borderRadius: 16,
        padding: 16,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.1)',
    },
    benefitIcon: {
        width: 48,
        height: 48,
        borderRadius: 24,
        alignItems: 'center',
        justifyContent: 'center',
    },
    instructionBox: {
        backgroundColor: 'rgba(124, 58, 237, 0.1)',
        borderWidth: 1,
        borderColor: 'rgba(124, 58, 237, 0.3)',
        borderRadius: 16,
        padding: 16,
        marginBottom: 24,
    },
    photoPreview: {
        flex: 1,
        borderRadius: 24,
        overflow: 'hidden',
        borderWidth: 2,
        borderColor: 'rgba(255,255,255,0.1)',
        marginBottom: 24,
    },
    errorBox: {
        backgroundColor: 'rgba(239, 68, 68, 0.1)',
        borderWidth: 1,
        borderColor: 'rgba(239, 68, 68, 0.3)',
        borderRadius: 12,
        padding: 12,
        marginBottom: 16,
    },
    actionRow: {
        flexDirection: 'row',
        gap: 12,
        marginBottom: 24,
    },
    successNote: {
        marginTop: 32,
        backgroundColor: 'rgba(255,255,255,0.05)',
        borderRadius: 16,
        padding: 16,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.1)',
    },
});
