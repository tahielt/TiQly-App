import React, { useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image } from 'react-native';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, {
    useSharedValue,
    useAnimatedStyle,
    withRepeat,
    withSequence,
    withTiming,
    Easing,
} from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { Ionicons } from '@expo/vector-icons';
import { ResaleListing } from '../../types/dashboard';

interface TicketCardProps {
    listing: ResaleListing;
    onPress?: () => void;
}

const NEON_CYAN = '#00D9FF';
const HIGH_DEMAND_THRESHOLD = 2;

const TicketCard: React.FC<TicketCardProps> = ({ listing, onPress }) => {
    const glowOpacity = useSharedValue(0);
    const borderGlow = useSharedValue(0);
    const scale = useSharedValue(1);

    const markupMultiplier = listing.askingPrice / listing.originalPrice;
    const isHighDemand = markupMultiplier >= HIGH_DEMAND_THRESHOLD;

    useEffect(() => {
        if (isHighDemand) {
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
            setTimeout(() => {
                Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
            }, 150);
            glowOpacity.value = withRepeat(
                withSequence(
                    withTiming(0.9, { duration: 1200, easing: Easing.inOut(Easing.sin) }),
                    withTiming(0.3, { duration: 1200, easing: Easing.inOut(Easing.sin) })
                ),
                -1,
                true
            );

            borderGlow.value = withRepeat(
                withSequence(
                    withTiming(1, { duration: 800 }),
                    withTiming(0.4, { duration: 800 })
                ),
                -1,
                true
            );
        }
    }, [isHighDemand]);

    const animatedGlowStyle = useAnimatedStyle(() => ({
        opacity: glowOpacity.value,
        shadowOpacity: glowOpacity.value,
    }));

    const animatedBorderStyle = useAnimatedStyle(() => ({
        opacity: borderGlow.value,
    }));

    const handlePressIn = () => {
        scale.value = withTiming(0.98, { duration: 100 });
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    };

    const handlePressOut = () => {
        scale.value = withTiming(1, { duration: 100 });
    };

    const scaleStyle = useAnimatedStyle(() => ({
        transform: [{ scale: scale.value }],
    }));

    const formatDate = (date: Date) => {
        return new Date(date).toLocaleDateString('es-AR', {
            day: 'numeric',
            month: 'short',
        });
    };

    return (
        <Animated.View style={[styles.container, scaleStyle]}>
            {isHighDemand && (
                <Animated.View style={[styles.outerGlow, animatedGlowStyle]} />
            )}
            {isHighDemand && (
                <Animated.View style={[styles.circuitBorder, animatedBorderStyle]}>
                    <LinearGradient
                        colors={[NEON_CYAN, 'rgba(0,217,255,0.3)', NEON_CYAN]}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 1 }}
                        style={StyleSheet.absoluteFill}
                    />
                </Animated.View>
            )}

            <TouchableOpacity
                activeOpacity={0.9}
                onPress={onPress}
                onPressIn={handlePressIn}
                onPressOut={handlePressOut}
                style={styles.touchable}
            >
                <BlurView intensity={30} tint="dark" style={styles.blurContent}>
                    <View style={styles.content}>
                        <View style={styles.imageContainer}>
                            {listing.eventImage ? (
                                <Image source={{ uri: listing.eventImage }} style={styles.eventImage} />
                            ) : (
                                <LinearGradient
                                    colors={['#1a1a1a', '#0a0a0a']}
                                    style={styles.imagePlaceholder}
                                >
                                    <Ionicons name="ticket" size={24} color="#333" />
                                </LinearGradient>
                            )}
                        </View>

                        <View style={styles.infoSection}>
                            <View style={styles.topRow}>
                                <Text style={styles.eventTitle} numberOfLines={1}>
                                    {listing.eventTitle}
                                </Text>
                                {isHighDemand && (
                                    <View style={styles.hotBadge}>
                                        <Ionicons name="flame" size={10} color="#FF4444" />
                                        <Text style={styles.hotBadgeText}>HOT</Text>
                                    </View>
                                )}
                            </View>

                            <View style={styles.metaRow}>
                                <Text style={styles.tierBadge}>{listing.ticketTier}</Text>
                                <Text style={styles.dateText}>{formatDate(listing.eventDate)}</Text>
                            </View>

                            <View style={styles.priceRow}>
                                <View style={styles.priceColumn}>
                                    <Text style={styles.priceLabel}>Original</Text>
                                    <Text style={styles.originalPrice}>
                                        ${listing.originalPrice.toLocaleString()}
                                    </Text>
                                </View>
                                <Ionicons name="arrow-forward" size={16} color="#444" />
                                <View style={styles.priceColumn}>
                                    <Text style={styles.priceLabel}>Precio</Text>
                                    <Text style={[
                                        styles.askingPrice,
                                        isHighDemand && styles.highDemandPrice
                                    ]}>
                                        ${listing.askingPrice.toLocaleString()}
                                    </Text>
                                </View>
                                <View style={styles.multiplierBadge}>
                                    <Text style={[
                                        styles.multiplierText,
                                        isHighDemand && styles.highDemandMultiplier
                                    ]}>
                                        {markupMultiplier.toFixed(1)}x
                                    </Text>
                                </View>
                            </View>
                        </View>
                    </View>
                </BlurView>
            </TouchableOpacity>
        </Animated.View>
    );
};

