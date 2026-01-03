import React, { useState, useCallback } from 'react';
import {
    View,
    Text,
    StyleSheet,
    FlatList,
    TouchableOpacity,
    SafeAreaView,
    StatusBar,
    RefreshControl,
} from 'react-native';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { getMyTickets } from '../../../lib/mock-data';

interface StoredTicket {
    id: string;
    eventId: string;
    eventTitle: string;
    eventDate: string;
    eventLocation: string;
    userId: string;
    userName: string;
    userEmail: string;
    price: number;
    qrCode: string;
    status: 'active' | 'used' | 'transferred';
    purchaseDate: string;
}

const MyTicketsScreen = () => {
    const navigation = useNavigation<any>();
    const [tickets, setTickets] = useState<StoredTicket[]>([]);
    const [refreshing, setRefreshing] = useState(false);

    const loadTickets = async () => {
        const data = await getMyTickets();
        setTickets(data);
    };

    // Reload on focus (when returning from purchase)
    useFocusEffect(
        useCallback(() => {
            loadTickets();
        }, [])
    );

    const onRefresh = async () => {
        setRefreshing(true);
        await loadTickets();
        setRefreshing(false);
    };

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'active':
                return '#D4FF00';
            case 'used':
                return '#888';
            case 'transferred':
                return '#FF6B6B';
            default:
                return '#fff';
        }
    };

    const getStatusText = (status: string) => {
        switch (status) {
            case 'active':
                return 'ACTIVO';
            case 'used':
                return 'USADO';
            case 'transferred':
                return 'TRANSFERIDO';
            default:
                return status.toUpperCase();
        }
    };

    const renderTicketItem = ({ item }: { item: StoredTicket }) => (
        <TouchableOpacity
            style={styles.ticketCard}
            onPress={() => navigation.navigate('AttTicketDetalle', { ticketId: item.id })}
        >
            <View style={styles.ticketHeader}>
                <View style={[styles.statusBadge, { backgroundColor: getStatusColor(item.status) }]}>
                    <Text style={styles.statusText}>{getStatusText(item.status)}</Text>
                </View>
                <Text style={styles.qrCode}>#{item.qrCode.slice(-6)}</Text>
            </View>

            <Text style={styles.eventTitle}>{item.eventTitle}</Text>

            <View style={styles.infoRow}>
                <Ionicons name="calendar-outline" size={16} color="#D4FF00" />
                <Text style={styles.infoText}>
                    {new Date(item.eventDate).toLocaleDateString('es-AR', {
                        weekday: 'short',
                        day: 'numeric',
                        month: 'short',
                        hour: '2-digit',
                        minute: '2-digit',
                    })}
                </Text>
            </View>

            <View style={styles.infoRow}>
                <Ionicons name="location-outline" size={16} color="#D4FF00" />
                <Text style={styles.infoText}>{item.eventLocation}</Text>
            </View>

            <View style={styles.ticketFooter}>
                <Text style={styles.priceText}>${item.price.toLocaleString()}</Text>
                <Ionicons name="chevron-forward" size={20} color="#666" />
            </View>
        </TouchableOpacity>
    );

    const renderEmptyState = () => (
        <View style={styles.emptyState}>
            <Ionicons name="ticket-outline" size={80} color="#333" />
            <Text style={styles.emptyTitle}>No tenés tickets</Text>
            <Text style={styles.emptySubtitle}>
                Cuando compres entradas para eventos, aparecerán aquí
            </Text>
            <TouchableOpacity
                style={styles.browseButton}
                onPress={() => navigation.navigate('Eventos')}
            >
                <Text style={styles.browseButtonText}>Explorar Eventos</Text>
            </TouchableOpacity>
        </View>
    );

    return (
        <SafeAreaView style={styles.container}>
            <StatusBar barStyle="light-content" />
            <View style={styles.header}>
                <Text style={styles.headerTitle}>Mis Tickets</Text>
                <TouchableOpacity style={styles.refreshButton} onPress={onRefresh}>
                    <Ionicons name="refresh" size={24} color="#fff" />
                </TouchableOpacity>
            </View>

            <FlatList
                data={tickets}
                renderItem={renderTicketItem}
                keyExtractor={(item) => item.id}
                contentContainerStyle={[
                    styles.listContent,
                    tickets.length === 0 && styles.emptyListContent,
                ]}
                showsVerticalScrollIndicator={false}
                ListEmptyComponent={renderEmptyState}
                refreshControl={
                    <RefreshControl
                        refreshing={refreshing}
                        onRefresh={onRefresh}
                        tintColor="#D4FF00"
                    />
                }
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
        borderBottomWidth: 1,
        borderBottomColor: '#222',
    },
    headerTitle: {
        fontSize: 28,
        fontWeight: 'bold',
        color: '#fff',
    },
    refreshButton: {
        padding: 8,
        backgroundColor: 'rgba(255,255,255,0.1)',
        borderRadius: 20,
    },
    listContent: {
        padding: 20,
    },
    emptyListContent: {
        flex: 1,
    },
    ticketCard: {
        backgroundColor: '#111',
        borderRadius: 16,
        padding: 16,
        marginBottom: 16,
        borderWidth: 1,
        borderColor: '#222',
    },
    ticketHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 12,
    },
    statusBadge: {
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 8,
    },
    statusText: {
        color: '#000',
        fontSize: 10,
        fontWeight: 'bold',
    },
    qrCode: {
        color: '#666',
        fontSize: 12,
        fontFamily: 'monospace',
    },
    eventTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#fff',
        marginBottom: 12,
    },
    infoRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 8,
    },
    infoText: {
        color: '#ccc',
        marginLeft: 8,
        fontSize: 14,
    },
    ticketFooter: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginTop: 12,
        paddingTop: 12,
        borderTopWidth: 1,
        borderTopColor: '#222',
    },
    priceText: {
        color: '#D4FF00',
        fontSize: 18,
        fontWeight: 'bold',
    },
    emptyState: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: 40,
    },
    emptyTitle: {
        color: '#fff',
        fontSize: 24,
        fontWeight: 'bold',
        marginTop: 20,
    },
    emptySubtitle: {
        color: '#888',
        fontSize: 16,
        textAlign: 'center',
        marginTop: 10,
        lineHeight: 22,
    },
    browseButton: {
        marginTop: 30,
        backgroundColor: '#D4FF00',
        paddingHorizontal: 30,
        paddingVertical: 14,
        borderRadius: 25,
    },
    browseButtonText: {
        color: '#000',
        fontWeight: 'bold',
        fontSize: 16,
    },
});

export default MyTicketsScreen;
