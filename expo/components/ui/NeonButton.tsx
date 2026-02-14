import React from "react";
import { Pressable, Text, StyleSheet, View, PressableProps } from "react-native";
import { LinearGradient } from "expo-linear-gradient";

interface NeonButtonProps extends PressableProps {
    variant?: "primary" | "secondary" | "destructive" | "ghost";
    size?: "sm" | "md" | "lg" | "icon";
    children: React.ReactNode;
    glow?: boolean;
}

export const NeonButton: React.FC<NeonButtonProps> = ({
    children,
    variant = "primary",
    size = "md",
    glow = true,
    style,
    disabled,
    ...props
}) => {
    const getGradientColors = (): [string, string, ...string[]] => {
        if (disabled) return ["#333", "#333"];

        switch (variant) {
            case "primary":
                return ["#6A1BFF", "#9B6BFF"]; // Purple
            case "secondary":
                // Orange/Love
                return ["#FF9A45", "#FFC27B"];
            case "destructive":
                // Red
                return ["#FF4C61", "#FF7686"];
            case "ghost":
                // Transparent needs a partner
                return ["transparent", "transparent"];
            default:
                return ["#6A1BFF", "#9B6BFF"];
        }
    };

    const getShadowColor = () => {
        switch (variant) {
            case "primary": return "#6A1BFF";
            case "secondary": return "#FF9A45";
            case "destructive": return "#FF4C61";
            default: return "transparent";
        }
    };

    const getSizeStyles = () => {
        switch (size) {
            case "sm": return { paddingHorizontal: 16, paddingVertical: 8, minHeight: 40 };
            case "lg": return { paddingHorizontal: 32, paddingVertical: 16, minHeight: 64 };
            case "icon": return { width: 48, height: 48, padding: 0, justifyContent: 'center' as const };
            default: return { paddingHorizontal: 24, paddingVertical: 12, minHeight: 52 };
        }
    };

    const baseStyles = [
        styles.button,
        getSizeStyles(),
        glow && !disabled && variant !== 'ghost' && {
            shadowColor: getShadowColor(),
            shadowOffset: { width: 0, height: 0 },
            shadowOpacity: 0.6,
            shadowRadius: 12,
            elevation: 8,
        },
        disabled && styles.disabled,
        // Add border for ghost or outlined if needed, for now mostly filled
        variant === 'ghost' && styles.ghost,
    ];

    return (
        <Pressable
            style={({ pressed }) => [
                ...baseStyles,
                pressed && { transform: [{ scale: 0.96 }] },
                // User style override
                typeof style === 'object' ? style : {}
            ]}
            disabled={disabled}
            {...props}
        >
            <LinearGradient
                colors={getGradientColors()}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={[styles.gradient, size === 'icon' && { borderRadius: 999 }]}
            >
                {typeof children === 'string' ? (
                    <Text style={[styles.text, size === 'lg' && styles.textLg]}>{children}</Text>
                ) : (
                    children
                )}
            </LinearGradient>
        </Pressable>
    );
};

const styles = StyleSheet.create({
    button: {
        borderRadius: 999,
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "center",
    },
    gradient: {
        borderRadius: 999,
        width: '100%',
        height: '100%',
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "center",
    },
    disabled: {
        opacity: 0.5,
    },
    ghost: {
        backgroundColor: 'transparent',
    },
    text: {
        color: "#FFFFFF",
        fontSize: 16,
        fontWeight: "bold",
        textAlign: "center",
    },
    textLg: {
        fontSize: 18,
    }
});
