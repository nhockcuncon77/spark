import React, { useCallback } from "react";
import { View, Pressable, Alert, Dimensions } from "react-native";
import { Image } from "expo-image";
import { X, Plus, GripVertical } from "lucide-react-native";
import { Typography } from "../ui/Typography";
import * as ImagePicker from "expo-image-picker";
import Animated, {
    useAnimatedStyle,
    useSharedValue,
    withSpring,
    runOnJS,
} from "react-native-reanimated";
import {
    Gesture,
    GestureDetector,
    GestureHandlerRootView
} from "react-native-gesture-handler";

interface PhotoManagerProps {
    photos: string[];
    onPhotosChange: (photos: string[]) => void;
    maxPhotos?: number;
}

const PHOTO_SIZE = (Dimensions.get("window").width - 48 - 16) / 3; // 3 columns with gap
const GAP = 8;

interface DraggablePhotoProps {
    uri: string;
    index: number;
    onRemove: () => void;
    onDragEnd: (from: number, to: number) => void;
    totalPhotos: number;
}

const DraggablePhoto: React.FC<DraggablePhotoProps> = ({
    uri,
    index,
    onRemove,
    onDragEnd,
    totalPhotos
}) => {
    const translateX = useSharedValue(0);
    const translateY = useSharedValue(0);
    const scale = useSharedValue(1);
    const zIndex = useSharedValue(0);

    const gesture = Gesture.Pan()
        .onStart(() => {
            scale.value = withSpring(1.1);
            zIndex.value = 100;
        })
        .onUpdate((e) => {
            translateX.value = e.translationX;
            translateY.value = e.translationY;
        })
        .onEnd((e) => {
            // Calculate target index based on position
            const xOffset = e.translationX;
            const yOffset = e.translationY;

            const colChange = Math.round(xOffset / (PHOTO_SIZE + GAP));
            const rowChange = Math.round(yOffset / (PHOTO_SIZE + GAP));

            const currentCol = index % 3;
            const currentRow = Math.floor(index / 3);

            let newCol = Math.max(0, Math.min(2, currentCol + colChange));
            let newRow = Math.max(0, currentRow + rowChange);

            let newIndex = newRow * 3 + newCol;
            newIndex = Math.max(0, Math.min(totalPhotos - 1, newIndex));

            if (newIndex !== index) {
                runOnJS(onDragEnd)(index, newIndex);
            }

            translateX.value = withSpring(0);
            translateY.value = withSpring(0);
            scale.value = withSpring(1);
            zIndex.value = 0;
        });

    const animatedStyle = useAnimatedStyle(() => ({
        transform: [
            { translateX: translateX.value },
            { translateY: translateY.value },
            { scale: scale.value },
        ],
        zIndex: zIndex.value,
    }));

    return (
        <GestureDetector gesture={gesture}>
            <Animated.View
                style={[
                    {
                        width: PHOTO_SIZE,
                        height: PHOTO_SIZE * 1.3,
                        marginBottom: GAP,
                    },
                    animatedStyle
                ]}
            >
                <View className="relative flex-1 rounded-xl overflow-hidden bg-white/5 border border-white/10">
                    <Image
                        source={uri}
                        style={{ width: '100%', height: '100%' }}
                        contentFit="cover"
                        transition={200}
                    />

                    {/* Drag Handle */}
                    <View className="absolute top-2 left-2 bg-black/50 rounded-full p-1.5">
                        <GripVertical size={14} color="white" />
                    </View>

                    {/* Remove Button */}
                    <Pressable
                        onPress={onRemove}
                        className="absolute top-2 right-2 bg-black/60 rounded-full p-1.5"
                    >
                        <X size={14} color="white" />
                    </Pressable>

                    {/* Index Badge */}
                    {index === 0 && (
                        <View className="absolute bottom-2 left-2 bg-[#7C3AED] rounded-full px-2 py-0.5">
                            <Typography variant="caption" className="text-white text-xs font-bold">
                                Main
                            </Typography>
                        </View>
                    )}
                </View>
            </Animated.View>
        </GestureDetector>
    );
};

export const PhotoManager: React.FC<PhotoManagerProps> = ({
    photos,
    onPhotosChange,
    maxPhotos = 6,
}) => {
    const pickImage = async () => {
        const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (!permissionResult.granted) {
            Alert.alert("Permission Required", "Please allow access to your photos.");
            return;
        }

        const result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ImagePicker.MediaTypeOptions.Images,
            allowsMultipleSelection: true,
            selectionLimit: maxPhotos - photos.length,
            quality: 0.8,
        });

        if (!result.canceled && result.assets) {
            const newPhotos = result.assets.map((asset) => asset.uri);
            onPhotosChange([...photos, ...newPhotos].slice(0, maxPhotos));
        }
    };

    const removePhoto = (index: number) => {
        const newPhotos = [...photos];
        newPhotos.splice(index, 1);
        onPhotosChange(newPhotos);
    };

    const handleDragEnd = useCallback((fromIndex: number, toIndex: number) => {
        const newPhotos = [...photos];
        const [movedPhoto] = newPhotos.splice(fromIndex, 1);
        newPhotos.splice(toIndex, 0, movedPhoto);
        onPhotosChange(newPhotos);
    }, [photos, onPhotosChange]);

    const emptySlots = maxPhotos - photos.length;

    return (
        <GestureHandlerRootView>
            <View className="px-6 mb-6">
                <View className="flex-row justify-between items-center mb-3">
                    <Typography variant="h3" className="text-white">
                        Photos
                    </Typography>
                    <Typography variant="caption" className="text-white/50">
                        {photos.length}/{maxPhotos} • Drag to reorder
                    </Typography>
                </View>

                <View className="flex-row flex-wrap" style={{ gap: GAP }}>
                    {photos.map((photo, index) => (
                        <DraggablePhoto
                            key={`${photo}-${index}`}
                            uri={photo}
                            index={index}
                            totalPhotos={photos.length}
                            onRemove={() => removePhoto(index)}
                            onDragEnd={handleDragEnd}
                        />
                    ))}

                    {/* Add Photo Slots */}
                    {Array.from({ length: Math.min(emptySlots, 1) }).map((_, i) => (
                        <Pressable
                            key={`add-${i}`}
                            onPress={pickImage}
                            style={{
                                width: PHOTO_SIZE,
                                height: PHOTO_SIZE * 1.3,
                                marginBottom: GAP,
                            }}
                            className="rounded-xl border-2 border-dashed border-[#7C3AED]/40 bg-[#7C3AED]/10 items-center justify-center"
                        >
                            <View className="w-10 h-10 rounded-full bg-[#7C3AED]/30 items-center justify-center mb-2">
                                <Plus size={20} color="#A78BFA" />
                            </View>
                            <Typography variant="caption" className="text-[#A78BFA]">
                                Add Photo
                            </Typography>
                        </Pressable>
                    ))}
                </View>

                {photos.length < 3 && (
                    <View className="mt-3 bg-[#FFD166]/10 border border-[#FFD166]/20 rounded-xl p-3">
                        <Typography variant="caption" className="text-[#FFD166] text-center">
                            💡 Add at least 3 photos for better matches
                        </Typography>
                    </View>
                )}
            </View>
        </GestureHandlerRootView>
    );
};
