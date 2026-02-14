import React from "react";
import { View, TextInput, Pressable } from "react-native";
import { Typography } from "../ui/Typography";
import { Plus, Trash2 } from "lucide-react-native";

interface PromptsEditorProps {
    prompts: string[];
    onChange: (prompts: string[]) => void;
}

export const PromptsEditor: React.FC<PromptsEditorProps> = ({ prompts = [], onChange }) => {

    const maxPrompts = 3;

    const handleUpdate = (text: string, index: number) => {
        const newPrompts = [...prompts];
        newPrompts[index] = text;
        onChange(newPrompts);
    };

    const handleAdd = () => {
        if (prompts.length < maxPrompts) {
            onChange([...prompts, ""]);
        }
    };

    const handleRemove = (index: number) => {
        const newPrompts = prompts.filter((_, i) => i !== index);
        onChange(newPrompts);
    };

    return (
        <View className="px-6 mb-6">
            <View className="flex-row justify-between items-center mb-3">
                <Typography variant="h3" className="text-white">
                    Prompts ({prompts.length}/{maxPrompts})
                </Typography>
                {prompts.length < maxPrompts && (
                    <Pressable onPress={handleAdd}>
                        <Typography variant="caption" className="text-[#6A1BFF] font-bold">+ Add Prompt</Typography>
                    </Pressable>
                )}
            </View>

            <View className="gap-4">
                {prompts.map((prompt, index) => (
                    <View key={index} className="relative">
                        <TextInput
                            value={prompt}
                            onChangeText={(text) => handleUpdate(text, index)}
                            placeholder="Write a prompt..."
                            placeholderTextColor="rgba(255,255,255,0.3)"
                            multiline
                            className="bg-white/5 border border-white/10 rounded-xl p-4 text-white min-h-[60px] pr-10" // Padding for delete button
                        />
                        <Pressable
                            onPress={() => handleRemove(index)}
                            className="absolute right-3 top-3 p-1"
                        >
                            <Trash2 size={16} color="#EF4444" />
                        </Pressable>
                    </View>
                ))}
            </View>
        </View>
    );
};
