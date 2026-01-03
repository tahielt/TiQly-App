import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, Image, ScrollView, TouchableOpacity, Alert, ActivityIndicator } from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { getEventById, saveTicket, MOCK_USER } from '../../../lib/mock-data';
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

    const loadEvent = () => {
        const data = getEventById(eventId);
        setEvent(data);
        setLoading(false);
    };

    const handlePurchase = async () => {
        setPurchasing(true);
        // Simulate API call
        setTimeout(async () => {
            const newTicket = {
                id: `ticket_${Date.now()}`,
                eventId: event.id,
                eventTitle: event.title,
                eventDate: event.startDate,
                eventLocation: event.location.address,
                userId: MOCK_USER.id,
                userName: MOCK_USER.name,
                userEmail: MOCK_USER.email,
                price: event.price,
                qrCode: `QR-${Date.now()}`,
                status: 'active',
                purchaseDate: new Date(),
            };

            const success = await saveTicket(newTicket);
            setPurchasing(false);

            if (success) {
                Alert.alert(
                    '¡Compra Exitosa!',
                    'Tu entrada ha sido guardada en Mis Tickets.',
                    [
                        { text: 'Ver Tickets', onPress: () => navigation.navigate('Tickets', { screen: 'AttTicketsHome' }) },
                        { text: 'OK' }
                    ]
                );
            } else {
                Alert.alert('Error', 'No se pudo procesar la compra. Intenta de nuevo.');
            }
        }, 1500);
    };

    if (loading) {
        return (
            <View style={styles.centered}>
                <ActivityIndicator size="large" color="#D4FF00" />
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
                        <Ionicons name="calendar-outline" size={20} color="#D4FF00" />
                        <Text style={styles.infoText}>
                            {new Date(event.startDate).toLocaleDateString('es-AR', { weekday: 'long', day: 'numeric', month: 'long', hour: '2-digit', minute: '2-digit' })}
                        </Text>
                    </View>

                    <View style={styles.infoRow}>
                        <Ionicons name="location-outline" size={20} color="#D4FF00" />
                        <Text style={styles.infoText}>{event.location.address}, {event.location.city}</Text>
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
                    <Text style={styles.price}>${event.price.toLocaleString()}</Text>
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
        backgroundColor: '#000',
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
        backgroundColor: '#D4FF00',
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
        color: '#D4FF00',
        fontSize: 16,
        fontWeight: '600',
    },
    footer: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        backgroundColor: '#111',
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
        backgroundColor: '#D4FF00',
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
