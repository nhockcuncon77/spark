import React, { useState, useEffect } from "react";
import {
  View,
  Modal,
  Pressable,
  TextInput,
  Image,
  ScrollView,
  Alert,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import * as ImagePicker from "expo-image-picker";
import * as DocumentPicker from "expo-document-picker";
import {
  useAudioPlayer,
  useAudioRecorder,
  useAudioRecorderState,
  RecordingPresets,
  requestRecordingPermissionsAsync,
  setAudioModeAsync,
} from "expo-audio";
import { Typography } from "../ui/Typography";
import { Button } from "../ui/Button";
import {
  X,
  Image as ImageIcon,
  Video,
  Mic,
  FileText,
  Trash2,
  Sparkles,
  Square,
  Play,
  Pause,
} from "lucide-react-native";

interface SelectedMedia {
  uri: string;
  type: "image" | "video" | "audio" | "file";
  name?: string;
  duration?: number;
}

interface CreatePostModalProps {
  visible: boolean;
  onClose: () => void;
  onSubmit: (
    content: string,
    files?: { uri: string; type?: "image" | "video" | "audio" | "file" }[],
  ) => void;
}

export function CreatePostModal({
  visible,
  onClose,
  onSubmit,
}: CreatePostModalProps) {
  const [content, setContent] = useState("");
  const [selectedMedia, setSelectedMedia] = useState<SelectedMedia[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [playingIndex, setPlayingIndex] = useState<number | null>(null);

  // Audio recorder setup
  const audioRecorder = useAudioRecorder(RecordingPresets.HIGH_QUALITY);
  const recorderState = useAudioRecorderState(audioRecorder);

  // Request permissions and setup audio mode on mount
  useEffect(() => {
    (async () => {
      const { granted } = await requestRecordingPermissionsAsync();
      if (!granted) {
        console.log("Recording permission denied");
      }

      await setAudioModeAsync({
        playsInSilentMode: true,
        allowsRecording: true,
      });
    })();
  }, []);

  const handlePickImage = async () => {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      Alert.alert("Permission Required", "Please allow access to your photos.");
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: "images",
      allowsMultipleSelection: true,
      quality: 0.8,
      selectionLimit: 5 - selectedMedia.length,
    });

    if (!result.canceled && result.assets) {
      const newMedia = result.assets.map((asset) => ({
        uri: asset.uri,
        type: "image" as const,
      }));
      setSelectedMedia((prev) => [...prev, ...newMedia].slice(0, 5));
    }
  };

  const handlePickVideo = async () => {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      Alert.alert("Permission Required", "Please allow access to your videos.");
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: "videos",
      quality: 0.8,
    });

    if (!result.canceled && result.assets && result.assets[0]) {
      setSelectedMedia((prev) =>
        [
          ...prev,
          {
            uri: result.assets[0].uri,
            type: "video" as const,
            duration: result.assets[0].duration,
          },
        ].slice(0, 5),
      );
    }
  };

  const handlePickAudio = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: ["audio/*"],
        copyToCacheDirectory: true,
      });

      if (!result.canceled && result.assets && result.assets[0]) {
        const asset = result.assets[0];
        setSelectedMedia((prev) =>
          [
            ...prev,
            {
              uri: asset.uri,
              type: "audio" as const,
              name: asset.name,
            },
          ].slice(0, 5),
        );
      }
    } catch (error) {
      console.error("Error picking audio:", error);
      Alert.alert("Error", "Failed to pick audio file");
    }
  };

  const handleStartRecording = async () => {
    try {
      const { granted } = await requestRecordingPermissionsAsync();
      if (!granted) {
        Alert.alert(
          "Permission Required",
          "Please allow microphone access to record audio.",
        );
        return;
      }

      await audioRecorder.prepareToRecordAsync();
      audioRecorder.record();
    } catch (error) {
      console.error("Failed to start recording:", error);
      Alert.alert("Error", "Failed to start recording");
    }
  };

  const handleStopRecording = async () => {
    try {
      await audioRecorder.stop();

      // Get the recorded file URI
      const uri = audioRecorder.uri;

      if (uri) {
        setSelectedMedia((prev) =>
          [
            ...prev,
            {
              uri,
              type: "audio" as const,
              name: `Recording ${new Date().toLocaleTimeString()}`,
              duration: Math.floor(recorderState.durationMillis / 1000),
            },
          ].slice(0, 5),
        );
      }
    } catch (error) {
      console.error("Failed to stop recording:", error);
      Alert.alert("Error", "Failed to save recording");
    }
  };

  const handleAudioOptions = () => {
    Alert.alert("Add Audio", "Choose an option", [
      {
        text: "Record Audio",
        onPress: handleStartRecording,
      },
      {
        text: "Choose from Library",
        onPress: handlePickAudio,
      },
      { text: "Cancel", style: "cancel" },
    ]);
  };

  const handlePickFile = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: "*/*",
        copyToCacheDirectory: true,
      });

      if (!result.canceled && result.assets && result.assets[0]) {
        const asset = result.assets[0];
        setSelectedMedia((prev) =>
          [
            ...prev,
            {
              uri: asset.uri,
              type: "file" as const,
              name: asset.name,
            },
          ].slice(0, 5),
        );
      }
    } catch (error) {
      console.error("Error picking file:", error);
    }
  };

  const handleRemoveMedia = (index: number) => {
    setSelectedMedia((prev) => prev.filter((_, i) => i !== index));
    if (playingIndex === index) {
      setPlayingIndex(null);
    }
  };

  const handleSubmit = () => {
    if (!content.trim() && selectedMedia.length === 0) return;

    setIsSubmitting(true);

    const files = selectedMedia.map((m) => ({ uri: m.uri, type: m.type }));
    onSubmit(content.trim(), files.length > 0 ? files : undefined);

    setContent("");
    setSelectedMedia([]);
    setIsSubmitting(false);
    onClose();
  };

  const handleClose = () => {
    if (
      content.trim() ||
      selectedMedia.length > 0 ||
      recorderState.isRecording
    ) {
      Alert.alert("Discard Post?", "Your post will be lost.", [
        { text: "Cancel", style: "cancel" },
        {
          text: "Discard",
          style: "destructive",
          onPress: async () => {
            if (recorderState.isRecording) {
              await audioRecorder.stop();
            }
            setContent("");
            setSelectedMedia([]);
            onClose();
          },
        },
      ]);
    } else {
      onClose();
    }
  };

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
    >
      <SafeAreaView className="flex-1 bg-[#0D0D1A]">
        {/* Header */}
        <View className="flex-row justify-between items-center px-4 py-4 border-b border-white/10">
          <Pressable onPress={handleClose} className="p-1">
            <X size={24} color="#E6E6F0" />
          </Pressable>
          <Typography variant="h3" className="text-white font-bold">
            New Post
          </Typography>
          <Button
            variant="primary"
            size="sm"
            onPress={handleSubmit}
            disabled={
              (!content.trim() && selectedMedia.length === 0) ||
              isSubmitting ||
              recorderState.isRecording
            }
          >
            Post
          </Button>
        </View>

        <ScrollView className="flex-1" keyboardShouldPersistTaps="handled">
          {/* Recording Indicator */}
          {recorderState.isRecording && (
            <View className="mx-4 mt-4 p-4 bg-red-500/10 rounded-xl border border-red-500/30">
              <View className="flex-row items-center justify-between">
                <View className="flex-row items-center gap-3">
                  <View className="w-3 h-3 rounded-full bg-red-500" />
                  <Typography variant="label" className="text-red-500">
                    Recording...
                  </Typography>
                </View>
                <Typography variant="label" className="text-white">
                  {formatDuration(
                    Math.floor(recorderState.durationMillis / 1000),
                  )}
                </Typography>
              </View>
              <Pressable
                onPress={handleStopRecording}
                className="mt-3 flex-row items-center justify-center gap-2 bg-red-500 rounded-xl py-2"
              >
                <Square size={16} color="#FFF" fill="#FFF" />
                <Typography variant="label" className="text-white">
                  Stop Recording
                </Typography>
              </Pressable>
            </View>
          )}

          {/* Text Input */}
          <View className="px-4 py-4">
            <TextInput
              value={content}
              onChangeText={setContent}
              placeholder="What's on your mind?"
              placeholderTextColor="rgba(255,255,255,0.4)"
              multiline
              autoFocus={!recorderState.isRecording}
              editable={!recorderState.isRecording}
              className="text-white text-base leading-6"
              style={{ minHeight: 120 }}
              maxLength={500}
            />
            <Typography
              variant="caption"
              className="text-white/30 text-right mt-2"
            >
              {content.length}/500
            </Typography>
          </View>

          {/* Selected Media Preview */}
          {selectedMedia.length > 0 && (
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              className="px-4 py-2"
              contentContainerStyle={{ gap: 12 }}
            >
              {selectedMedia.map((media, index) => (
                <MediaPreview
                  key={index}
                  media={media}
                  index={index}
                  onRemove={handleRemoveMedia}
                  isPlaying={playingIndex === index}
                  onPlayingChange={(playing) =>
                    setPlayingIndex(playing ? index : null)
                  }
                />
              ))}
            </ScrollView>
          )}

          {/* Media Actions */}
          <View className="px-4 py-4 flex-row flex-wrap gap-3">
            <Pressable
              onPress={handlePickImage}
              disabled={selectedMedia.length >= 5 || recorderState.isRecording}
              className={`flex-row items-center gap-2 px-4 py-3 bg-white/5 rounded-xl border border-white/10 ${
                (selectedMedia.length >= 5 || recorderState.isRecording) &&
                "opacity-50"
              }`}
            >
              <ImageIcon size={20} color="#7C3AED" />
              <Typography variant="label" className="text-white/80">
                Photo
              </Typography>
            </Pressable>

            <Pressable
              onPress={handlePickVideo}
              disabled={selectedMedia.length >= 5 || recorderState.isRecording}
              className={`flex-row items-center gap-2 px-4 py-3 bg-white/5 rounded-xl border border-white/10 ${
                (selectedMedia.length >= 5 || recorderState.isRecording) &&
                "opacity-50"
              }`}
            >
              <Video size={20} color="#7C3AED" />
              <Typography variant="label" className="text-white/80">
                Video
              </Typography>
            </Pressable>

            <Pressable
              onPress={
                recorderState.isRecording
                  ? handleStopRecording
                  : handleAudioOptions
              }
              disabled={selectedMedia.length >= 5}
              className={`flex-row items-center gap-2 px-4 py-3 rounded-xl border ${
                recorderState.isRecording
                  ? "bg-red-500/10 border-red-500/30"
                  : "bg-white/5 border-white/10"
              } ${selectedMedia.length >= 5 && "opacity-50"}`}
            >
              <Mic
                size={20}
                color={recorderState.isRecording ? "#EF4444" : "#7C3AED"}
              />
              <Typography
                variant="label"
                className={
                  recorderState.isRecording ? "text-red-500" : "text-white/80"
                }
              >
                {recorderState.isRecording ? "Recording" : "Audio"}
              </Typography>
            </Pressable>

            <Pressable
              onPress={handlePickFile}
              disabled={selectedMedia.length >= 5 || recorderState.isRecording}
              className={`flex-row items-center gap-2 px-4 py-3 bg-white/5 rounded-xl border border-white/10 ${
                (selectedMedia.length >= 5 || recorderState.isRecording) &&
                "opacity-50"
              }`}
            >
              <FileText size={20} color="#7C3AED" />
              <Typography variant="label" className="text-white/80">
                File
              </Typography>
            </Pressable>
          </View>
        </ScrollView>

        {/* AI Assistant */}
        <View className="px-4 py-4 border-t border-white/10">
          <Pressable
            onPress={() => Alert.alert("AI Assistant", "Coming soon!")}
            disabled={recorderState.isRecording}
            className="flex-row items-center bg-[#FFD166]/10 rounded-xl p-4 border border-[#FFD166]/30"
          >
            <Sparkles size={20} color="#FFD166" />
            <View className="flex-1 ml-3">
              <Typography variant="label" className="text-[#FFD166]">
                AI Writing Assistant
              </Typography>
              <Typography variant="caption" className="text-white/50">
                Get help crafting the perfect post
              </Typography>
            </View>
          </Pressable>
        </View>
      </SafeAreaView>
    </Modal>
  );
}

