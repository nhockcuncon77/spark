import React, { useEffect } from "react";
import { View, Pressable, StyleSheet } from "react-native";
import { Avatar } from "../ui/Avatar";
import { Typography } from "../ui/Typography";
import {
  CheckCircle2,
  Camera,
  Edit3,
  Clock,
  Shield,
  AlertCircle,
} from "lucide-react-native";
import { LinearGradient } from "expo-linear-gradient";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withSequence,
  withTiming,
  Easing,
} from "react-native-reanimated";

export type VerificationStatus = "none" | "pending" | "approved" | "rejected";

interface ProfileHeaderProps {
  user: {
    firstName: string;
    lastName?: string;
    age?: number;
    photos: string[];
    isVerified: boolean;
    email?: string;
  };
  verificationStatus?: VerificationStatus;
  isOwnProfile?: boolean;
  onEditPhoto?: () => void;
  onEditProfile?: () => void;
  onStartVerification?: () => void;
}

export const ProfileHeader: React.FC<ProfileHeaderProps> = ({
  user,
  verificationStatus = "none",
  isOwnProfile = false,
  onEditPhoto,
  onEditProfile,
  onStartVerification,
}) => {
  // Glow pulse animation for verified profiles
  const glowOpacity = useSharedValue(0.4);

  useEffect(() => {
    if (user.isVerified || verificationStatus === "approved") {
      glowOpacity.value = withRepeat(
        withSequence(
          withTiming(0.8, {
            duration: 1500,
            easing: Easing.inOut(Easing.ease),
          }),
          withTiming(0.4, {
            duration: 1500,
            easing: Easing.inOut(Easing.ease),
          }),
        ),
        -1,
        true,
      );
    }
  }, [user.isVerified, verificationStatus]);

  const isVerified = user.isVerified || verificationStatus === "approved";
  const showVerificationBadge =
    isVerified ||
    verificationStatus === "pending" ||
    verificationStatus === "rejected";

  const getVerificationBadge = () => {
    if (isVerified) {
      return (
        <View style={styles.verifiedBadge}>
          <Shield size={14} color="#47FFA8" />
          <Typography
            variant="caption"
            className="text-[#47FFA8] font-semibold ml-1.5"
          >
            Verified
          </Typography>
        </View>
      );
    }

    if (verificationStatus === "pending") {
      return (
        <Pressable onPress={onStartVerification} style={styles.pendingBadge}>
          <Clock size={14} color="#FFD166" />
          <Typography
            variant="caption"
            className="text-[#FFD166] font-semibold ml-1.5"
          >
            Pending Review
          </Typography>
        </Pressable>
      );
    }

    if (verificationStatus === "rejected") {
      return (
        <Pressable onPress={onStartVerification} style={styles.rejectedBadge}>
          <AlertCircle size={14} color="#FF4C6D" />
          <Typography
            variant="caption"
            className="text-[#FF4C6D] font-semibold ml-1.5"
          >
            Retry Verification
          </Typography>
        </Pressable>
      );
    }

    return null;
  };

  return (
    <View style={styles.container}>
      <Pressable
        onPress={onEditPhoto}
        disabled={!isOwnProfile}
        style={styles.avatarContainer}
      >
        {/* Avatar with gradient border for verified */}
        <View>
          <Avatar
            source={user.photos?.[0]}
            fallback={user.firstName}
            size="xl"
          />
        </View>

        {isOwnProfile && (
          <View style={styles.cameraButton}>
            <Camera size={14} color="#FFFFFF" />
          </View>
        )}
      </Pressable>

      <View style={styles.nameRow}>
        <Typography variant="h2" className="text-white text-2xl font-bold">
          {user.firstName}
          {user.age ? `, ${user.age}` : ""}
        </Typography>
      </View>

      {user.email && isOwnProfile && (
        <Typography variant="caption" className="text-white/50 mb-2">
          {user.email}
        </Typography>
      )}

      {/* Verification Status Badge */}
      {showVerificationBadge && getVerificationBadge()}

      {/* Non-own profile verified badge (simpler) */}
      {!isOwnProfile && isVerified && !showVerificationBadge && (
        <View style={styles.verifiedBadge}>
          <Typography variant="caption" className="text-[#47FFA8] font-medium">
            ✓ Verified Profile
          </Typography>
        </View>
      )}

      {isOwnProfile && (
        <Pressable onPress={onEditProfile} style={styles.editButton}>
          <Edit3 size={14} color="#A78BFA" />
          <Typography className="text-white ml-2 font-medium">
            Edit Profile
          </Typography>
        </Pressable>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: "center",
    paddingHorizontal: 24,
    marginBottom: 16,
  },
  avatarContainer: {
    position: "relative",
    marginBottom: 16,
  },
  avatarGlow: {
    position: "absolute",
    top: -10,
    left: -10,
    right: -10,
    bottom: -10,
    borderRadius: 100,
    backgroundColor: "#47FFA8",
    opacity: 0.3,
  },
  avatarGradientBorder: {
    padding: 4,
    borderRadius: 100,
  },
  avatarInner: {
    borderRadius: 100,
    backgroundColor: "#080314",
    padding: 2,
  },
  avatarRing: {
    padding: 3,
    borderRadius: 100,
    borderWidth: 3,
    borderColor: "#7C3AED",
  },
  cameraButton: {
    position: "absolute",
    bottom: 0,
    right: 0,
    backgroundColor: "#7C3AED",
    borderRadius: 20,
    padding: 8,
    borderWidth: 3,
    borderColor: "#080314",
  },
  nameRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 4,
  },
  verifiedBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(71, 255, 168, 0.1)",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "rgba(71, 255, 168, 0.2)",
    marginTop: 8,
  },
  pendingBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(255, 209, 102, 0.1)",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "rgba(255, 209, 102, 0.2)",
    marginTop: 8,
  },
  rejectedBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(255, 76, 109, 0.1)",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "rgba(255, 76, 109, 0.2)",
    marginTop: 8,
  },
  editButton: {
    marginTop: 12,
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(255,255,255,0.05)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.1)",
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 25,
  },
});
