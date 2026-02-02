/**
 * ResaleListingCard - Card component for resale marketplace
 * Follows TiQly Sci-Fi/Dopamine design system from AGENTS.md
 * 
 * Features:
 * - Glassmorphism with BlurView
 * - Animated neon glow for high-demand items
 * - Haptic feedback
 * - Fee breakdown display
 */

import React, { useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image } from 'react-native';
import Animated, {
    useSharedValue,
    useAnimatedStyle,
    withRepeat,
    withTiming,
    withSequence,
    interpolateColor
} from 'react-native-reanimated';
import { BlurView } from 'expo-blur';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { ResaleListing } from '../types/resale';
import { calculateResaleFees } from '../services/resaleService';

interface ResaleListingCardProps {
    listing: ResaleListing;
    onPress: (listing: ResaleListing) => void;
    showFeeBreakdown?: boolean;
    variant?: 'buyer' | 'seller'; // buyer sees buyerPays, seller sees sellerReceives
}

const ResaleListingCard: React.FC<ResaleListingCardProps> = ({
    listing,
    onPress,
    showFeeBreakdown = false,
    variant = 'buyer'
}) => {
    // High demand = price > 1.5x original (we don't have original here, so use asking > 10000)
    const isHighDemand = listing.askingPrice >= 10000;
    const glowOpacity = useSharedValue(0);

    useEffect(() => {
        if (isHighDemand) {
            glowOpacity.value = withRepeat(
                withSequence(
                    withTiming(0.6, { duration: 1000 }),
                    withTiming(0.2, { duration: 1000 })
                ),
                -1,
                true
            );
        }
    }, [isHighDemand]);

    const handlePress = () => {
        if (isHighDemand) {
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        } else {
            Haptics.selectionAsync();
        }
        onPress(listing);
    };

    const glowStyle = useAnimatedStyle(() => {
        return {
            shadowColor: '#00FFFF',
            shadowOffset: { width: 0, height: 0 },
            shadowOpacity: glowOpacity.value,
            shadowRadius: 20,
            borderColor: interpolateColor(
                glowOpacity.value,
                [0.2, 0.6],
                ['rgba(0,255,255,0.1)', 'rgba(0,255,255,0.6)']
            )
        };
    });

    const formatCurrency = (amount: number) => {
        return `$${amount.toLocaleString('es-AR')}`;
    };

    const formatDate = (date?: Date) => {
        if (!date) return '';
        return date.toLocaleDateString('es-AR', {
            weekday: 'short',
            day: 'numeric',
            month: 'short'
        });
    };

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'listed': return '#00FFFF';
            case 'sold': return '#00FF88';
            case 'cancelled': return '#666';
            case 'expired': return '#FF4444';
            default: return '#666';
        }
    };

    const getStatusLabel = (status: string) => {
        switch (status) {
            case 'listed': return 'EN VENTA';
            case 'sold': return 'VENDIDO';
            case 'cancelled': return 'CANCELADO';
            case 'expired': return 'EXPIRADO';
            default: return status.toUpperCase();
        }
    };

    return (
        <Animated.View style={[styles.container, isHighDemand && glowStyle]}>
            <TouchableOpacity onPress={handlePress} activeOpacity={0.9}>
                <BlurView intensity={isHighDemand ? 40 : 20} tint="dark" style={styles.glassContent}>
                    {/* Header: Event info */}
                    <View style={styles.header}>
                        <View style={styles.eventInfo}>
                            <Text style={styles.eventTitle} numberOfLines={1}>
                                {listing.eventTitle || 'Evento'}
                            </Text>
                            <Text style={styles.eventDate}>
                                {formatDate(listing.eventDate)}
                            </Text>
                            {listing.ticketTypeName && (
                                <View style={styles.tierBadge}>
                                    <Text style={styles.tierText}>{listing.ticketTypeName}</Text>
                                </View>
                            )}
                        </View>

                        {/* Status badge */}
                        <View style={[styles.statusBadge, { backgroundColor: getStatusColor(listing.status) }]}>
                            <Text style={styles.statusText}>{getStatusLabel(listing.status)}</Text>
                        </View>
                    </View>

                    {/* Body: Pricing */}
                    <View style={styles.body}>
                        <View style={styles.priceSection}>
                            <Text style={styles.priceLabel}>
                                {variant === 'buyer' ? 'TOTAL A PAGAR' : 'VAS A RECIBIR'}
                            </Text>
                            <Text style={[styles.priceValue, isHighDemand && styles.neonText]}>
                                {variant === 'buyer'
                                    ? formatCurrency(listing.buyerPays)
                                    : formatCurrency(listing.sellerReceives)
                                }
                            </Text>
                        </View>

                        {showFeeBreakdown && (
                            <View style={styles.feeBreakdown}>
                                <View style={styles.feeRow}>
                                    <Text style={styles.feeLabel}>Precio base</Text>
                                    <Text style={styles.feeValue}>{formatCurrency(listing.askingPrice)}</Text>
                                </View>
                                {variant === 'buyer' ? (
                                    <View style={styles.feeRow}>
                                        <Text style={styles.feeLabel}>Service fee TiQly</Text>
                                        <Text style={styles.feeValue}>+{formatCurrency(listing.buyerServiceFee)}</Text>
                                    </View>
                                ) : (
                                    <View style={styles.feeRow}>
                                        <Text style={styles.feeLabel}>Comisión TiQly</Text>
                                        <Text style={styles.feeValueNegative}>-{formatCurrency(listing.sellerCommission)}</Text>
                                    </View>
                                )}
                            </View>
                        )}
                    </View>

                    {/* Footer: Seller info or action hint */}
                    <View style={styles.footer}>
                        {listing.sellerName && variant === 'buyer' && (
                            <View style={styles.sellerInfo}>
                                <Ionicons name="person-circle-outline" size={16} color="#666" />
                                <Text style={styles.sellerName}>{listing.sellerName}</Text>
                            </View>
                        )}

                        {listing.status === 'listed' && (
                            <View style={styles.actionHint}>
                                <Text style={styles.actionText}>
                                    {variant === 'buyer' ? 'Tocar para comprar' : 'Tocar para gestionar'}
                                </Text>
                                <Ionicons name="chevron-forward" size={14} color="#00FFFF" />
                            </View>
                        )}
                    </View>

                    {/* Circuit decoration */}
                    <View style={styles.circuitDecoration} />
                </BlurView>
            </TouchableOpacity>
        </Animated.View>
    );
};

