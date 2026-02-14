import React from "react";
import { View } from "react-native";
import { Typography } from "../ui/Typography";
import { Chip } from "../ui/Chip";
import { Briefcase, GraduationCap, Moon, Languages, Heart, Dumbbell, Wine, Cigarette, Baby, Users } from "lucide-react-native";

interface MetadataDisplayProps {
    extra?: {
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
    };
    hobbies?: string[];
    interests?: string[];
}

export const MetadataDisplay: React.FC<MetadataDisplayProps> = ({ extra, hobbies, interests }) => {
    const hasContent = hobbies?.length || interests?.length || extra;

    if (!hasContent) return null;

    return (
        <View className="px-6 mb-6 gap-6">
            {/* Hobbies & Interests */}
            {(hobbies?.length || interests?.length) && (
                <View>
                    <Typography variant="h3" className="mb-3 text-white">
                        Interests
                    </Typography>
                    <View className="flex-row flex-wrap gap-2">
                        {hobbies?.map((hobby) => (
                            <Chip key={hobby} label={hobby} variant="primary" />
                        ))}
                        {interests?.map((interest) => (
                            <Chip key={interest} label={interest} variant="outline" />
                        ))}
                    </View>
                </View>
            )}

            {/* Structured Metadata */}
            {extra && (
                <View>
                    <Typography variant="h3" className="mb-3 text-white">
                        Details
                    </Typography>
                    <View className="flex-row flex-wrap gap-2">
                        {extra.work && (
                            <Chip label={extra.work} icon={<Briefcase size={14} color="#E6E6F0" />} variant="default" />
                        )}
                        {extra.school && (
                            <Chip label={extra.school} icon={<GraduationCap size={14} color="#E6E6F0" />} variant="default" />
                        )}
                        {extra.zodiac && (
                            <Chip label={extra.zodiac} icon={<Moon size={14} color="#E6E6F0" />} variant="default" />
                        )}
                        {extra.looking_for?.map(item => (
                            <Chip key={item} label={item} icon={<Heart size={12} color="#7C3AED" />} variant="outline" />
                        ))}
                        {extra.languages?.map(lang => (
                            <Chip key={lang} label={lang} icon={<Languages size={14} color="#E6E6F0" />} variant="default" />
                        ))}
                        {extra.excercise && (
                            <Chip label={extra.excercise} icon={<Dumbbell size={14} color="#E6E6F0" />} variant="default" />
                        )}
                        {extra.drinking && (
                            <Chip label={extra.drinking} icon={<Wine size={14} color="#E6E6F0" />} variant="default" />
                        )}
                        {extra.smoking && (
                            <Chip label={extra.smoking} icon={<Cigarette size={14} color="#E6E6F0" />} variant="default" />
                        )}
                    </View>
                </View>
            )}
        </View>
    );
};
