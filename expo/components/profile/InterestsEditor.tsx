import React, { useState } from "react";
import { View, TextInput, Pressable } from "react-native";
import { Typography } from "../ui/Typography";
import { Chip } from "../ui/Chip";
import { Plus } from "lucide-react-native";

interface InterestsEditorProps {
    interests: string[];
    onChange: (interests: string[]) => void;
}

export const InterestsEditor: React.FC<InterestsEditorProps> = ({ interests = [], onChange }) => {
    const [newInterest, setNewInterest] = useState("");

    const handleAdd = () => {
        if (newInterest.trim() && !interests.includes(newInterest.trim())) {
            onChange([...interests, newInterest.trim()]);
            setNewInterest("");
        }
    };

    const handleRemove = (interestToRemove: string) => {
        onChange(interests.filter(i => i !== interestToRemove));
    };

    return (
        <View className="px-6 mb-6">
            <Typography variant="h3" className="mb-3 text-white">
                Interests
            </Typography>
            <View className="flex-row flex-wrap gap-2 mb-3">
                {interests.map((interest) => (
                    <Chip
                        key={interest}
                        label={interest}
                        variant="primary"
                        onPress={() => handleRemove(interest)} // Tap to remove
                    />
                ))}
            </View>
            <View className="flex-row gap-2">
                <TextInput
                    value={newInterest}
                    onChangeText={setNewInterest}
                    placeholder="Add an interest..."
                    placeholderTextColor="rgba(255,255,255,0.3)"
                    className="flex-1 bg-white/5 border border-white/10 rounded-full px-4 py-2 text-white h-10"
                    onSubmitEditing={handleAdd}
                />
                <Pressable
                    onPress={handleAdd}
                    className="w-10 h-10 rounded-full bg-[#7C3AED] items-center justify-center"
                >
                    <Plus size={20} color="white" />
                </Pressable>
            </View>
        </View>
    );
};
