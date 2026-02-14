import React from "react";
import { View, TextInput } from "react-native";
import { Typography } from "../ui/Typography";

interface MetadataEditorProps {
    extra: {
        school?: string;
        work?: string;
        zodiac?: string;
        // ... other fields
    };
    onChange: (key: string, value: string) => void;
}

export const MetadataEditor: React.FC<MetadataEditorProps> = ({ extra, onChange }) => {
    return (
        <View className="px-6 mb-6">
            <Typography variant="h3" className="mb-4 text-white">
                Details
            </Typography>
            <View className="gap-4">
                <View>
                    <Typography variant="label" className="text-white/60 mb-1.5 ml-1">
                        Work / Job Title
                    </Typography>
                    <TextInput
                        value={extra.work}
                        onChangeText={(text) => onChange('work', text)}
                        placeholder="e.g. Designer at Tech Co"
                        placeholderTextColor="rgba(255,255,255,0.3)"
                        className="bg-white/5 border border-white/10 rounded-xl p-4 text-white"
                    />
                </View>
                <View>
                    <Typography variant="label" className="text-white/60 mb-1.5 ml-1">
                        School / University
                    </Typography>
                    <TextInput
                        value={extra.school}
                        onChangeText={(text) => onChange('school', text)}
                        placeholder="e.g. University of Design"
                        placeholderTextColor="rgba(255,255,255,0.3)"
                        className="bg-white/5 border border-white/10 rounded-xl p-4 text-white"
                    />
                </View>
                <View>
                    <Typography variant="label" className="text-white/60 mb-1.5 ml-1">
                        Zodiac Sign
                    </Typography>
                    <TextInput
                        value={extra.zodiac}
                        onChangeText={(text) => onChange('zodiac', text)}
                        placeholder="e.g. Leo"
                        placeholderTextColor="rgba(255,255,255,0.3)"
                        className="bg-white/5 border border-white/10 rounded-xl p-4 text-white"
                    />
                </View>
            </View>
        </View>
    );
};
