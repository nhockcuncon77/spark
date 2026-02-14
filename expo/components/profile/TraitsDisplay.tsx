import React from "react";
import { View } from "react-native";
import { Typography } from "../ui/Typography";

interface Trait {
    key: string;
    value: number; // 1-5
}

interface TraitsDisplayProps {
    traits: Trait[] | Record<string, number>;
}

export const TraitsDisplay: React.FC<TraitsDisplayProps> = ({ traits }) => {
    // Normalize input to array
    const traitArray: Trait[] = Array.isArray(traits)
        ? traits
        : Object.entries(traits).map(([key, value]) => ({ key, value }));

    if (traitArray.length === 0) return null;

    return (
        <View className="px-6 mb-6">
            <Typography variant="h3" className="mb-3 text-white">
                Personality
            </Typography>
            <View className="flex-row flex-wrap gap-2">
                {traitArray.map((trait) => (
                    <View
                        key={trait.key}
                        className="flex-row items-center bg-white/5 rounded-full px-3 py-1.5 border border-white/10"
                    >
                        <Typography variant="body" className="text-white mr-2">
                            {trait.key}
                        </Typography>
                        <View className="flex-row gap-0.5">
                            {[1, 2, 3, 4, 5].map((level) => (
                                <View
                                    key={level}
                                    className={`w-1.5 h-3 rounded-full ${level <= trait.value ? 'bg-[#7C3AED]' : 'bg-white/10'}`}
                                />
                            ))}
                        </View>
                    </View>
                ))}
            </View>
        </View>
    );
};
