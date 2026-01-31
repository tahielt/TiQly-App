import React, { useEffect } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Animated, {
    useSharedValue,
    useAnimatedStyle,
    withTiming,
    interpolateColor,
    interpolate,
    Extrapolate
} from 'react-native-reanimated';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';

interface HypeIndexWidgetProps {
    basePrice: number;
    askingPrice: number;
}

const HypeIndexWidget: React.FC<HypeIndexWidgetProps> = ({ basePrice, askingPrice }) => {
    const hypeRatio = askingPrice / basePrice;
    const progress = useSharedValue(0);

    const COOL_BLUE = '#00D9FF';
    const HOT_PINK = '#FF00CC';
    const NEON_CYAN = '#00FFFF';

    useEffect(() => {
        progress.value = withTiming(Math.min(hypeRatio, 3), { duration: 1500 });
    }, [hypeRatio]);

    const animatedStyle = useAnimatedStyle(() => {
        const width = interpolate(progress.value, [1, 3], [0, 100], Extrapolate.CLAMP);
        const backgroundColor = interpolateColor(
            progress.value,
            [1, 1.5, 2.5],
            [COOL_BLUE, HOT_PINK, NEON_CYAN]
        );

        return {
            width: `${width}%`,
            backgroundColor,
        };
    });

    const glowStyle = useAnimatedStyle(() => {
        const shadowColor = interpolateColor(
            progress.value,
            [1, 2],
            [COOL_BLUE, NEON_CYAN]
        );
        const opacity = interpolate(progress.value, [1, 2], [0, 0.8]);

        return {
            shadowColor,
            opacity,
        };
    });

    const getHypeLabel = (ratio: number) => {
        if (ratio < 1.1) return 'NORMAL';
        if (ratio < 1.5) return 'RISING';
        if (ratio < 2.0) return 'HOT';
        return 'HYPER';
    };

    return (
        <View style={styles.container}>
            <BlurView intensity={20} style={styles.glassContainer}>
                <View style={styles.headerRow}>
                    <Text style={styles.label}>HYPE INDEX</Text>
                    <Animated.View style={[styles.statusBadge, glowStyle]}>
                        <Text style={styles.statusText}>{getHypeLabel(hypeRatio)}</Text>
                    </Animated.View>
                </View>

                <View style={styles.track}>
                    <Animated.View style={[styles.bar, animatedStyle]} />

                    <View style={[styles.tick, { left: '33%' }]} />
                    <View style={[styles.tick, { left: '66%' }]} />
                </View>

                <View style={styles.statsRow}>
                    <Text style={styles.statsLabel}>Base: ${basePrice}</Text>
                    <Text style={styles.statsValue}>{((hypeRatio - 1) * 100).toFixed(0)}% UP</Text>
                </View>
            </BlurView>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        marginVertical: 10,
        borderRadius: 16,
        overflow: 'hidden',
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.1)',
    },
    glassContainer: {
        padding: 16,
        backgroundColor: 'rgba(0,0,0,0.4)',
    },
    headerRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 12,
    },
    label: {
        color: '#888',
        fontSize: 12,
        fontWeight: 'bold',
        letterSpacing: 1,
    },
    statusBadge: {
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 4,
        backgroundColor: 'rgba(255,255,255,0.1)',
        shadowOffset: { width: 0, height: 0 },
        shadowRadius: 10,
    },
    statusText: {
        color: '#fff',
        fontSize: 10,
        fontWeight: '900',
    },
    track: {
        height: 6,
        backgroundColor: 'rgba(255,255,255,0.1)',
        borderRadius: 3,
        overflow: 'hidden',
        marginBottom: 8,
        position: 'relative',
    },
    bar: {
        height: '100%',
        borderRadius: 3,
    },
    tick: {
        position: 'absolute',
        top: 0,
        bottom: 0,
        width: 1,
        backgroundColor: '#000',
        opacity: 0.3,
    },
    statsRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    statsLabel: {
        color: '#666',
        fontSize: 12,
    },
    statsValue: {
        color: '#fff',
        fontSize: 14,
        fontWeight: 'bold',
    },
});

export default HypeIndexWidget;
