import React, { useState } from "react";
import {
  View,
  ScrollView,
  Alert,
  ActivityIndicator,
  TouchableOpacity,
  Image,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter, Href } from "expo-router";
import { Typography } from "../../components/ui/Typography";
import { Button } from "../../components/ui/Button";
import { useStore } from "../../store/useStore";
import { ChevronLeft, Plus, X, Camera } from "lucide-react-native";
import * as ImagePicker from "expo-image-picker";
import { uploadUserPhotos, getPhotoUrls } from "../../services/file-upload";
import { graphqlAuthService } from "../../services/graphql-auth";

const MIN_PHOTOS = 2;
const MAX_PHOTOS = 6;

export default function PhotosScreen() {
  const router = useRouter();
  const { user, setUser, completeOnboarding } = useStore();

  const [photos, setPhotos] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<string | null>(null);

  const pickImage = async () => {
    if (photos.length >= MAX_PHOTOS) {
      Alert.alert(
        "Maximum Photos",
        `You can only upload ${MAX_PHOTOS} photos.`,
      );
      return;
    }

    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== "granted") {
      Alert.alert(
        "Permission Required",
        "Please grant photo library access to upload photos.",
      );
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [3, 4],
      quality: 0.8,
    });

    if (!result.canceled && result.assets[0]) {
      setPhotos([...photos, result.assets[0].uri]);
    }
  };

  const takePhoto = async () => {
    if (photos.length >= MAX_PHOTOS) {
      Alert.alert(
        "Maximum Photos",
        `You can only upload ${MAX_PHOTOS} photos.`,
      );
      return;
    }

    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== "granted") {
      Alert.alert(
        "Permission Required",
        "Please grant camera access to take photos.",
      );
      return;
    }

    const result = await ImagePicker.launchCameraAsync({
      allowsEditing: true,
      aspect: [3, 4],
      quality: 0.8,
    });

    if (!result.canceled && result.assets[0]) {
      setPhotos([...photos, result.assets[0].uri]);
    }
  };

  const removePhoto = (index: number) => {
    setPhotos(photos.filter((_, i) => i !== index));
  };

  const handleContinue = async () => {
    if (photos.length < MIN_PHOTOS) {
      Alert.alert(
        "More Photos Needed",
        `Please add at least ${MIN_PHOTOS} photos to continue.`,
      );
      return;
    }

    setIsLoading(true);
    setUploadProgress("Uploading photos...");

    try {
      // Prepare photos for upload
      const photosToUpload = photos.map((uri, index) => ({
        uri,
        key: `profile_${Date.now()}_${index}.jpg`,
      }));

      // Upload photos
      const uploadResult = await uploadUserPhotos(photosToUpload, "public");

      if (!uploadResult.success) {
        throw new Error(uploadResult.error || "Failed to upload photos");
      }

      // Get the S3 URLs
      const photoUrls = getPhotoUrls(uploadResult.files || []);

      if (photoUrls.length === 0) {
        throw new Error("No photos were uploaded successfully");
      }

      setUploadProgress("Updating profile...");

      // Update user profile with photo URLs
      const updateResult = await graphqlAuthService.updateMe({
        photos: photoUrls,
      });

      if (!updateResult.success) {
        throw new Error(updateResult.error || "Failed to update profile");
      }

      // Update local user state
      if (user && updateResult.user) {
        setUser({
          ...user,
          photos: updateResult.user.photos,
        });
      }

      // Check if there are more onboarding steps
      if (updateResult.user) {
        const status = graphqlAuthService.getOnboardingStatus(
          updateResult.user,
        );
        if (status.isComplete) {
          completeOnboarding();
          router.replace("/(tabs)/swipe" as Href);
        } else if (status.nextScreen) {
          router.replace(status.nextScreen as Href);
        } else {
          completeOnboarding();
          router.replace("/(tabs)/swipe" as Href);
        }
      }
    } catch (error) {
      console.error("Photo upload error:", error);
      Alert.alert(
        "Upload Failed",
        error instanceof Error
          ? error.message
          : "Failed to upload photos. Please try again.",
      );
    } finally {
      setIsLoading(false);
      setUploadProgress(null);
    }
  };

  const handleBack = () => {
    router.back();
  };

  const handleSkip = () => {
    Alert.alert(
      "Skip Photos?",
      "Your profile will be less visible without photos. Are you sure?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Skip",
          style: "destructive",
          onPress: () => {
            completeOnboarding();
            router.replace("/(tabs)/swipe" as Href);
          },
        },
      ],
    );
  };

  return (
    <SafeAreaView className="flex-1 bg-background">
      <View className="flex-1 px-6 py-6">
        {/* Header */}
        <View className="flex-row items-center mb-6">
          <Button
            variant="ghost"
            size="sm"
            onPress={handleBack}
            icon={<ChevronLeft size={24} color="#E6E6F0" />}
            className="px-0 -ml-2"
          />
          <View className="flex-1 flex-row justify-center mr-8">
            <View className="flex-row gap-2">
              <View className="w-8 h-1 bg-primary rounded-full" />
              <View className="w-8 h-1 bg-primary rounded-full" />
              <View className="w-8 h-1 bg-primary rounded-full" />
            </View>
          </View>
        </View>

        {/* Title */}
        <View className="mb-8">
          <Typography variant="h1" className="mb-2">
            Add your photos
          </Typography>
          <Typography variant="body" color="muted">
            Add at least {MIN_PHOTOS} photos. Your first photo will be your
            profile picture.
          </Typography>
        </View>

        {/* Photo Grid */}
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: 140 }}
        >
          <View className="flex-row flex-wrap gap-3">
            {/* Existing Photos */}
            {photos.map((photo, index) => (
              <View
                key={index}
                className="w-[30%] aspect-[3/4] rounded-xl overflow-hidden bg-surface-elevated"
              >
                <Image
                  source={{ uri: photo }}
                  className="w-full h-full"
                  resizeMode="cover"
                />
                <TouchableOpacity
                  onPress={() => removePhoto(index)}
                  className="absolute top-2 right-2 w-7 h-7 rounded-full bg-error items-center justify-center"
                >
                  <X size={16} color="#FFFFFF" />
                </TouchableOpacity>
                {index === 0 && (
                  <View className="absolute bottom-0 left-0 right-0 bg-primary/80 py-1">
                    <Typography
                      variant="caption"
                      className="text-center text-white"
                    >
                      Profile
                    </Typography>
                  </View>
                )}
              </View>
            ))}

            {/* Add Photo Button */}
            {photos.length < MAX_PHOTOS && (
              <TouchableOpacity
                onPress={pickImage}
                onLongPress={takePhoto}
                className="w-[30%] aspect-[3/4] rounded-xl border-2 border-dashed border-border items-center justify-center bg-surface-elevated"
              >
                <Plus size={32} color="#6B6B80" />
                <Typography variant="caption" color="muted" className="mt-2">
                  Add
                </Typography>
              </TouchableOpacity>
            )}
          </View>

          {/* Camera Option */}
          <TouchableOpacity
            onPress={takePhoto}
            className="flex-row items-center justify-center mt-6 py-3"
          >
            <Camera size={20} color="#7C3AED" />
            <Typography variant="label" color="primary" className="ml-2">
              Take a photo
            </Typography>
          </TouchableOpacity>
        </ScrollView>

        {/* Footer */}
        <View className="absolute bottom-8 left-6 right-6 bg-background pt-4">
          {uploadProgress && (
            <View className="flex-row items-center justify-center mb-3">
              <ActivityIndicator color="#7C3AED" size="small" />
              <Typography variant="caption" color="muted" className="ml-2">
                {uploadProgress}
              </Typography>
            </View>
          )}

          <Typography
            variant="caption"
            color="muted"
            className="text-center mb-3"
          >
            {photos.length} of {MAX_PHOTOS} photos added
          </Typography>

          <Button
            variant="primary"
            size="lg"
            onPress={handleContinue}
            disabled={isLoading || photos.length < MIN_PHOTOS}
            className="w-full mb-3"
          >
            {isLoading ? (
              <ActivityIndicator color="#FFFFFF" size="small" />
            ) : (
              "Continue"
            )}
          </Button>

          <Button
            variant="ghost"
            size="sm"
            onPress={handleSkip}
            className="w-full"
          >
            <Typography variant="caption" color="muted">
              Skip for now
            </Typography>
          </Button>
        </View>
      </View>
    </SafeAreaView>
  );
}