const styles = StyleSheet.create({
    container: {
        marginHorizontal: 16,
        marginVertical: 6,
        borderRadius: 16,
        overflow: 'visible',
    },
    outerGlow: {
        position: 'absolute',
        top: -4,
        left: -4,
        right: -4,
        bottom: -4,
        borderRadius: 20,
        backgroundColor: NEON_CYAN,
        shadowColor: NEON_CYAN,
        shadowOffset: { width: 0, height: 0 },
        shadowRadius: 20,
        elevation: 10,
    },
    circuitBorder: {
        position: 'absolute',
        top: -2,
        left: -2,
        right: -2,
        bottom: -2,
        borderRadius: 18,
        overflow: 'hidden',
    },
    touchable: {
        borderRadius: 16,
        overflow: 'hidden',
    },
    blurContent: {
        borderRadius: 16,
        overflow: 'hidden',
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.08)',
    },
    content: {
        flexDirection: 'row',
        padding: 12,
        gap: 12,
    },
    imageContainer: {
        width: 64,
        height: 64,
        borderRadius: 12,
        overflow: 'hidden',
    },
    eventImage: {
        width: '100%',
        height: '100%',
    },
    imagePlaceholder: {
        width: '100%',
        height: '100%',
        justifyContent: 'center',
        alignItems: 'center',
    },
    infoSection: {
        flex: 1,
        justifyContent: 'space-between',
    },
    topRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: 8,
    },
    eventTitle: {
        color: '#fff',
        fontSize: 14,
        fontWeight: '700',
        flex: 1,
    },
    hotBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'rgba(255,68,68,0.15)',
        paddingHorizontal: 6,
        paddingVertical: 2,
        borderRadius: 6,
        gap: 2,
        borderWidth: 1,
        borderColor: 'rgba(255,68,68,0.3)',
    },
    hotBadgeText: {
        color: '#FF4444',
        fontSize: 8,
        fontWeight: '900',
    },
    metaRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    tierBadge: {
        color: NEON_CYAN,
        fontSize: 10,
        fontWeight: 'bold',
        backgroundColor: 'rgba(0,217,255,0.1)',
        paddingHorizontal: 6,
        paddingVertical: 2,
        borderRadius: 4,
        overflow: 'hidden',
    },
    dateText: {
        color: '#666',
        fontSize: 11,
    },
    priceRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    priceColumn: {
        alignItems: 'flex-start',
    },
    priceLabel: {
        color: '#555',
        fontSize: 8,
        fontWeight: 'bold',
        textTransform: 'uppercase',
    },
    originalPrice: {
        color: '#888',
        fontSize: 12,
        fontWeight: '600',
        textDecorationLine: 'line-through',
    },
    askingPrice: {
        color: '#fff',
        fontSize: 14,
        fontWeight: '900',
    },
    highDemandPrice: {
        color: NEON_CYAN,
    },
    multiplierBadge: {
        marginLeft: 'auto',
        backgroundColor: 'rgba(255,255,255,0.05)',
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 8,
    },
    multiplierText: {
        color: '#888',
        fontSize: 12,
        fontWeight: '900',
    },
    highDemandMultiplier: {
        color: NEON_CYAN,
    },
});

export default TicketCard;
