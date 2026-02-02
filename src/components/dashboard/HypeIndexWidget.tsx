import React, { useEffect } from 'react';
import { View, Text, StyleSheet, Dimensions } from 'react-native';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, {
    useSharedValue,
    useAnimatedStyle,
    withTiming,
    withRepeat,
    withSequence,
    Easing,
    interpolate,
} from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import { HypeIndexData } from '../../types/dashboard';

const { width } = Dimensions.get('window');
const GAUGE_SIZE = (width - 64) / 2 - 16;

interface HypeIndexWidgetProps {
    data: HypeIndexData;
    isLoading?: boolean;
}

const HypeIndexWidget: React.FC<HypeIndexWidgetProps> = ({ data, isLoading }) => {
    const fillProgress = useSharedValue(0);
    const glowOpacity = useSharedValue(0.4);

    useEffect(() => {
        const targetProgress = Math.min(data.multiplier / 3, 1);
        fillProgress.value = withTiming(targetProgress, {
            duration: 1200,
            easing: Easing.out(Easing.cubic),
        });

        if (data.multiplier > 1.5) {
            glowOpacity.value = withRepeat(
                withSequence(
                    withTiming(0.9, { duration: 1000 }),
                    withTiming(0.4, { duration: 1000 })
                ),
                -1,
                true
            );
        }
    }, [data.multiplier]);

    const fillStyle = useAnimatedStyle(() => ({
        height: `${interpolate(fillProgress.value, [0, 1], [0, 100])}%`,
    }));

    const glowStyle = useAnimatedStyle(() => ({
        opacity: glowOpacity.value,
    }));

    const getMultiplierColor = () => {
        if (data.multiplier >= 2) return '#FF4444';
        if (data.multiplier >= 1.5) return '#00D9FF';
        return '#00FF9D';
    };

    const getTrendIcon = () => {
        switch (data.trendDirection) {
            case 'up': return 'trending-up';
            case 'down': return 'trending-down';
            default: return 'remove';
        }
    };

    return (
        <View style={styles.container}>
            <Animated.View style={[styles.glowContainer, glowStyle]}>
                <LinearGradient
                    colors={['transparent', getMultiplierColor()]}
                    style={styles.glowGradient}
                />
            </Animated.View>

            <BlurView intensity={40} tint="dark" style={styles.blurContainer}>
                <LinearGradient
                    colors={['rgba(0,217,255,0.1)', 'rgba(0,0,0,0.6)']}
                    style={styles.innerGradient}
                >
                    <Text style={styles.label}>HYPE INDEX</Text>

                    <View style={styles.gaugeContainer}>
                        <View style={styles.gaugeBackground}>
                            <Animated.View style={[styles.gaugeFill, fillStyle]}>
                                <LinearGradient
                                    colors={[getMultiplierColor(), 'rgba(0,217,255,0.3)']}
                                    style={StyleSheet.absoluteFill}
                                />
                            </Animated.View>
                        </View>

                        <View style={styles.gaugeCenter}>
                            <Text style={[styles.multiplierValue, { color: getMultiplierColor() }]}>
                                {data.multiplier.toFixed(1)}x
                            </Text>
                            <View style={styles.trendRow}>
                                <Ionicons
                                    name={getTrendIcon()}
                                    size={14}
                                    color={data.trendDirection === 'up' ? '#00FF9D' : data.trendDirection === 'down' ? '#FF4444' : '#666'}
                                />
                            </View>
                        </View>
                    </View>

                    <View style={styles.priceRow}>
                        <View style={styles.priceItem}>
                            <Text style={styles.priceLabel}>Base</Text>
                            <Text style={styles.priceValue}>${data.basePrice.toLocaleString()}</Text>
                        </View>
                        <View style={styles.priceDivider} />
                        <View style={styles.priceItem}>
                            <Text style={styles.priceLabel}>Avg Ask</Text>
                            <Text style={[styles.priceValue, { color: getMultiplierColor() }]}>
                                ${data.averageAskingPrice.toLocaleString()}
                            </Text>
                        </View>
                    </View>
                </LinearGradient>
            </BlurView>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        borderRadius: 20,
        overflow: 'hidden',
        minHeight: 180,
    },
    glowContainer: {
        ...StyleSheet.absoluteFillObject,
        borderRadius: 20,
    },
    glowGradient: {
        flex: 1,
        borderRadius: 20,
    },
    blurContainer: {
        flex: 1,
        borderRadius: 20,
        overflow: 'hidden',
        borderWidth: 1,
        borderColor: 'rgba(0,217,255,0.2)',
    },
    innerGradient: {
        flex: 1,
        padding: 16,
        alignItems: 'center',
    },
    label: {
        color: '#00D9FF',
        fontSize: 10,
        fontWeight: '900',
        letterSpacing: 2,
        marginBottom: 12,
    },
    gaugeContainer: {
        width: GAUGE_SIZE * 0.7,
        height: GAUGE_SIZE * 0.7,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 12,
    },
    gaugeBackground: {
        ...StyleSheet.absoluteFillObject,
        backgroundColor: 'rgba(255,255,255,0.05)',
        borderRadius: GAUGE_SIZE * 0.35,
        overflow: 'hidden',
        justifyContent: 'flex-end',
    },
    gaugeFill: {
        width: '100%',
        borderRadius: 4,
        overflow: 'hidden',
    },
    gaugeCenter: {
        alignItems: 'center',
    },
    multiplierValue: {
        fontSize: 28,
        fontWeight: '900',
    },
    trendRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginTop: 2,
    },
    priceRow: {
        flexDirection: 'row',
        alignItems: 'center',
        width: '100%',
    },
    priceItem: {
        flex: 1,
        alignItems: 'center',
    },
    priceDivider: {
        width: 1,
        height: 24,
        backgroundColor: 'rgba(255,255,255,0.1)',
    },
    priceLabel: {
        color: '#666',
        fontSize: 9,
        fontWeight: 'bold',
        textTransform: 'uppercase',
        marginBottom: 2,
    },
    priceValue: {
        color: '#fff',
        fontSize: 12,
        fontWeight: 'bold',
    },
});

export default HypeIndexWidget;
