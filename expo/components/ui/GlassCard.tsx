
import React from 'react';
import { View, ViewProps, StyleSheet } from 'react-native';
import { BlurView, BlurViewProps } from 'expo-blur';

interface GlassCardProps extends ViewProps {
    children: React.ReactNode;
    intensity?: number;
    tint?: BlurViewProps['tint'];
    variant?: 'default' | 'elevated' | 'modal';
}

export const GlassCard: React.FC<GlassCardProps> = ({
    children,
    style,
    intensity = 50,
    tint = "dark",
    variant = 'default',
    ...props
}) => {
    // Variant base styles
    const getBackgroundColor = () => {
        switch (variant) {
            case 'elevated':
                return 'rgba(255, 255, 255, 0.08)';
            case 'modal':
                return 'rgba(30, 20, 60, 0.7)';
            default:
                return 'rgba(255, 255, 255, 0.05)';
        }
    };

    const getBorderColor = () => {
        switch (variant) {
            case 'elevated':
                return 'rgba(255, 255, 255, 0.15)';
            default:
                return 'rgba(255, 255, 255, 0.1)';
        }
    };

    return (
        <View
            style={[
                styles.container,
                {
                    backgroundColor: getBackgroundColor(),
                    borderColor: getBorderColor(),
                },
                style
            ]}
            {...props}
        >
            <BlurView intensity={intensity} tint={tint} style={StyleSheet.absoluteFill} />
            {children}
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        overflow: 'hidden',
        borderRadius: 24,
        borderWidth: 1.5,
    }
});
