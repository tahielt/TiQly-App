import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, Image, ScrollView, TouchableOpacity, Alert, ActivityIndicator } from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { eventService } from '../../../services/eventService';
import { purchaseTicket } from '../../../services/ticketService';
import { supabase } from '../../../lib/supabase';
import { Event } from '../../../types/event';

const EventDetailScreen = () => {
    const navigation = useNavigation<any>();
    const route = useRoute<any>();
    const { eventId } = route.params;
    const [event, setEvent] = useState<any | null>(null); // Using any to bypass strict type check for now
    const [loading, setLoading] = useState(true);
    const [purchasing, setPurchasing] = useState(false);

    useEffect(() => {
        loadEvent();
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

    const handlePurchase = async () => {
        setPurchasing(true);
        try {
            // Get current authenticated user
            const { data: { user: currentUser } } = await supabase.auth.getUser();
            if (!currentUser) {
                Alert.alert('Error', 'Debes iniciar sesión para comprar.');
                setPurchasing(false);
                return;
            }

            // Create purchase data
            const basePrice = event.price || 0;
            const platformFee = basePrice * 0.15; // 15% fee
            const purchaseData = {
                eventId: event.id,
                ticketTypeId: 'general',
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
                'Tu entrada ha sido guardada. Ve a Mis Tickets para ver tu QR.',
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

    return (
        <View style={styles.container}>
            <ScrollView contentContainerStyle={{ paddingBottom: 100 }}>
                <Image source={{ uri: event.coverImage }} style={styles.coverImage} />

                <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
                    <Ionicons name="arrow-back" size={24} color="#fff" />
                </TouchableOpacity>

                <View style={styles.content}>
                    <View style={styles.badgeContainer}>
                        <Text style={styles.badgeText}>{event.category}</Text>
                    </View>

                    <Text style={styles.title}>{event.title}</Text>

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
                </View>
            </ScrollView>

            <View style={styles.footer}>
                <View>
                    <Text style={styles.priceLabel}>Precio Final</Text>
                    <Text style={styles.price}>${event.price?.toLocaleString() || '0'}</Text>
                </View>
                <TouchableOpacity
                    style={[styles.buyButton, purchasing && styles.disabledButton]}
                    onPress={handlePurchase}
                    disabled={purchasing}
                >
                    {purchasing ? (
                        <ActivityIndicator color="#000" />
                    ) : (
                        <Text style={styles.buyButtonText}>Comprar</Text>
                    )}
                </TouchableOpacity>
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#000000',
    },
    centered: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#000000',
    },
    errorText: {
        color: '#fff',
        fontSize: 18,
    },
    coverImage: {
        width: '100%',
        height: 300,
    },
    backButton: {
        position: 'absolute',
        top: 50,
        left: 20,
        backgroundColor: 'rgba(0,0,0,0.5)',
        padding: 8,
        borderRadius: 20,
    },
    content: {
        padding: 20,
    },
    badgeContainer: {
        alignSelf: 'flex-start',
        backgroundColor: '#00D9FF',
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 12,
        marginBottom: 16,
    },
    badgeText: {
        color: '#000',
        fontWeight: 'bold',
        fontSize: 12,
    },
    title: {
        fontSize: 28,
        fontWeight: 'bold',
        color: '#fff',
        marginBottom: 20,
    },
    infoRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 12,
    },
    infoText: {
        color: '#fff',
        marginLeft: 10,
        fontSize: 16,
    },
    divider: {
        height: 1,
        backgroundColor: '#333',
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
        backgroundColor: '#111111',
        padding: 20,
        paddingBottom: 40,
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        borderTopWidth: 1,
        borderTopColor: '#333',
    },
    priceLabel: {
        color: '#888',
        fontSize: 12,
    },
    price: {
        color: '#fff',
        fontSize: 24,
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
