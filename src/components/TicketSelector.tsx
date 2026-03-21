import React, { useState, useEffect, useRef, useMemo } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image, Dimensions, Animated } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import { Ionicons } from '@expo/vector-icons';
import { DEFAULT_PRIMARY_FEE_PCT, roundMoney } from '../services/monetizationService';

const { width } = Dimensions.get('window');

interface TicketTierInput {
    id: string;
    name: string;
    price: number;
    available?: number;
    perks?: string[];
}

interface TicketTier extends TicketTierInput {
    color: string;
    textColor: string;
    souvenirImage: string;
    perks: string[];
}

const PALETTE = [
    {
        color: '#00D9FF',
        textColor: '#000',
        souvenirImage: 'https://cdn-icons-png.flaticon.com/512/6298/6298900.png',
    },
    {
        color: '#FFD700',
        textColor: '#000',
        souvenirImage: 'https://cdn-icons-png.flaticon.com/512/6941/6941697.png',
    },
    {
        color: '#E4CCFF',
        textColor: '#000',
        souvenirImage: 'https://cdn-icons-png.flaticon.com/512/6229/6229280.png',
    }
];

interface TicketSelectorProps {
    visible: boolean;
    onClose: () => void;
    onSelect: (tier: TicketTier) => void;
    tiers?: TicketTierInput[];
    feePercentage?: number;
}

const buildPerks = (tier: TicketTierInput) => {
    if (tier.perks && tier.perks.length > 0) return tier.perks;

    const perks = ['Entrada digital QR', 'Acceso al evento'];
    if (tier.available !== undefined) {
        perks.push(`${tier.available} disponibles`);
    } else {
        perks.push('Cupo limitado');
    }
    return perks;
};

const TicketSelector: React.FC<TicketSelectorProps> = ({
    visible,
    onClose,
    onSelect,
    tiers = [],
    feePercentage = DEFAULT_PRIMARY_FEE_PCT
}) => {
    const [selectedTierIndex, setSelectedTierIndex] = useState(0);
    const shadowAnim = useRef(new Animated.Value(0.5)).current;

    const resolvedTiers: TicketTier[] = useMemo(() => {
        const source = tiers.length > 0 ? tiers : [{ id: 'general', name: 'General', price: 0 }];

        return source.map((tier, index) => {
            const palette = PALETTE[index % PALETTE.length];
            return {
                ...tier,
                color: palette.color,
                textColor: palette.textColor,
                souvenirImage: palette.souvenirImage,
                perks: buildPerks(tier)
            } as TicketTier;
        });
    }, [tiers]);

    const selectedTier = resolvedTiers[selectedTierIndex] || resolvedTiers[0];

    useEffect(() => {
        Animated.loop(
            Animated.sequence([
                Animated.timing(shadowAnim, { toValue: 0.8, duration: 1000, useNativeDriver: false }),
                Animated.timing(shadowAnim, { toValue: 0.5, duration: 1000, useNativeDriver: false }),
            ])
        ).start();
    }, [shadowAnim]);

    useEffect(() => {
        if (selectedTierIndex >= resolvedTiers.length) {
            setSelectedTierIndex(0);
        }
    }, [resolvedTiers, selectedTierIndex]);

    const handleTierChange = (index: number) => {
        if (index !== selectedTierIndex) {
            Haptics.selectionAsync();
            setSelectedTierIndex(index);
        }
    };

    if (!visible || !selectedTier) return null;

    const serviceFee = roundMoney(selectedTier.price * Math.max(feePercentage, 0));
    const total = roundMoney(selectedTier.price + serviceFee);
    const hasServiceFee = serviceFee > 0;

    return (
        <View style={styles.overlay}>
            <TouchableOpacity style={styles.backdrop} onPress={onClose} activeOpacity={1} />

            <Animated.View style={[styles.container, {
                shadowColor: selectedTier.color,
                shadowOpacity: shadowAnim,
                shadowRadius: 20,
            }]}
            >
                <View style={styles.header}>
                    <Text style={styles.headerTitle}>Tu Experiencia</Text>
                    <TouchableOpacity onPress={onClose}>
                        <Ionicons name="close" size={24} color="#666" />
                    </TouchableOpacity>
                </View>

                <View style={styles.switchContainer}>
                    {resolvedTiers.map((tier, index) => (
                        <TouchableOpacity
                            key={tier.id}
                            style={[
                                styles.switchOption,
                                index === selectedTierIndex && { backgroundColor: tier.color }
                            ]}
                            onPress={() => handleTierChange(index)}
                        >
                            <Text style={[
                                styles.switchText,
                                index === selectedTierIndex ? { color: tier.textColor, fontWeight: 'bold' } : { color: '#666' }
                            ]}
                            >
                                {tier.name.toUpperCase()}
                            </Text>
                        </TouchableOpacity>
                    ))}
                </View>

                <View style={styles.content}>
                    <View style={styles.souvenirContainer}>
                        <LinearGradient
                            colors={[selectedTier.color, 'transparent']}
                            style={styles.souvenirGlow}
                        />
                        <Image
                            source={{ uri: selectedTier.souvenirImage }}
                            style={styles.souvenirImage}
                            resizeMode="contain"
                        />
                        <Text style={[styles.souvenirLabel, { color: selectedTier.color }]}
                        >
                            + Entrada Digital
                        </Text>
                    </View>

                    <View style={styles.perksList}>
                        {selectedTier.perks.map((perk, i) => (
                            <View key={i} style={styles.perkItem}>
                                <Ionicons name="checkmark-circle" size={16} color={selectedTier.color} />
                                <Text style={styles.perkText}>{perk}</Text>
                            </View>
                        ))}
                    </View>
                </View>

                {/* Price Breakdown */}
                <View style={styles.priceBreakdown}>
                    <View style={styles.priceRow}>
                        <Text style={styles.priceLabel}>Entrada {selectedTier.name}</Text>
                        <Text style={styles.priceValue}>${selectedTier.price.toLocaleString()}</Text>
                    </View>
                    {hasServiceFee && (
                        <View style={styles.priceRow}>
                            <Text style={styles.priceLabel}>Cargo por servicio</Text>
                            <Text style={styles.priceValue}>${serviceFee.toLocaleString()}</Text>
                        </View>
                    )}
                    <View style={styles.divider} />
                    <View style={styles.priceRow}>
                        <Text style={styles.totalLabel}>Total</Text>
                        <Text style={styles.totalValue}>${total.toLocaleString()}</Text>
                    </View>
                </View>
                <TouchableOpacity
                    style={[styles.buyButton, { backgroundColor: selectedTier.color }]}
                    onPress={() => {
                        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
                        onSelect(selectedTier);
                    }}
                >
                    <LinearGradient
                        colors={['rgba(255,255,255,0.4)', 'transparent']}
                        style={StyleSheet.absoluteFill}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 0, y: 0.5 }}
                    />
                    <Text style={[styles.buyButtonText, { color: selectedTier.textColor }]}
                    >
                        Confirmar Compra
                    </Text>
                    <Ionicons name="flash" size={18} color={selectedTier.textColor} />
                </TouchableOpacity>

            </Animated.View>
        </View>
    );
};