// Media Preview Component with Audio Playback
interface MediaPreviewProps {
  media: SelectedMedia;
  index: number;
  onRemove: (index: number) => void;
  isPlaying: boolean;
  onPlayingChange: (playing: boolean) => void;
}

const MediaPreview: React.FC<MediaPreviewProps> = ({
  media,
  index,
  onRemove,
  isPlaying,
  onPlayingChange,
}) => {
  const audioPlayer =
    media.type === "audio" ? useAudioPlayer({ uri: media.uri }) : null;

  const toggleAudioPlayback = () => {
    if (!audioPlayer) return;

    if (isPlaying) {
      audioPlayer.pause();
      onPlayingChange(false);
    } else {
      audioPlayer.play();
      onPlayingChange(true);
    }
  };

  useEffect(() => {
    if (audioPlayer && !isPlaying && audioPlayer.playing) {
      audioPlayer.pause();
    }
  }, [isPlaying, audioPlayer]);

  return (
    <View className="relative">
      {media.type === "image" ? (
        <Image
          source={{ uri: media.uri }}
          className="w-24 h-24 rounded-xl"
          resizeMode="cover"
        />
      ) : media.type === "video" ? (
        <View className="w-24 h-24 rounded-xl bg-black/50 items-center justify-center border border-white/10">
          <Video size={32} color="rgba(255,255,255,0.6)" />
        </View>
      ) : media.type === "audio" ? (
        <Pressable
          onPress={toggleAudioPlayback}
          className="w-24 h-24 rounded-xl bg-[#6A1BFF]/20 items-center justify-center border border-[#6A1BFF]/30"
        >
          {isPlaying ? (
            <Pause size={32} color="#6A1BFF" fill="#6A1BFF" />
          ) : (
            <Play size={32} color="#6A1BFF" fill="#6A1BFF" />
          )}
          {media.duration && (
            <Typography
              variant="caption"
              className="text-white/70 text-xs mt-1"
            >
              {Math.floor(media.duration / 60)}:
              {(media.duration % 60).toString().padStart(2, "0")}
            </Typography>
          )}
        </Pressable>
      ) : (
        <View className="w-24 h-24 rounded-xl bg-white/10 items-center justify-center border border-white/10">
          <FileText size={32} color="rgba(255,255,255,0.6)" />
          <Typography
            variant="caption"
            className="text-white/50 text-xs mt-1"
            numberOfLines={1}
          >
            {media.name?.split(".").pop()?.toUpperCase()}
          </Typography>
        </View>
      )}
      <Pressable
        onPress={() => onRemove(index)}
        className="absolute -top-2 -right-2 w-6 h-6 rounded-full bg-red-500 items-center justify-center"
      >
        <Trash2 size={12} color="#FFF" />
      </Pressable>
    </View>
  );
};

export default CreatePostModal;
