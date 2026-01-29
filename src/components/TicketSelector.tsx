import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image, Dimensions, Vibration } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import Animated, {
    useSharedValue,
    useAnimatedStyle,
    withSpring,
    withTiming,
    interpolateColor,
    useDerivedValue
} from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';

const { width } = Dimensions.get('window');

interface TicketTier {
    id: string;
    name: string;
    price: number;
    color: string;
    textColor: string;
    perks: string[];
    souvenirImage: string; // URL for the NFT/Souvenir
}

const TIERS: TicketTier[] = [
    {
        id: 'general',
        name: 'GENERAL',
        price: 15000,
        color: '#00D9FF', // Cyan
        textColor: '#000',
        perks: ['Acceso General', 'Barra Principal'],
        souvenirImage: 'https://cdn-icons-png.flaticon.com/512/6298/6298900.png', // Generic NFT placeholder
    },
    {
        id: 'vip',
        name: 'VIP GOLD',
        price: 35000,
        color: '#FFD700', // Gold
        textColor: '#000',
        perks: ['Acceso Rápido', 'Sector VIP', 'Barra Premium', 'NFT Exclusivo'],
        souvenirImage: 'https://cdn-icons-png.flaticon.com/512/6941/6941697.png', // Gold NFT placeholder
    },
    {
        id: 'backstage',
        name: 'BACKSTAGE',
        price: 80000,
        color: '#E4CCFF', // Platinum/Purple
        textColor: '#000',
        perks: ['All Access', 'Meet & Greet', 'Bebidas Libres', 'NFT Legendario'],
        souvenirImage: 'https://cdn-icons-png.flaticon.com/512/6229/6229280.png', // Diamond NFT
    }
];

interface TicketSelectorProps {
    visible: boolean;
    onClose: () => void;
    onSelect: (tier: TicketTier) => void;
}

const TicketSelector: React.FC<TicketSelectorProps> = ({ visible, onClose, onSelect }) => {
    const [selectedTierIndex, setSelectedTierIndex] = useState(0);
    const selectedTier = TIERS[selectedTierIndex];

    const transitionValue = useSharedValue(0);

    useEffect(() => {
        transitionValue.value = withTiming(selectedTierIndex, { duration: 300 });
    }, [selectedTierIndex]);

    const handleTierChange = (index: number) => {
        if (index !== selectedTierIndex) {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
            setSelectedTierIndex(index);
        }
    };

    const animatedContainerStyle = useAnimatedStyle(() => {
        // Interpolate colors based on tier
        // 0 -> Cyan, 1 -> Gold, 2 -> Platinum
        return {
            shadowColor: selectedTier.color,
            shadowOpacity: 0.8,
            shadowRadius: 20,
        };
    });

    if (!visible) return null;

    return (
        <View style={styles.overlay}>
            <TouchableOpacity style={styles.backdrop} onPress={onClose} activeOpacity={1} />

            <Animated.View style={[styles.container, animatedContainerStyle]}>
                {/* Header with Switch */}
                <View style={styles.header}>
                    <Text style={styles.headerTitle}>Tu Experiencia</Text>
                    <TouchableOpacity onPress={onClose}>
                        <Ionicons name="close" size={24} color="#666" />
                    </TouchableOpacity>
                </View>

                {/* Tiers Switch - Gamified Toggle */}
                <View style={styles.switchContainer}>
                    {TIERS.map((tier, index) => (
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
                            ]}>
                                {tier.name}
                            </Text>
                        </TouchableOpacity>
                    ))}
                </View>

                {/* Main Content Area */}
                <View style={styles.content}>
                    {/* Souvenir/NFT Preview - "Loot Box" feel */}
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
                        <Text style={[styles.souvenirLabel, { color: selectedTier.color }]}>
                            + {selectedTier.id === 'general' ? 'Badge Básico' : selectedTier.id === 'vip' ? 'Souvenir Gold' : 'Legendary NFT'}
                        </Text>
                    </View>

                    {/* Perks List */}
                    <View style={styles.perksList}>
                        {selectedTier.perks.map((perk, i) => (
                            <View key={i} style={styles.perkItem}>
                                <Ionicons name="checkmark-circle" size={16} color={selectedTier.color} />
                                <Text style={styles.perkText}>{perk}</Text>
                            </View>
                        ))}
                    </View>
                </View>

                {/* Purchase Button */}
                <TouchableOpacity
                    style={[styles.buyButton, { backgroundColor: selectedTier.color }]}
                    onPress={() => onSelect(selectedTier)}
                >
                    <LinearGradient
                        colors={['rgba(255,255,255,0.4)', 'transparent']}
                        style={StyleSheet.absoluteFill}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 0, y: 0.5 }}
                    />
                    <Text style={[styles.buyButtonText, { color: selectedTier.textColor }]}>
                        {selectedTier.price > 0 ? `Comprar por $${selectedTier.price.toLocaleString()}` : 'Obtener Gratis'}
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
        minHeight: 500,
        borderWidth: 1,
        borderColor: '#333',
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
