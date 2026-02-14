import React from "react";
import { View, Pressable } from "react-native";
import { Typography } from "../ui/Typography";

interface Trait {
    key: string;
    value: number; // 1-5
}

interface TraitsEditorProps {
    traits: Trait[];
    onChange: (traits: Trait[]) => void;
}

export const TraitsEditor: React.FC<TraitsEditorProps> = ({ traits, onChange }) => {
    const handleTraitChange = (key: string, newValue: number) => {
        const newTraits = traits.map(t =>
            t.key === key ? { ...t, value: newValue } : t
        );
        // If trait doesn't exist, add it? Assuming fixed list for now or passed in traits are the active ones.
        // If the backend has a fixed list of available traits, we should render ALL of them here.
        // For simplicity, let's assume we edit existing ones or have a predefined list.
        onChange(newTraits);
    };

    // Available traits mockup - in real app, fetch from config/constants
    // For this component, we'll assume `traits` passed in are the ONES TO EDIT.

    return (
        <View className="px-6 mb-6">
            <Typography variant="h3" className="mb-4 text-white">
                Personality Traits
            </Typography>
            <View className="gap-6">
                {traits.map((trait) => (
                    <View key={trait.key}>
                        <View className="flex-row justify-between mb-2">
                            <Typography variant="body" className="text-white font-medium capitalize">
                                {trait.key}
                            </Typography>
                            <Typography variant="caption" className="text-[#A78BFA]">
                                {trait.value}/5
                            </Typography>
                        </View>
                        <View className="flex-row justify-between gap-1 bg-white/5 p-1 rounded-full">
                            {[1, 2, 3, 4, 5].map((level) => (
                                <Pressable
                                    key={level}
                                    onPress={() => handleTraitChange(trait.key, level)}
                                    className={`flex-1 h-8 rounded-full items-center justify-center ${level === trait.value ? 'bg-[#7C3AED]' :
                                        level < trait.value ? 'bg-[#7C3AED]/40' : 'transparent'
                                        }`}
                                >
                                    <Typography
                                        variant="caption"
                                        className={`${level <= trait.value ? 'text-white' : 'text-white/30'}`}
                                    >
                                        {level}
                                    </Typography>
                                </Pressable>
                            ))}
                        </View>
                    </View>
                ))}
            </View>
        </View>
    );
};