const styles = StyleSheet.create({
    container: {
        marginBottom: 16,
        borderRadius: 16,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.1)',
        overflow: 'hidden',
        backgroundColor: '#000',
    },
    glassContent: {
        padding: 16,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        marginBottom: 16,
    },
    eventInfo: {
        flex: 1,
        gap: 4,
    },
    eventTitle: {
        color: '#fff',
        fontWeight: '900',
        fontSize: 18,
        letterSpacing: 0.5,
    },
    eventDate: {
        color: '#888',
        fontSize: 14,
        fontWeight: '500',
    },
    tierBadge: {
        alignSelf: 'flex-start',
        backgroundColor: 'rgba(0,255,255,0.1)',
        paddingHorizontal: 8,
        paddingVertical: 2,
        borderRadius: 4,
        borderWidth: 1,
        borderColor: 'rgba(0,255,255,0.3)',
        marginTop: 4,
    },
    tierText: {
        color: '#00FFFF',
        fontSize: 10,
        fontWeight: 'bold',
        letterSpacing: 0.5,
    },
    statusBadge: {
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 8,
    },
    statusText: {
        color: '#000',
        fontSize: 10,
        fontWeight: 'bold',
    },
    body: {
        gap: 12,
        marginBottom: 12,
    },
    priceSection: {
        gap: 2,
    },
    priceLabel: {
        color: '#666',
        fontSize: 10,
        fontWeight: 'bold',
        letterSpacing: 1,
    },
    priceValue: {
        color: '#fff',
        fontSize: 28,
        fontWeight: 'bold',
    },
    neonText: {
        color: '#00FFFF',
        textShadowColor: 'rgba(0,255,255,0.5)',
        textShadowOffset: { width: 0, height: 0 },
        textShadowRadius: 10,
    },
    feeBreakdown: {
        backgroundColor: 'rgba(255,255,255,0.05)',
        borderRadius: 8,
        padding: 12,
        gap: 6,
    },
    feeRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
    },
    feeLabel: {
        color: '#888',
        fontSize: 12,
    },
    feeValue: {
        color: '#aaa',
        fontSize: 12,
        fontWeight: '500',
    },
    feeValueNegative: {
        color: '#FF6B6B',
        fontSize: 12,
        fontWeight: '500',
    },
    footer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    sellerInfo: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
    },
    sellerName: {
        color: '#666',
        fontSize: 12,
    },
    actionHint: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
    },
    actionText: {
        color: '#00FFFF',
        fontSize: 12,
        fontWeight: '500',
    },
    circuitDecoration: {
        position: 'absolute',
        bottom: 0,
        right: 0,
        width: 60,
        height: 60,
        borderRightWidth: 2,
        borderBottomWidth: 2,
        borderColor: 'rgba(255,255,255,0.05)',
        borderBottomRightRadius: 16,
    }
});

export default ResaleListingCard;
