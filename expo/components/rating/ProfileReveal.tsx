import React from "react";
import { View, ScrollView, StyleSheet, Dimensions, Image } from "react-native";
import { Typography } from "../ui/Typography";
import { Avatar } from "../ui/Avatar";
import { CheckCircle2, MapPin, Briefcase, GraduationCap, Heart } from "lucide-react-native";
import { LinearGradient } from "expo-linear-gradient";
import Animated, { FadeInUp, FadeIn } from "react-native-reanimated";

const { width: SCREEN_WIDTH } = Dimensions.get("window");
const PHOTO_WIDTH = SCREEN_WIDTH - 48;

interface ProfileRevealProps {
    profile: {
        name: string;
        age?: number;
        bio?: string;
        photos: string[];
        hobbies?: string[];
        interests?: string[];
        isVerified?: boolean;
        extra?: {
            work?: string;
            school?: string;
        };
    };
}

export const ProfileReveal: React.FC<ProfileRevealProps> = ({ profile }) => {
    return (
        <View style={styles.container}>
            {/* Photos Carousel */}
            <Animated.View entering={FadeIn.duration(600)}>
                <ScrollView
                    horizontal
                    pagingEnabled
                    showsHorizontalScrollIndicator={false}
                    contentContainerStyle={styles.photosContainer}
                    snapToInterval={PHOTO_WIDTH + 12}
                    decelerationRate="fast"
                >
                    {profile.photos.map((photo, index) => (
                        <Animated.View
                            key={index}
                            entering={FadeInUp.duration(500).delay(index * 100)}
                            style={styles.photoWrapper}
                        >
                            <Image
                                source={{ uri: photo }}
                                style={styles.photo}
                                resizeMode="cover"
                            />
                            {/* Photo indicator */}
                            <View style={styles.photoIndicator}>
                                <Typography variant="caption" className="text-white/80">
                                    {index + 1} / {profile.photos.length}
                                </Typography>
                            </View>
                        </Animated.View>
                    ))}
                </ScrollView>
            </Animated.View>

            {/* Profile Info */}
            <Animated.View
                entering={FadeInUp.duration(600).delay(200)}
                style={styles.infoContainer}
            >
                {/* Name & Age */}
                <View style={styles.nameRow}>
                    <Typography variant="h1" className="text-white text-2xl font-bold">
                        {profile.name}
                        {profile.age ? `, ${profile.age}` : ""}
                    </Typography>
                    {profile.isVerified && (
                        <CheckCircle2 size={24} color="#47FFA8" fill="#47FFA8" />
                    )}
                </View>

                {/* Work & School */}
                {(profile.extra?.work || profile.extra?.school) && (
                    <View style={styles.detailsRow}>
                        {profile.extra?.work && (
                            <View style={styles.detailItem}>
                                <Briefcase size={14} color="#A6A6B2" />
                                <Typography variant="caption" className="text-white/60 ml-1.5">
                                    {profile.extra.work}
                                </Typography>
                            </View>
                        )}
                        {profile.extra?.school && (
                            <View style={styles.detailItem}>
                                <GraduationCap size={14} color="#A6A6B2" />
                                <Typography variant="caption" className="text-white/60 ml-1.5">
                                    {profile.extra.school}
                                </Typography>
                            </View>
                        )}
                    </View>
                )}

                {/* Bio */}
                {profile.bio && (
                    <View style={styles.bioContainer}>
                        <Typography variant="body" className="text-white/80 leading-6">
                            {profile.bio}
                        </Typography>
                    </View>
                )}

                {/* Hobbies */}
                {profile.hobbies && profile.hobbies.length > 0 && (
                    <View style={styles.tagsContainer}>
                        {profile.hobbies.slice(0, 6).map((hobby, index) => (
                            <LinearGradient
                                key={index}
                                colors={["#8A3CFF20", "#8A3CFF10"]}
                                style={styles.tag}
                            >
                                <Typography variant="caption" className="text-primary">
                                    {hobby}
                                </Typography>
                            </LinearGradient>
                        ))}
                    </View>
                )}

                {/* Interests */}
                {profile.interests && profile.interests.length > 0 && (
                    <View style={styles.tagsContainer}>
                        {profile.interests.slice(0, 6).map((interest, index) => (
                            <View key={index} style={styles.interestTag}>
                                <Heart size={12} color="#FF4C6D" />
                                <Typography variant="caption" className="text-white/60 ml-1">
                                    {interest}
                                </Typography>
                            </View>
                        ))}
                    </View>
                )}
            </Animated.View>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    photosContainer: {
        paddingHorizontal: 24,
        gap: 12,
    },
    photoWrapper: {
        width: PHOTO_WIDTH,
        height: PHOTO_WIDTH * 1.2,
        borderRadius: 20,
        overflow: "hidden",
    },
    photo: {
        width: "100%",
        height: "100%",
    },
    photoIndicator: {
        position: "absolute",
        bottom: 12,
        right: 12,
        backgroundColor: "rgba(0,0,0,0.5)",
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 12,
    },
    infoContainer: {
        paddingHorizontal: 24,
        paddingTop: 20,
    },
    nameRow: {
        flexDirection: "row",
        alignItems: "center",
        gap: 10,
        marginBottom: 8,
    },
    detailsRow: {
        flexDirection: "row",
        gap: 16,
        marginBottom: 12,
    },
    detailItem: {
        flexDirection: "row",
        alignItems: "center",
    },
    bioContainer: {
        marginBottom: 16,
        padding: 16,
        backgroundColor: "rgba(255,255,255,0.05)",
        borderRadius: 16,
        borderWidth: 1,
        borderColor: "rgba(255,255,255,0.08)",
    },
    tagsContainer: {
        flexDirection: "row",
        flexWrap: "wrap",
        gap: 8,
        marginBottom: 12,
    },
    tag: {
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 16,
        borderWidth: 1,
        borderColor: "rgba(138, 60, 255, 0.2)",
    },
    interestTag: {
        flexDirection: "row",
        alignItems: "center",
        paddingHorizontal: 10,
        paddingVertical: 6,
        borderRadius: 16,
        backgroundColor: "rgba(255,255,255,0.05)",
        borderWidth: 1,
        borderColor: "rgba(255,255,255,0.08)",
    },
});
