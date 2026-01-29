import React, { useEffect, useState, useRef } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert, ActivityIndicator, Dimensions, StatusBar } from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { eventService } from '../../../services/eventService';
import { purchaseTicket } from '../../../services/ticketService';
import { supabase } from '../../../lib/supabase';
import { Event } from '../../../types/event';
import { Video, ResizeMode, Audio } from 'expo-av';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import TicketSelector from '../../../components/TicketSelector';

const { height, width } = Dimensions.get('window');

const EventDetailScreen = () => {
    const navigation = useNavigation<any>();
    const route = useRoute<any>();
    const { eventId } = route.params;
    const [event, setEvent] = useState<any | null>(null);
    const [loading, setLoading] = useState(true);
    const [purchasing, setPurchasing] = useState(false);

    // Ticket Selector State
    const [isSelectorVisible, setIsSelectorVisible] = useState(false);

    // Audio Preview State
    const [sound, setSound] = useState<Audio.Sound | null>(null);
    const [isPlayingAudio, setIsPlayingAudio] = useState(false);

    useEffect(() => {
        loadEvent();
        return () => {
            if (sound) {
                sound.unloadAsync();
            }
        };
    }, [eventId]);

    const loadEvent = async () => {
        try {
            const data = await eventService.getEventById(eventId);
            setEvent(data);
        } catch (error) {
            console.error("Error loading event:", error);
        } finally {
            setLoading(false);
        }
    };

    const toggleAudioPreview = async () => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

        if (sound) {
            if (isPlayingAudio) {
                await sound.pauseAsync();
                setIsPlayingAudio(false);
            } else {
                await sound.playAsync();
                setIsPlayingAudio(true);
            }
        } else {
            // Load dummy audio for MVP
            const { sound: newSound } = await Audio.Sound.createAsync(
                { uri: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3' },
                { shouldPlay: true }
            );
            setSound(newSound);
            setIsPlayingAudio(true);
        }
    };

    const handleTierSelection = (tier: any) => {
        setIsSelectorVisible(false);
        handlePurchase(tier);
    };

    const handlePurchase = async (tier?: any) => {
        // If getting here without a tier (from footer button), open selector
        if (!tier) {
            setIsSelectorVisible(true);
            return;
        }

        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        setPurchasing(true);
        try {
            // Get current authenticated user
            const { data: { user: currentUser } } = await supabase.auth.getUser();
            if (!currentUser) {
                Alert.alert('Error', 'Debes iniciar sesión para comprar.');
                setPurchasing(false);
                return;
            }

            // Create purchase data using tier price
            const basePrice = tier.price;
            const platformFee = basePrice * 0.15; // 15% fee
            const purchaseData = {
                eventId: event.id,
                ticketTypeId: tier.id || '',
                quantity: 1,
                totalAmount: basePrice,
                platformFee: platformFee,
                finalAmount: basePrice + platformFee
            };

            // Call real ticketService (Supabase)
            await purchaseTicket(
                purchaseData,
                currentUser.id,
                currentUser.user_metadata?.full_name || currentUser.email?.split('@')[0] || 'Usuario',
                currentUser.email || '',
                {
                    title: event.title,
                    date: new Date(event.startDate),
                    location: event.location?.address || 'Sin dirección'
                }
            );

            setPurchasing(false);
            Alert.alert(
                '¡Compra Exitosa!',
                `Tu entrada ${tier.name} ha sido guardada. Ve a Mis Tickets para ver tu QR.`,
                [
                    { text: 'Ver Tickets', onPress: () => navigation.navigate('MainTabs', { screen: 'Tickets' }) },
                    { text: 'OK' }
                ]
            );
        } catch (error) {
            console.error('Purchase error:', error);
            setPurchasing(false);
            Alert.alert('Error', 'No se pudo procesar la compra. Intenta de nuevo.');
        }
    };

    if (loading) {
        return (
            <View style={styles.centered}>
                <ActivityIndicator size="large" color="#00D9FF" />
            </View>
        );
    }

    if (!event) {
        return (
            <View style={styles.centered}>
                <Text style={styles.errorText}>Evento no encontrado</Text>
            </View>
        );
    }

    // Mock video URL if missing (MVP)
    const videoSource = event.videoUrl
        ? { uri: event.videoUrl }
        : { uri: 'https://assets.mixkit.co/videos/preview/mixkit-party-crowd-concert-2023-large.mp4' };

    return (
        <View style={styles.container}>
            <StatusBar barStyle="light-content" />

            {/* 🎥 Hero Video Background */}
            <Video
                source={videoSource}
                style={StyleSheet.absoluteFill}
                resizeMode={ResizeMode.COVER}
                shouldPlay
                isLooping
                isMuted={true}
            />

            {/* Gradient Overlay for Readability */}
            <LinearGradient
                colors={['rgba(0,0,0,0.3)', 'rgba(0,0,0,0.6)', '#000000']}
                locations={[0, 0.6, 1]}
                style={StyleSheet.absoluteFill}
            />

            <View style={styles.safeArea}>
                <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
                    <Ionicons name="arrow-back" size={24} color="#fff" />
                </TouchableOpacity>

                {/* Ticket Selector Modal */}
                <TicketSelector
                    visible={isSelectorVisible}
                    onClose={() => setIsSelectorVisible(false)}
                    onSelect={handleTierSelection}
                />

                <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
                    {/* Spacer to push content down */}
                    <View style={{ height: height * 0.45 }} />

                    <View style={styles.contentContainer}>
                        {/* 🔥 Live Status Dopamine */}
                        <View style={styles.liveStatusRow}>
                            <View style={styles.badgeContainer}>
                                <Text style={styles.badgeText}>{event.category}</Text>
                            </View>
                            <View style={styles.liveTicker}>
                                <View style={styles.liveDot} />
                                <Text style={styles.liveText}>85% vendido</Text>
                            </View>
                        </View>

                        <Text style={styles.title}>{event.title}</Text>

                        {/* 🎵 Audio Preview Button */}
                        <TouchableOpacity style={styles.audioPreviewButton} onPress={toggleAudioPreview}>
                            <Ionicons name={isPlayingAudio ? "pause" : "play"} size={20} color="#000" />
                            <Text style={styles.audioPreviewText}>
                                {isPlayingAudio ? "Pausar Preview" : "Escuchar Set (15s)"}
                            </Text>
                            {isPlayingAudio && (
                                <View style={styles.equalizer}>
                                    {/* Mock equalizer bars */}
                                    <View style={[styles.bar, { height: 10 }]} />
                                    <View style={[styles.bar, { height: 16 }]} />
                                    <View style={[styles.bar, { height: 8 }]} />
                                </View>
                            )}
                        </TouchableOpacity>

                        <View style={styles.infoRow}>
                            <Ionicons name="calendar-outline" size={20} color="#00D9FF" />
                            <Text style={styles.infoText}>
                                {event.startDate ? new Date(event.startDate).toLocaleDateString('es-AR', { weekday: 'long', day: 'numeric', month: 'long', hour: '2-digit', minute: '2-digit' }) : 'Fecha pendiente'}
                            </Text>
                        </View>

                        <View style={styles.infoRow}>
                            <Ionicons name="location-outline" size={20} color="#00D9FF" />
                            <Text style={styles.infoText}>{event.location?.address || 'Sin dirección'}, {event.location?.city || ''}</Text>
                        </View>

                        <View style={styles.divider} />

                        <Text style={styles.sectionTitle}>Descripción</Text>
                        <Text style={styles.description}>{event.description}</Text>

                        <View style={styles.divider} />

                        <Text style={styles.sectionTitle}>Organizador</Text>
                        <Text style={styles.organizer}>{event.organizerName}</Text>

                        {/* Extra space for footer */}
                        <View style={{ height: 100 }} />
                    </View>
                </ScrollView>

                {/* Sticky Footer */}
                <View style={styles.footer}>
                    <View>
                        <Text style={styles.priceLabel}>Desde</Text>
                        <Text style={styles.price}>${event.price?.toLocaleString() || '0'}</Text>
                    </View>
                    <TouchableOpacity
                        style={[styles.buyButton, purchasing && styles.disabledButton]}
                        onPress={() => handlePurchase()}
                        disabled={purchasing}
                    >
                        {purchasing ? (
                            <ActivityIndicator color="#000" />
                        ) : (
                            <Text style={styles.buyButtonText}>Elegir Entradas</Text>
                        )}
                    </TouchableOpacity>
                </View>
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#000',
    },
    safeArea: {
        flex: 1,
        paddingTop: 50, // Manual safe area top
    },
    centered: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#000',
    },
    errorText: {
        color: '#fff',
        fontSize: 18,
    },
    backButton: {
        position: 'absolute',
        top: 50,
        left: 20,
        backgroundColor: 'rgba(0,0,0,0.5)',
        padding: 8,
        borderRadius: 20,
        zIndex: 20,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.2)',
    },
    scrollContent: {
        paddingBottom: 40,
    },
    contentContainer: {
        padding: 20,
    },
    liveStatusRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: 16,
    },
    badgeContainer: {
        backgroundColor: '#00D9FF',
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 12,
    },
    badgeText: {
        color: '#000',
        fontWeight: 'bold',
        fontSize: 12,
    },
    liveTicker: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'rgba(255, 69, 58, 0.2)', // Red tint
        paddingHorizontal: 10,
        paddingVertical: 6,
        borderRadius: 20,
        borderWidth: 1,
        borderColor: 'rgba(255, 69, 58, 0.5)',
    },
    liveDot: {
        width: 6,
        height: 6,
        borderRadius: 3,
        backgroundColor: '#FF453A',
        marginRight: 6,
    },
    liveText: {
        color: '#FF453A',
        fontSize: 12,
        fontWeight: 'bold',
    },
    title: {
        fontSize: 36,
        fontWeight: '900',
        color: '#fff',
        marginBottom: 20,
        textShadowColor: 'rgba(0,0,0,0.5)',
        textShadowOffset: { width: 0, height: 2 },
        textShadowRadius: 4,
    },
    audioPreviewButton: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#00FF9D',
        paddingVertical: 12,
        paddingHorizontal: 16,
        borderRadius: 25,
        alignSelf: 'flex-start',
        marginBottom: 24,
        gap: 8,
    },
    audioPreviewText: {
        color: '#000',
        fontWeight: 'bold',
        fontSize: 14,
    },
    equalizer: {
        flexDirection: 'row',
        alignItems: 'flex-end',
        gap: 2,
        height: 16,
    },
    bar: {
        width: 3,
        backgroundColor: '#000',
        borderRadius: 2,
    },
    infoRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 12,
    },
    infoText: {
        color: '#eee',
        marginLeft: 10,
        fontSize: 16,
        fontWeight: '500',
    },
    divider: {
        height: 1,
        backgroundColor: 'rgba(255,255,255,0.2)',
        marginVertical: 20,
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#fff',
        marginBottom: 10,
    },
    description: {
        color: '#ccc',
        lineHeight: 24,
        fontSize: 16,
    },
    organizer: {
        color: '#00D9FF',
        fontSize: 16,
        fontWeight: '600',
    },
    footer: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        backgroundColor: 'rgba(0,0,0,0.85)', // Glassy dark
        padding: 20,
        paddingBottom: 30,
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        borderTopWidth: 1,
        borderTopColor: 'rgba(255,255,255,0.1)',
    },
    priceLabel: {
        color: '#888',
        fontSize: 12,
    },
    price: {
        color: '#fff',
        fontSize: 28,
        fontWeight: 'bold',
    },
    buyButton: {
        backgroundColor: '#00D9FF',
        paddingHorizontal: 32,
        paddingVertical: 16,
        borderRadius: 30,
        minWidth: 150,
        alignItems: 'center',
    },
    disabledButton: {
        opacity: 0.7,
    },
    buyButtonText: {
        color: '#000',
        fontWeight: 'bold',
        fontSize: 16,
    },
});

export default EventDetailScreen;