const styles = StyleSheet.create({
    overlay: {
        ...StyleSheet.absoluteFillObject,
        zIndex: 100,
        justifyContent: 'flex-end',
    },
    backdrop: {
        ...StyleSheet.absoluteFillObject,
        backgroundColor: 'rgba(0,0,0,0.8)',
    },
    container: {
        backgroundColor: '#111',
        borderTopLeftRadius: 32,
        borderTopRightRadius: 32,
        padding: 24,
        minHeight: 520,
        borderWidth: 1,
        borderColor: '#333',
        shadowOffset: { width: 0, height: 0 },
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 24,
    },
    headerTitle: {
        color: '#fff',
        fontSize: 20,
        fontWeight: 'bold',
    },
    switchContainer: {
        flexDirection: 'row',
        backgroundColor: '#222',
        borderRadius: 16,
        padding: 4,
        marginBottom: 32,
    },
    switchOption: {
        flex: 1,
        paddingVertical: 12,
        alignItems: 'center',
        borderRadius: 12,
    },
    switchText: {
        fontSize: 12,
        fontWeight: '600',
    },
    content: {
        alignItems: 'center',
        marginBottom: 32,
    },
    souvenirContainer: {
        width: 150,
        height: 150,
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 24,
    },
    souvenirGlow: {
        position: 'absolute',
        width: '150%',
        height: '150%',
        opacity: 0.2,
        borderRadius: 100,
    },
    souvenirImage: {
        width: 120,
        height: 120,
    },
    souvenirLabel: {
        marginTop: 12,
        fontSize: 14,
        fontWeight: 'bold',
        letterSpacing: 1,
    },
    perksList: {
        width: '100%',
        flexDirection: 'row',
        flexWrap: 'wrap',
        justifyContent: 'center',
        gap: 12,
    },
    perkItem: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'rgba(255,255,255,0.05)',
        paddingHorizontal: 12,
        paddingVertical: 8,
        borderRadius: 20,
        gap: 6,
    },
    perkText: {
        color: '#ccc',
        fontSize: 14,
    },
    priceBreakdown: {
        width: '100%',
        backgroundColor: 'rgba(255,255,255,0.03)',
        borderRadius: 16,
        padding: 16,
        marginBottom: 20,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.1)',
    },
    priceRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 8,
    },
    priceLabel: {
        color: '#999',
        fontSize: 14,
        fontWeight: '500',
    },
    priceValue: {
        color: '#ccc',
        fontSize: 14,
        fontWeight: '600',
    },
    divider: {
        height: 1,
        backgroundColor: 'rgba(255,255,255,0.1)',
        marginVertical: 12,
    },
    totalLabel: {
        color: '#fff',
        fontSize: 16,
        fontWeight: 'bold',
    },
    totalValue: {
        color: '#00D9FF',
        fontSize: 18,
        fontWeight: '900',
    },
    buyButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 18,
        borderRadius: 24,
        gap: 8,
        overflow: 'hidden',
    },
    buyButtonText: {
        fontSize: 18,
        fontWeight: '900',
    },
});

export default TicketSelector;


