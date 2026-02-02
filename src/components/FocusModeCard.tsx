import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Dimensions, Animated, Image } from 'react-native';
import { BlurView } from 'expo-blur';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';

const { width } = Dimensions.get('window');
const CARD_WIDTH = width * 0.85;

interface FocusModeCardProps {
    event: any;
    onPress: () => void;
    onClose: () => void;
}

const FocusModeCard: React.FC<FocusModeCardProps> = ({ event, onPress, onClose }) => {
    const glowOpacity = useRef(new Animated.Value(0.5)).current;
    const scale = useRef(new Animated.Value(0.95)).current;

    useEffect(() => {
        Animated.loop(
            Animated.sequence([
                Animated.timing(glowOpacity, { toValue: 1, duration: 1500, useNativeDriver: false }),
                Animated.timing(glowOpacity, { toValue: 0.5, duration: 1500, useNativeDriver: false }),
            ])
        ).start();

        Animated.timing(scale, { toValue: 1, duration: 400, useNativeDriver: true }).start();
    }, []);

    const imageSource = event.imageUrl
        ? { uri: event.imageUrl }
        : { uri: 'https://images.unsplash.com/photo-1540039155733-5bb30b53aa14?w=800' };

    return (
        <Animated.View style={[styles.container, {
            shadowOpacity: glowOpacity,
            transform: [{ scale }],
        }]}>
            <LinearGradient
                colors={['#00D9FF', 'rgba(0, 217, 255, 0.2)']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.borderGradient}
            >
                <TouchableOpacity
                    style={styles.innerContainer}
                    activeOpacity={0.9}
                    onPress={onPress}
                >
                    <Image
                        source={imageSource}
                        style={StyleSheet.absoluteFill}
                        resizeMode="cover"
                    />

                    <LinearGradient
                        colors={['transparent', 'rgba(0,0,0,0.9)']}
                        style={StyleSheet.absoluteFill}
                    />
                    <View style={styles.content}>
                        <View style={styles.topRow}>
                            <View style={styles.liveBadge}>
                                <View style={styles.liveDot} />
                                <Text style={styles.liveText}>LIVE</Text>
                            </View>
                            <TouchableOpacity onPress={onClose} hitSlop={{ top: 20, bottom: 20, left: 20, right: 20 }}>
                                <Ionicons name="close-circle" size={28} color="rgba(255,255,255,0.7)" />
                            </TouchableOpacity>
                        </View>

                        <View style={styles.info}>
                            <Text style={styles.category}>{event.category?.toUpperCase() || 'EVENTO'}</Text>
                            <Text style={styles.title} numberOfLines={2}>{event.title}</Text>

                            <View style={styles.metaRow}>
                                <View style={styles.metaItem}>
                                    <Ionicons name="location" size={14} color="#00D9FF" />
                                    <Text style={styles.metaText}>{event.location?.address || 'Ubicación oculta'}</Text>
                                </View>
                                <View style={styles.metaItem}>
                                    <Ionicons name="walk" size={14} color="#00FF9D" />
                                    <Text style={styles.metaText}>1.2 km</Text>
                                </View>
                            </View>

                            <View style={styles.ctaButton}>
                                <Text style={styles.ctaText}>Ver Experiencia</Text>
                                <Ionicons name="arrow-forward" size={16} color="#000" />
                            </View>
                        </View>
                    </View>
                </TouchableOpacity>
            </LinearGradient>
        </Animated.View>
    );
};

const styles = StyleSheet.create({
    container: {
        width: CARD_WIDTH,
        height: CARD_WIDTH * 1.2,
        borderRadius: 24,
        shadowColor: '#00D9FF',
        shadowOffset: { width: 0, height: 0 },
        shadowRadius: 20,
        elevation: 20,
    },
    borderGradient: {
        flex: 1,
        padding: 2,
        borderRadius: 24,
    },
    innerContainer: {
        flex: 1,
        borderRadius: 22,
        overflow: 'hidden',
        backgroundColor: '#000',
    },
    content: {
        flex: 1,
        justifyContent: 'space-between',
        padding: 20,
    },
    topRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    liveBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'rgba(0, 255, 157, 0.2)',
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: 'rgba(0, 255, 157, 0.5)',
    },
    liveDot: {
        width: 6,
        height: 6,
        borderRadius: 3,
        backgroundColor: '#00FF9D',
        marginRight: 6,
    },
    liveText: {
        color: '#00FF9D',
        fontSize: 10,
        fontWeight: 'bold',
    },
    info: {
        gap: 8,
    },
    category: {
        color: '#00D9FF',
        fontSize: 12,
        fontWeight: 'bold',
        letterSpacing: 1,
    },
    title: {
        color: '#fff',
        fontSize: 28,
        fontWeight: '900',
        textShadowColor: 'rgba(0,0,0,0.75)',
        textShadowOffset: { width: 0, height: 2 },
        textShadowRadius: 4,
    },
    metaRow: {
        flexDirection: 'row',
        gap: 16,
        marginBottom: 16,
    },
    metaItem: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
    },
    metaText: {
        color: '#ddd',
        fontSize: 13,
        fontWeight: '500',
    },
    ctaButton: {
        backgroundColor: '#00D9FF',
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 14,
        borderRadius: 16,
        gap: 8,
    },
    ctaText: {
        color: '#000',
        fontSize: 16,
        fontWeight: 'bold',
    },
});

export default FocusModeCard;
