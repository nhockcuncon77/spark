import React, { useEffect, useState, useCallback } from "react";
import {
  View,
  ScrollView,
  StatusBar,
  Pressable,
  Dimensions,
  Alert,
  ActivityIndicator,
  Modal,
} from "react-native";
import { Image } from "expo-image";
import { SafeAreaView } from "react-native-safe-area-context";
import { useLocalSearchParams, useRouter } from "expo-router";
import { Typography } from "../../components/ui/Typography";
import { Button } from "../../components/ui/Button";
import { Chip } from "../../components/ui/Chip";
import { Card } from "../../components/ui/Card";
import { GradientBackground } from "../../components/ui/GradientBackground";
import { useCommunityStore } from "../../store/useCommunityStore";
import { graphqlClient } from "../../services/graphql-client";
import { gql } from "urql";
import {
  ArrowLeft,
  Hand,
  Briefcase,
  GraduationCap,
  Moon,
  Languages,
  CheckCircle2,
  Lock,
  Heart,
  Wine,
  Cigarette,
  Baby,
  Sparkles,
  Dumbbell,
  Users,
  MessageCircle,
  X,
  Calendar,
  Check,
} from "lucide-react-native";
import { BlurView } from "expo-blur";
import { LinearGradient } from "expo-linear-gradient";
import Animated, { FadeIn, FadeInDown } from "react-native-reanimated";

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get("window");

// GraphQL query for fetching user
const GET_USER = gql`
  query GetUser($id: String!) {
    user(id: $id) {
      id
      name
      pfp
      bio
      dob
      gender
      hobbies
      interests
      user_prompts
      personality_traits {
        key
        value
      }
      photos
      is_verified
      extra {
        school
        work
        looking_for
        zodiac
        languages
        excercise
        drinking
        smoking
        kids
        religion
        ethnicity
        sexuality
      }
      created_at
      is_online
      is_locked
      is_poked
      chat_id
    }
  }
`;

interface PersonalityTrait {
  key: string;
  value: number;
}

interface ExtraMetadata {
  school?: string;
  work?: string;
  looking_for?: string[];
  zodiac?: string;
  languages?: string[];
  excercise?: string;
  drinking?: string;
  smoking?: string;
  kids?: string;
  religion?: string;
  ethnicity?: string;
  sexuality?: string;
}

interface UserPublic {
  id: string;
  name: string;
  pfp: string;
  bio: string;
  dob: string;
  gender: string;
  hobbies: string[];
  interests: string[];
  user_prompts: string[];
  personality_traits: PersonalityTrait[];
  photos: string[];
  is_verified: boolean;
  extra?: ExtraMetadata;
  created_at: string;
  is_online: boolean;
  is_locked: boolean;
  is_poked: boolean;
  chat_id: string;
}

// Calculate age from DOB
function calculateAge(dob: string): number {
  const birthDate = new Date(dob);
  const today = new Date();
  let age = today.getFullYear() - birthDate.getFullYear();
  const monthDiff = today.getMonth() - birthDate.getMonth();
  if (
    monthDiff < 0 ||
    (monthDiff === 0 && today.getDate() < birthDate.getDate())
  ) {
    age--;
  }
  return age;
}

// Format date for display
function formatJoinDate(dateString: string): string {
  const date = new Date(dateString);
  return date.toLocaleDateString("en-US", { month: "long", year: "numeric" });
}

// Generate AI summary based on user data
function generateAISummary(user: UserPublic): string {
  const parts: string[] = [];
  const age = calculateAge(user.dob);

  // Intro
  parts.push(`${user.name} is a ${age}-year-old ${user.gender?.toLowerCase() || "person"}`);

  // Work/School
  if (user.extra?.work) {
    parts.push(`working at ${user.extra.work}`);
  } else if (user.extra?.school) {
    parts.push(`studying at ${user.extra.school}`);
  }

  // Interests summary
  if (user.interests && user.interests.length > 0) {
    const topInterests = user.interests.slice(0, 3).join(", ");
    parts.push(`with interests in ${topInterests}`);
  }

  // Looking for
  if (user.extra?.looking_for && user.extra.looking_for.length > 0) {
    parts.push(`looking for ${user.extra.looking_for[0].toLowerCase()}`);
  }

  // Lifestyle hint
  const lifestyle: string[] = [];
  if (user.extra?.excercise === "Active" || user.extra?.excercise === "Often") {
    lifestyle.push("fitness enthusiast");
  }
  if (user.extra?.drinking === "Never") {
    lifestyle.push("non-drinker");
  }
  if (lifestyle.length > 0) {
    parts.push(`and is a ${lifestyle.join(" and ")}`);
  }

  return parts.join(" ") + ".";
}

