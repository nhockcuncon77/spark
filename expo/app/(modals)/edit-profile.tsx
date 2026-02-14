import React, { useState, useEffect } from "react";
import {
  View,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Alert,
  ActivityIndicator,
  TextInput,
} from "react-native";
import { useRouter } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { Typography } from "../../components/ui/Typography";
import { Button } from "../../components/ui/Button";
import { GradientBackground } from "../../components/ui/GradientBackground";
import { PhotoManager } from "../../components/profile/PhotoManager";
import { MetadataEditor } from "../../components/profile/MetadataEditor";
import { InterestsEditor } from "../../components/profile/InterestsEditor";
import { HobbiesEditor } from "../../components/profile/HobbiesEditor";
import { PromptsEditor } from "../../components/profile/PromptsEditor";
import { useStore } from "../../store/useStore";
import { useAIStore } from "../../store/useAIStore";
import {
  graphqlAuthService,
  UpdateUserInput,
} from "../../services/graphql-auth";
import { X, Check } from "lucide-react-native";

export default function EditProfileScreen() {
  const router = useRouter();
  const { user, setUser } = useStore();
  const {
    connect,
    isConnected,
    sendMessage,
    streamingMessage,
    currentChatId,
    createNewChat,
  } = useAIStore();

  const [isLoading, setIsLoading] = useState(false);
  const [isGeneratingBio, setIsGeneratingBio] = useState(false);

  // Form State
  const [bio, setBio] = useState(user?.bio || "");
  const [photos, setPhotos] = useState<string[]>(user?.photos || []);
  const [extra, setExtra] = useState(user?.extra || {});
  const [interests, setInterests] = useState<string[]>(user?.interests || []);
  const [prompts, setPrompts] = useState<string[]>(user?.user_prompts || []);
  const [hobbies, setHobbies] = useState<string[]>(user?.hobbies || []);

  // Sync streaming bio to input
  useEffect(() => {
    if (isGeneratingBio && streamingMessage) {
      setBio(streamingMessage);
    }
  }, [streamingMessage, isGeneratingBio]);

  // Stop generating when stream ends (heuristic: length stable or explicitly stopped via interaction)
  // For now, user manually stops or we rely on them accepting the result.
  // Actually, we should probably toggle isGeneratingBio off when stream is "done" but store doesn't expose "isStreamingDone" easily
  // without digging into msg status. We'll let user click "Stop" or just edit it.

  const handleAIBioGenerate = async () => {
    if (isGeneratingBio) {
      setIsGeneratingBio(false);
      return;
    }

    Alert.alert("AI Bio Writer", "Choose a style for your bio:", [
      {
        text: "Playful",
        onPress: () => generateBio("playful and fun"),
      },
      {
        text: "Sincere",
        onPress: () => generateBio("sincere and authentic"),
      },
      {
        text: "Witty",
        onPress: () => generateBio("witty and clever"),
      },
      { text: "Cancel", style: "cancel" },
    ]);
  };

  const generateBio = async (style: string) => {
    try {
      setIsGeneratingBio(true);
      setBio("Generating...");

      if (!isConnected) {
        await connect();
      }
      if (!currentChatId) {
        createNewChat();
      }

      // Small delay to ensure connection/chat creation
      setTimeout(() => {
        const context = `
                 My name is ${user?.firstName}.
                 Interests: ${interests.join(", ") || "various things"}.
                 Hobbies: ${hobbies.join(", ")}.
                 Work: ${extra.work || "hidden"}.
              `;
        const prompt = `Write a short, ${style} dating bio (under 200 chars) for me. Context: ${context}`;
        sendMessage(prompt);
      }, 1000);
    } catch (err) {
      Alert.alert("Error", "Failed to start AI generation");
      setIsGeneratingBio(false);
      setBio(user?.bio || "");
    }
  };

  const handleSave = async () => {
    setIsLoading(true);
    try {
      const input: UpdateUserInput = {
        bio,
        photos,
        interests,
        hobbies,
        user_prompts: prompts.filter((p) => p.trim().length > 0),
      };

      const result = await graphqlAuthService.updateMe(input);

      if (result.success && result.user) {
        // Update store manually to reflect changes immediately
        const updatedUserProfile = {
          ...user!,
          bio: result.user.bio || "",
          photos: result.user.photos || [],
          interests: result.user.interests || [],
          hobbies: result.user.hobbies || [],
          user_prompts: result.user.user_prompts || [],
        };
        setUser(updatedUserProfile);
        router.back();
      } else {
        Alert.alert("Error", result.error || "Failed to update profile");
      }
    } catch (err) {
      Alert.alert("Error", "An unexpected error occurred");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <GradientBackground>
      <SafeAreaView className="flex-1" edges={["top"]}>
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          className="flex-1"
        >
          {/* Header */}
          <View className="flex-row justify-between items-center px-6 py-4 border-b border-white/5">
            <Button
              variant="ghost"
              size="sm"
              onPress={() => router.back()}
              className="w-10 h-10 p-0 items-center justify-center rounded-full bg-white/5"
            >
              <X size={20} color="white" />
            </Button>
            <Typography variant="h3" className="text-white">
              Edit Profile
            </Typography>
            <Button
              variant="ghost"
              size="sm"
              onPress={handleSave}
              loading={isLoading}
              className="w-10 h-10 p-0 items-center justify-center rounded-full bg-[#7C3AED]"
            >
              {!isLoading && <Check size={20} color="white" />}
            </Button>
          </View>

          <ScrollView className="flex-1">
            <View className="py-6">
              <PhotoManager photos={photos} onPhotosChange={setPhotos} />

              {/* Bio Editor */}
              <View className="px-6 mb-6">
                <View className="flex-row justify-between items-center mb-2">
                  <Typography variant="label" className="text-white/60">
                    Bio
                  </Typography>
                  {isGeneratingBio && (
                    <ActivityIndicator size="small" color="#7C3AED" />
                  )}
                </View>
                <View className="bg-white/5 border border-white/10 rounded-xl p-3 mb-2">
                  <TextInput
                    multiline
                    numberOfLines={4}
                    value={bio}
                    onChangeText={setBio}
                    placeholder="Write something about yourself..."
                    placeholderTextColor="rgba(255,255,255,0.3)"
                    className="text-white min-h-[80px]"
                    style={{ textAlignVertical: "top" }}
                  />
                </View>
                <Button
                  variant="ghost"
                  size="sm"
                  onPress={handleAIBioGenerate}
                  className="self-end"
                >
                  <Typography
                    variant="caption"
                    className="text-[#A78BFA] font-bold"
                  >
                    {isGeneratingBio ? "Stop Generation" : "✨ AI Rewrite"}
                  </Typography>
                </Button>
              </View>

              <InterestsEditor interests={interests} onChange={setInterests} />

              {/* Hobbies - using same component pattern */}
              <HobbiesEditor hobbies={hobbies} onChange={setHobbies} />

              <PromptsEditor prompts={prompts} onChange={setPrompts} />

              <MetadataEditor
                extra={extra}
                onChange={(key, value) =>
                  setExtra((prev) => ({ ...prev, [key]: value }))
                }
              />

              <View className="px-6 mt-4 mb-10">
                <Typography
                  variant="caption"
                  className="text-white/40 text-center"
                >
                  Some details like Name and Age can&apos;t be changed here.
                </Typography>
              </View>
            </View>
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </GradientBackground>
  );
}
