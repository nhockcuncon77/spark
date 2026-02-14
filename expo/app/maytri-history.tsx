import React from "react";
import { View, FlatList, StatusBar, Pressable, Alert } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { Typography } from "../components/ui/Typography";
import { useStore, MaytriSession } from "../store/useStore";
import {
  ArrowLeft,
  MessageSquare,
  Trash2,
  Calendar,
} from "lucide-react-native";

export default function MaytriHistoryScreen() {
  const router = useRouter();
  const { maytriSessions, deleteMaytriSession, setMaytriMessages } = useStore();

  const handleLoadSession = (session: MaytriSession) => {
    setMaytriMessages(session.messages);
    router.back();
  };

  const handleDeleteSession = (sessionId: string) => {
    Alert.alert(
      "Delete Chat",
      "Are you sure you want to delete this conversation?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: () => deleteMaytriSession(sessionId),
        },
      ],
    );
  };

  const renderItem = ({ item }: { item: MaytriSession }) => (
    <Pressable
      onPress={() => handleLoadSession(item)}
      className="flex-row items-center p-4 border-b border-surface-elevated active:bg-surface-elevated/50"
    >
      <View className="w-10 h-10 rounded-full bg-primary/10 items-center justify-center mr-4">
        <MessageSquare size={20} color="#7C3AED" />
      </View>
      <View className="flex-1">
        <Typography variant="h3" className="text-base mb-1">
          {item.title}
        </Typography>
        <View className="flex-row items-center">
          <Calendar size={12} color="#A6A6B2" />
          <Typography variant="caption" color="muted" className="ml-1">
            {new Date(item.date).toLocaleDateString()} •{" "}
            {new Date(item.date).toLocaleTimeString([], {
              hour: "2-digit",
              minute: "2-digit",
            })}
          </Typography>
        </View>
      </View>
      <Pressable
        onPress={(e) => {
          e.stopPropagation();
          handleDeleteSession(item.id);
        }}
        className="p-2"
      >
        <Trash2 size={18} color="#EF4444" />
      </Pressable>
    </Pressable>
  );

  return (
    <SafeAreaView className="flex-1 bg-background">
      <StatusBar barStyle="light-content" />

      {/* Header */}
      <View className="px-4 py-4 border-b border-surface-elevated flex-row items-center">
        <Pressable onPress={() => router.back()} className="mr-4">
          <ArrowLeft size={24} color="#E6E6F0" />
        </Pressable>
        <Typography variant="h2">Chat History</Typography>
      </View>

      {maytriSessions.length > 0 ? (
        <FlatList
          data={maytriSessions}
          renderItem={renderItem}
          keyExtractor={(item) => item.id}
          contentContainerStyle={{ paddingBottom: 20 }}
        />
      ) : (
        <View className="flex-1 items-center justify-center px-8">
          <View className="w-16 h-16 rounded-full bg-surface-elevated items-center justify-center mb-4">
            <MessageSquare size={32} color="#A6A6B2" />
          </View>
          <Typography variant="h3" color="muted" className="text-center">
            No saved conversations
          </Typography>
        </View>
      )}
    </SafeAreaView>
  );
}
