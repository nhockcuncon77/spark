import React, { useState } from "react";
import { View, TextInput, Pressable } from "react-native";
import { Typography } from "../ui/Typography";
import { Chip } from "../ui/Chip";
import { Plus } from "lucide-react-native";

interface HobbiesEditorProps {
    hobbies: string[];
    onChange: (hobbies: string[]) => void;
}

export const HobbiesEditor: React.FC<HobbiesEditorProps> = ({ hobbies = [], onChange }) => {
    const [newHobby, setNewHobby] = useState("");

    const handleAdd = () => {
        if (newHobby.trim() && !hobbies.includes(newHobby.trim())) {
            onChange([...hobbies, newHobby.trim()]);
            setNewHobby("");
        }
    };

    const handleRemove = (hobbyToRemove: string) => {
        onChange(hobbies.filter(h => h !== hobbyToRemove));
    };

    return (
        <View className="px-6 mb-6">
            <Typography variant="h3" className="mb-3 text-white">
                Hobbies
            </Typography>
            <View className="flex-row flex-wrap gap-2 mb-3">
                {hobbies.map((hobby) => (
                    <Chip
                        key={hobby}
                        label={hobby}
                        variant="outline"
                        onPress={() => handleRemove(hobby)}
                    />
                ))}
            </View>
            <View className="flex-row gap-2">
                <TextInput
                    value={newHobby}
                    onChangeText={setNewHobby}
                    placeholder="Add a hobby..."
                    placeholderTextColor="rgba(255,255,255,0.3)"
                    className="flex-1 bg-white/5 border border-white/10 rounded-full px-4 py-2 text-white h-10"
                    onSubmitEditing={handleAdd}
                />
                <Pressable
                    onPress={handleAdd}
                    className="w-10 h-10 rounded-full bg-[#A78BFA]/30 items-center justify-center border border-[#A78BFA]/40"
                >
                    <Plus size={20} color="#A78BFA" />
                </Pressable>
            </View>
        </View>
    );
};