// Fullscreen Image Modal
interface ImageModalProps {
  visible: boolean;
  imageUrl: string;
  onClose: () => void;
}

const ImageModal: React.FC<ImageModalProps> = ({ visible, imageUrl, onClose }) => (
  <Modal visible={visible} transparent animationType="fade">
    <View className="flex-1 bg-black">
      <SafeAreaView className="flex-1">
        <Pressable
          onPress={onClose}
          className="absolute top-4 right-4 z-10 w-10 h-10 rounded-full bg-black/50 items-center justify-center"
        >
          <X size={24} color="#FFF" />
        </Pressable>
        <View className="flex-1 items-center justify-center">
          <Image
            source={imageUrl}
            style={{ width: SCREEN_WIDTH, height: SCREEN_HEIGHT * 0.8 }}
            contentFit="contain"
            transition={200}
          />
        </View>
      </SafeAreaView>
    </View>
  </Modal>
);

export default function UserProfileScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const [user, setUser] = useState<UserPublic | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isPoked, setIsPoked] = useState(false);
  const [isPoking, setIsPoking] = useState(false);
  const [fullscreenImage, setFullscreenImage] = useState<string | null>(null);

  const { pokeUser } = useCommunityStore();

  // Fetch user data
  useEffect(() => {
    if (!id) return;

    const fetchUser = async () => {
      setIsLoading(true);
      setError(null);

      try {
        const result = await graphqlClient.query(GET_USER, { id }).toPromise();

        if (result.error) {
          throw new Error(result.error.message);
        }

        if (result.data?.user) {
          setUser(result.data.user);
          setIsPoked(result.data.user.is_poked);
        } else {
          setError("User not found");
        }
      } catch (err) {
        console.error("Error fetching user:", err);
        setError("Failed to load user profile");
      } finally {
        setIsLoading(false);
      }
    };

    fetchUser();
  }, [id]);

  const handlePoke = useCallback(async () => {
    if (!user || isPoked || isPoking) return;

    setIsPoking(true);
    const success = await pokeUser(user.id);
    setIsPoking(false);

    if (success) {
      setIsPoked(true);
    } else {
      Alert.alert("Oops", "Failed to poke. Please try again.");
    }
  }, [user, isPoked, isPoking, pokeUser]);

  const handleMessage = useCallback(() => {
    if (!user || !user.chat_id) return;
    router.push(`/chat/${user.chat_id}`);
  }, [user, router]);

  const openFullscreenImage = useCallback((url: string) => {
    setFullscreenImage(url);
  }, []);

  // Loading state
  if (isLoading) {
    return (
      <GradientBackground>
        <SafeAreaView className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" color="#6A1BFF" />
          <Typography variant="body" className="text-white/50 mt-4">
            Loading profile...
          </Typography>
        </SafeAreaView>
      </GradientBackground>
    );
  }

  // Error or not found state
  if (error || !user) {
    return (
      <GradientBackground>
        <SafeAreaView className="flex-1 items-center justify-center px-8">
          <Typography variant="h3" className="text-white/70 text-center">
            {error || "User not found"}
          </Typography>
          <Button variant="outline" onPress={() => router.back()} className="mt-4">
            Go Back
          </Button>
        </SafeAreaView>
      </GradientBackground>
    );
  }

  const age = calculateAge(user.dob);
  const isLocked = user.is_locked;
  const canMessage = !isLocked && user.chat_id;
  const aiSummary = generateAISummary(user);

  return (
    <View className="flex-1 bg-[#0D0D1A]">
      <StatusBar barStyle="light-content" />

      {/* Fullscreen Image Modal */}
      <ImageModal
        visible={!!fullscreenImage}
        imageUrl={fullscreenImage || ""}
        onClose={() => setFullscreenImage(null)}
      />

      <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
        {/* Photo Section */}
        <Pressable
          onPress={() => !isLocked && openFullscreenImage(user.photos[0] || user.pfp)}
          className="relative"
        >
          <View style={{ width: SCREEN_WIDTH, height: SCREEN_WIDTH * 1.25 }}>
            <Image
              source={user.photos[0] || user.pfp}
              style={{ width: "100%", height: "100%" }}
              contentFit="cover"
              cachePolicy="disk"
              transition={300}
            />

            {/* Gradient overlay for text readability */}
            <LinearGradient
              colors={["transparent", "rgba(0,0,0,0.3)", "rgba(0,0,0,0.85)"]}
              locations={[0, 0.5, 1]}
              style={{
                position: "absolute",
                bottom: 0,
                left: 0,
                right: 0,
                height: "60%",
              }}
            />

            {isLocked && (
              <View className="absolute inset-0 items-center justify-center">
                <BlurView
                  intensity={80}
                  tint="dark"
                  style={{
                    position: "absolute",
                    width: "100%",
                    height: "100%",
                  }}
                />
                <View className="bg-black/60 p-6 rounded-2xl items-center border border-white/10">
                  <Lock size={32} color="#A6A6B2" />
                  <Typography variant="h3" className="text-center mb-1 mt-3 text-white">
                    Profile Locked
                  </Typography>
                  <Typography
                    variant="body"
                    className="text-white/50 text-center"
                  >
                    Match or chat to unlock photos
                  </Typography>
                </View>
              </View>
            )}
          </View>

          {/* Header Actions */}
          <SafeAreaView className="absolute top-0 left-0 right-0 z-10">
            <View className="px-4 py-2 flex-row justify-between items-center">
              <Pressable
                onPress={() => router.back()}
                className="w-10 h-10 rounded-full bg-black/50 items-center justify-center"
              >
                <ArrowLeft size={24} color="#FFFFFF" />
              </Pressable>

              {/* Online indicator */}
              {user.is_online && (
                <View className="flex-row items-center bg-black/50 px-3 py-1.5 rounded-full">
                  <View className="w-2 h-2 rounded-full bg-[#14D679] mr-2" />
                  <Typography variant="caption" className="text-white">
                    Online
                  </Typography>
                </View>
              )}
            </View>
          </SafeAreaView>

          {/* Name Overlay */}
          <View className="absolute bottom-0 left-0 right-0 p-6">
            <View className="flex-row items-center gap-2 mb-2">
              <Typography variant="h1" className="text-3xl text-white font-bold">
                {user.name}, {age}
              </Typography>
              {user.is_verified && (
                <View className="w-6 h-6 rounded-full bg-blue-500 items-center justify-center">
                  <Check size={14} color="#FFF" strokeWidth={3} />
                </View>
              )}
            </View>

            <View className="flex-row items-center flex-wrap gap-3">
              {user.gender && (
                <Typography variant="body" className="text-white/80">
                  {user.gender}
                </Typography>
              )}
              {user.extra?.work && (
                <View className="flex-row items-center">
                  <Briefcase size={14} color="#FFF" />
                  <Typography variant="body" className="text-white/80 ml-1.5">
                    {user.extra.work}
                  </Typography>
                </View>
              )}
              {user.extra?.school && !user.extra?.work && (
                <View className="flex-row items-center">
                  <GraduationCap size={14} color="#FFF" />
                  <Typography variant="body" className="text-white/80 ml-1.5">
                    {user.extra.school}
                  </Typography>
                </View>
              )}
            </View>
          </View>
        </Pressable>

        {/* Content */}
        <View className="px-4 py-6 gap-5 pb-32">
          {/* AI Summary Section */}
          <Animated.View entering={FadeInDown.duration(300).delay(50)}>
            <Card variant="elevated" padding="md" className="bg-gradient-to-r from-[#7C3AED]/20 to-[#6A1BFF]/10 border border-[#7C3AED]/30">
              <View className="flex-row items-start gap-3">
                <View className="w-8 h-8 rounded-full bg-[#7C3AED]/30 items-center justify-center">
                  <Sparkles size={16} color="#7C3AED" />
                </View>
                <View className="flex-1">
                  <Typography variant="label" className="text-[#7C3AED] mb-1">
                    AI Summary
                  </Typography>
                  <Typography variant="body" className="text-white/80 leading-relaxed">
                    {aiSummary}
                  </Typography>
                </View>
              </View>
            </Card>
          </Animated.View>

          {/* Bio */}
          {user.bio && (
            <Animated.View entering={FadeInDown.duration(300).delay(100)}>
              <Typography variant="h3" className="mb-2 text-white">
                About
              </Typography>
              <Typography variant="body" className="leading-relaxed text-white/80">
                {user.bio}
              </Typography>
            </Animated.View>
          )}

          {/* Quick Info */}
          <Animated.View entering={FadeInDown.duration(300).delay(150)} className="flex-row flex-wrap gap-2">
            {user.extra?.zodiac && (
              <Chip
                label={user.extra.zodiac}
                icon={<Moon size={14} color="#E6E6F0" />}
              />
            )}
            {user.extra?.school && (
              <Chip
                label={user.extra.school}
                icon={<GraduationCap size={14} color="#E6E6F0" />}
              />
            )}
            {user.extra?.languages?.map((lang) => (
              <Chip
                key={lang}
                label={lang}
                icon={<Languages size={14} color="#E6E6F0" />}
              />
            ))}
            {user.extra?.religion && (
              <Chip label={user.extra.religion} variant="outline" />
            )}
          </Animated.View>

          {/* Looking For */}
          {user.extra?.looking_for && user.extra.looking_for.length > 0 && (
            <Animated.View entering={FadeInDown.duration(300).delay(200)}>
              <Typography variant="h3" className="mb-3 text-white">
                Looking For
              </Typography>
              <View className="flex-row flex-wrap gap-2">
                {user.extra.looking_for.map((item) => (
                  <Chip
                    key={item}
                    label={item}
                    variant="outline"
                    icon={<Heart size={12} color="#7C3AED" />}
                  />
                ))}
              </View>
            </Animated.View>
          )}

          {/* Hobbies */}
          {user.hobbies && user.hobbies.length > 0 && (
            <Animated.View entering={FadeInDown.duration(300).delay(250)}>
              <Typography variant="h3" className="mb-3 text-white">
                Hobbies
              </Typography>
              <View className="flex-row flex-wrap gap-2">
                {user.hobbies.map((hobby) => (
                  <Chip key={hobby} label={hobby} variant="default" />
                ))}
              </View>
            </Animated.View>
          )}

          {/* Interests */}
          {user.interests && user.interests.length > 0 && (
            <Animated.View entering={FadeInDown.duration(300).delay(300)}>
              <Typography variant="h3" className="mb-3 text-white">
                Interests
              </Typography>
              <View className="flex-row flex-wrap gap-2">
                {user.interests.map((interest) => (
                  <Chip key={interest} label={interest} variant="outline" />
                ))}
              </View>
            </Animated.View>
          )}

          {/* User Prompts */}
          {user.user_prompts && user.user_prompts.length > 0 && (
            <Animated.View entering={FadeInDown.duration(300).delay(350)}>
              <Typography variant="h3" className="mb-3 text-white">
                Prompts
              </Typography>
              <View className="gap-3">
                {user.user_prompts.map((prompt, index) => (
                  <Card
                    key={index}
                    variant="elevated"
                    padding="lg"
                    className="border-l-4 border-l-[#7C3AED]"
                  >
                    <Typography
                      variant="body"
                      className="italic text-white/90 leading-relaxed"
                    >
                      "{prompt}"
                    </Typography>
                  </Card>
                ))}
              </View>
            </Animated.View>
          )}

          {/* Lifestyle */}
          {user.extra && (user.extra.excercise || user.extra.drinking || user.extra.smoking || user.extra.kids || user.extra.ethnicity) && (
            <Animated.View entering={FadeInDown.duration(300).delay(400)}>
              <Typography variant="h3" className="mb-3 text-white">
                Lifestyle
              </Typography>
              <View className="flex-row flex-wrap gap-2">
                {user.extra.excercise && (
                  <Chip
                    label={user.extra.excercise}
                    icon={<Dumbbell size={14} color="#E6E6F0" />}
                  />
                )}
                {user.extra.drinking && (
                  <Chip
                    label={user.extra.drinking}
                    icon={<Wine size={14} color="#E6E6F0" />}
                  />
                )}
                {user.extra.smoking && (
                  <Chip
                    label={user.extra.smoking}
                    icon={<Cigarette size={14} color="#E6E6F0" />}
                  />
                )}
                {user.extra.kids && (
                  <Chip
                    label={user.extra.kids}
                    icon={<Baby size={14} color="#E6E6F0" />}
                  />
                )}
                {user.extra.ethnicity && (
                  <Chip
                    label={user.extra.ethnicity}
                    icon={<Users size={14} color="#E6E6F0" />}
                  />
                )}
              </View>
            </Animated.View>
          )}

          {/* Photos Gallery */}
          {!isLocked && user.photos && user.photos.length > 1 && (
            <Animated.View entering={FadeInDown.duration(300).delay(450)}>
              <Typography variant="h3" className="mb-3 text-white">
                Photos
              </Typography>
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={{ gap: 12 }}
              >
                {user.photos.slice(1).map((photo, index) => (
                  <Pressable
                    key={index}
                    onPress={() => openFullscreenImage(photo)}
                  >
                    <Image
                      source={photo}
                      style={{ width: 140, height: 180, borderRadius: 12 }}
                      contentFit="cover"
                      cachePolicy="disk"
                      transition={200}
                    />
                  </Pressable>
                ))}
              </ScrollView>
            </Animated.View>
          )}

          {/* Member Since */}
          <View className="flex-row items-center justify-center gap-2 mt-4">
            <Calendar size={14} color="rgba(255,255,255,0.3)" />
            <Typography variant="caption" className="text-white/30">
              Member since {formatJoinDate(user.created_at)}
            </Typography>
          </View>
        </View>
      </ScrollView>

      {/* Bottom Actions */}
      <SafeAreaView className="absolute bottom-0 left-0 right-0 bg-[#0D0D1A]/95 border-t border-white/10">
        <View className="px-6 py-4 flex-row justify-center items-center gap-4">
          {/* Message Button - Only show if unlocked */}
          {canMessage ? (
            <Pressable
              onPress={handleMessage}
              className="flex-1 flex-row items-center justify-center gap-2 bg-[#7C3AED] rounded-xl py-3.5"
            >
              <MessageCircle size={20} color="#FFF" />
              <Typography variant="label" className="text-white font-bold">
                Message
              </Typography>
            </Pressable>
          ) : (
            <View className="flex-1 flex-row items-center justify-center gap-2 bg-white/10 rounded-xl py-3.5 opacity-60">
              <Lock size={18} color="#A6A6B2" />
              <Typography variant="label" className="text-white/50">
                Unlock to Message
              </Typography>
            </View>
          )}

          {/* Poke Button */}
          <Pressable
            onPress={handlePoke}
            disabled={isPoked || isPoking}
            className={`flex-1 flex-row items-center justify-center gap-2 rounded-xl py-3.5 border ${isPoked
                ? "bg-[#14D679]/20 border-[#14D679]/50"
                : "bg-white/10 border-white/20"
              }`}
          >
            {isPoking ? (
              <ActivityIndicator size="small" color="#7C3AED" />
            ) : isPoked ? (
              <>
                <Check size={20} color="#14D679" />
                <Typography variant="label" className="text-[#14D679] font-bold">
                  Poked!
                </Typography>
              </>
            ) : (
              <>
                <Hand size={20} color="#7C3AED" />
                <Typography variant="label" className="text-white">
                  Poke
                </Typography>
              </>
            )}
          </Pressable>
        </View>
      </SafeAreaView>
    </View>
  );
}
