import React, { useEffect, useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    FlatList,
    Image,
    TouchableOpacity,
    StatusBar,
    SafeAreaView,
    Alert,
} from 'react-native';
import { useNavigation, useIsFocused } from '@react-navigation/native';
import { useSelector } from 'react-redux';
import { RootState } from '../../../store/store';
import { eventService } from '../../../services/eventService';
import { getEventTicketSales } from '../../../services/ticketService';
import { Ionicons } from '@expo/vector-icons';

const MyEventsScreen = () => {
    const navigation = useNavigation<any>();
    const isFocused = useIsFocused();
    const { user } = useSelector((state: RootState) => state.auth);
    const [events, setEvents] = useState<any[]>([]);
    const [statsByEvent, setStatsByEvent] = useState<Record<string, { sold: number; revenue: number }>>({});

    useEffect(() => {
        if (isFocused) {
            loadMyEvents();
        }
    }, [isFocused]);

    const loadMyEvents = async () => {
        if (!user?.id) {
            setEvents([]);
            return;
        }

        const myEvents = await eventService.getEventsByOrganizer(user.id, true);
        setEvents(myEvents);
        loadEventStats(myEvents);
    };
    const loadEventStats = async (items: any[]) => {
        if (!items || items.length === 0) {
            setStatsByEvent({});
            return;
        }

        const results = await Promise.all(items.map(async (event) => {
            try {
                const sales = await getEventTicketSales(event.id);
                const sold = sales.length;
                const revenue = sales.reduce((sum, sale) => sum + (sale.basePrice || sale.price || 0), 0);
                return { id: event.id, sold, revenue };
            } catch (error) {
                console.error('Error loading stats for event:', event.id, error);
                return { id: event.id, sold: 0, revenue: 0 };
            }
        }));

        const next: Record<string, { sold: number; revenue: number }> = {};
        results.forEach((entry) => {
            next[entry.id] = { sold: entry.sold, revenue: entry.revenue };
        });
        setStatsByEvent(next);
    };
    const handleViewTickets = (eventId: string, eventTitle: string) => {
        navigation.navigate('OrgEventStats', { eventId, eventTitle });
    };

    const handleScanQR = () => {
        navigation.navigate('Tickets'); // Goes to OrgTicketsStack which has scanner
    };

    const renderEventItem = ({ item }: { item: any }) => (
        <View style={styles.card}>
            <Image source={{ uri: item.coverImage }} style={styles.cardImage} />

            {/* Stats Overlay */}
            <View style={styles.statsOverlay}>
                <View style={styles.statItem}>
                    <Text style={styles.statValue}>{statsByEvent[item.id]?.sold ?? 0}</Text>
                    <Text style={styles.statLabel}>Vendidos</Text>
                </View>
                <View style={styles.statDivider} />
                <View style={styles.statItem}>
                    <Text style={styles.statValue}>{`$${(statsByEvent[item.id]?.revenue ?? 0).toLocaleString()}`}</Text>
                    <Text style={styles.statLabel}>Recaudado</Text>
                </View>
                <View style={styles.statDivider} />
                <View style={styles.statItem}>
                    <View style={[styles.statusDot, item.status === 'draft' && { backgroundColor: '#FFB020' }]} />
                    <Text style={styles.statLabel}>{item.status === 'draft' ? 'Borrador' : 'Activo'}</Text>
                </View>
            </View>

            <View style={styles.cardContent}>
                <View style={styles.badgeRow}>
                    <View style={styles.badge}>
                        <Text style={styles.badgeText}>{item.category}</Text>
                    </View>
                    <Text style={styles.price}>${item.price?.toLocaleString() || '0'}</Text>
                </View>

                <Text style={styles.date}>
                    {item.startDate ? new Date(item.startDate).toLocaleDateString('es-AR', {
                        weekday: 'short', day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit'
                    }).toUpperCase() : 'FECHA PENDIENTE'}
                </Text>
                <Text style={styles.title}>{item.title}</Text>

                <View style={styles.locationRow}>
                    <Ionicons name="location-outline" size={14} color="#666" />
                    <Text style={styles.location}>{item.location?.address}</Text>
                </View>

                {/* Actions */}
                <View style={styles.actionsRow}>
                    <TouchableOpacity
                        style={styles.actionBtn}
                        onPress={() => navigation.navigate('AttEventoDetalle', { eventId: item.id })}
                    >
                        <Ionicons name="eye-outline" size={18} color="#00D9FF" />
                        <Text style={styles.actionText}>Ver</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                        style={styles.actionBtn}
                        onPress={() => handleViewTickets(item.id, item.title)}
                    >
                        <Ionicons name="people-outline" size={18} color="#00D9FF" />
                        <Text style={styles.actionText}>Tickets</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                        style={[styles.actionBtn, styles.scanBtn]}
                        onPress={handleScanQR}
                    >
                        <Ionicons name="qr-code-outline" size={18} color="#000" />
                        <Text style={[styles.actionText, { color: '#000' }]}>Escanear</Text>
                    </TouchableOpacity>
                </View>
            </View>
        </View>
    );

    const renderEmptyState = () => (
        <View style={styles.emptyContainer}>
            <View style={styles.emptyIcon}>
                <Ionicons name="calendar-outline" size={48} color="#333" />
            </View>
            <Text style={styles.emptyTitle}>No has creado eventos aún</Text>
            <Text style={styles.emptySubtitle}>Crea tu primer evento y empieza a vender entradas</Text>
            <TouchableOpacity
                style={styles.createBtn}
                onPress={() => navigation.navigate('CreateEvent')}
            >
                <Text style={styles.createBtnText}>Crear mi primer evento</Text>
            </TouchableOpacity>
        </View>
    );

    return (
        <SafeAreaView style={styles.container}>
            <StatusBar barStyle="light-content" />

            {/* Header */}
            <View style={styles.header}>
                <View>
                    <Text style={styles.headerTitle}>Mis Eventos</Text>
                    <Text style={styles.headerSubtitle}>Panel de Organizador</Text>
                </View>
                <View style={styles.headerActions}>
                    <TouchableOpacity
                        style={styles.profileBtn}
                        onPress={() => navigation.navigate('Profile')}
                    >
                        <Ionicons name="person-circle-outline" size={32} color="#fff" />
                    </TouchableOpacity>
                    <TouchableOpacity
                        style={styles.addBtn}
                        onPress={() => navigation.navigate('CreateEvent')}
                    >
                        <Ionicons name="add" size={24} color="#000" />
                    </TouchableOpacity>
                </View>
            </View>

            <FlatList
                data={events}
                renderItem={renderEventItem}
                keyExtractor={(item) => item.id}
                contentContainerStyle={styles.listContent}
                showsVerticalScrollIndicator={false}
                ListEmptyComponent={renderEmptyState}
            />
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#000',
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: 20,
        backgroundColor: '#000',
    },
    headerTitle: {
        color: '#fff',
        fontSize: 28,
        fontWeight: '900',
    },
    headerSubtitle: {
        color: '#00D9FF',
        fontSize: 13,
        fontWeight: 'bold',
        textTransform: 'uppercase',
        letterSpacing: 1,
        marginTop: 2,
    },
    addBtn: {
        width: 48,
        height: 48,
        borderRadius: 24,
        backgroundColor: '#00D9FF',
        justifyContent: 'center',
        alignItems: 'center',
    },
    headerActions: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
    },
    profileBtn: {
        padding: 4,
    },
    listContent: {
        padding: 20,
        paddingTop: 0,
    },
    card: {
        backgroundColor: '#111',
        borderRadius: 20,
        overflow: 'hidden',
        marginBottom: 20,
        borderWidth: 1,
        borderColor: '#222',
    },
    cardImage: {
        width: '100%',
        height: 150,
    },
    statsOverlay: {
        flexDirection: 'row',
        justifyContent: 'space-around',
        alignItems: 'center',
        backgroundColor: 'rgba(0,0,0,0.85)',
        paddingVertical: 12,
        marginTop: -40,
        marginHorizontal: 16,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: '#222',
    },
    statItem: {
        alignItems: 'center',
        flexDirection: 'row',
        gap: 6,
    },
    statValue: {
        color: '#00D9FF',
        fontSize: 16,
        fontWeight: '900',
    },
    statLabel: {
        color: '#888',
        fontSize: 11,
        fontWeight: 'bold',
        textTransform: 'uppercase',
    },
    statDivider: {
        width: 1,
        height: 20,
        backgroundColor: '#333',
    },
    statusDot: {
        width: 8,
        height: 8,
        borderRadius: 4,
        backgroundColor: '#00FF9D',
    },
    cardContent: {
        padding: 16,
        paddingTop: 20,
    },
    badgeRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 8,
    },
    badge: {
        backgroundColor: '#00D9FF',
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 8,
    },
    badgeText: {
        color: '#000',
        fontWeight: 'bold',
        fontSize: 11,
    },
    price: {
        color: '#fff',
        fontSize: 18,
        fontWeight: '900',
    },
    date: {
        color: '#00D9FF',
        fontWeight: '700',
        fontSize: 11,
        marginBottom: 4,
    },
    title: {
        color: '#fff',
        fontSize: 20,
        fontWeight: 'bold',
        marginBottom: 8,
    },
    locationRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
        marginBottom: 16,
    },
    location: {
        color: '#666',
        fontSize: 13,
    },
    actionsRow: {
        flexDirection: 'row',
        gap: 10,
    },
    actionBtn: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 6,
        paddingVertical: 12,
        borderRadius: 12,
        backgroundColor: 'rgba(0, 217, 255, 0.1)',
        borderWidth: 1,
        borderColor: 'rgba(0, 217, 255, 0.2)',
    },
    scanBtn: {
        backgroundColor: '#00D9FF',
        borderColor: '#00D9FF',
    },
    actionText: {
        color: '#00D9FF',
        fontWeight: 'bold',
        fontSize: 13,
    },
    emptyContainer: {
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 80,
    },
    emptyIcon: {
        width: 80,
        height: 80,
        borderRadius: 40,
        backgroundColor: '#111',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 20,
    },
    emptyTitle: {
        color: '#fff',
        fontSize: 18,
        fontWeight: 'bold',
        marginBottom: 8,
    },
    emptySubtitle: {
        color: '#666',
        fontSize: 14,
        textAlign: 'center',
        marginBottom: 24,
    },
    createBtn: {
        backgroundColor: '#00D9FF',
        paddingHorizontal: 24,
        paddingVertical: 14,
        borderRadius: 25,
    },
    createBtnText: {
        color: '#000',
        fontWeight: 'bold',
        fontSize: 15,
    },
});

export default MyEventsScreen;















