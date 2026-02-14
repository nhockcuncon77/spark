import React from "react";
import { View, StyleSheet } from "react-native";
import { Typography } from "../ui/Typography";
import { MessageCircle } from "lucide-react-native";

interface PromptsDisplayProps {
    prompts: string[];
}

export const PromptsDisplay: React.FC<PromptsDisplayProps> = ({ prompts }) => {
    if (!prompts || prompts.length === 0) return null;

    return (
        <View style={styles.container}>
            <Typography variant="h3" className="mb-4 text-white">
                Prompts
            </Typography>
            <View style={styles.promptsList}>
                {prompts.map((prompt, index) => (
                    <View key={index} style={styles.promptCard}>
                        <View style={styles.iconBadge}>
                            <MessageCircle size={14} color="#A78BFA" />
                        </View>
                        <Typography variant="body" className="text-white/90 flex-1 leading-relaxed">
                            {prompt}
                        </Typography>
                    </View>
                ))}
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        paddingHorizontal: 24,
        marginBottom: 24,
    },
    promptsList: {
        gap: 12,
    },
    promptCard: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        gap: 12,
        backgroundColor: 'rgba(124, 58, 237, 0.08)',
        borderRadius: 16,
        padding: 16,
        borderWidth: 1,
        borderColor: 'rgba(124, 58, 237, 0.15)',
    },
    iconBadge: {
        width: 28,
        height: 28,
        borderRadius: 14,
        backgroundColor: 'rgba(124, 58, 237, 0.15)',
        alignItems: 'center',
        justifyContent: 'center',
        marginTop: 2,
    },
});
