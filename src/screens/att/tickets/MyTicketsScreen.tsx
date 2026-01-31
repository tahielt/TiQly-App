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
import { getUserTickets } from '../../../services/ticketService';
import { supabase } from '../../../lib/supabase';

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
    status: 'active' | 'used' | 'transferred' | 'for_sale';
    purchaseDate: string;
}

type TicketFilter = 'all' | 'active' | 'for_sale' | 'used';

const FILTER_TABS: { key: TicketFilter; label: string }[] = [
    { key: 'all', label: 'Todos' },
    { key: 'active', label: 'Activos' },
    { key: 'for_sale', label: 'En Venta' },
    { key: 'used', label: 'Usados' },
];

const MyTicketsScreen = () => {
    const navigation = useNavigation<any>();
    const [tickets, setTickets] = useState<StoredTicket[]>([]);
    const [refreshing, setRefreshing] = useState(false);
    const [activeFilter, setActiveFilter] = useState<TicketFilter>('all');

    const filteredTickets = React.useMemo(() => {
        if (activeFilter === 'all') return tickets;
        return tickets.filter(t => t.status === activeFilter);
    }, [tickets, activeFilter]);

    const loadTickets = async () => {
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (user) {
                const data = await getUserTickets(user.id);
                setTickets(data.map(t => ({
                    id: t.id,
                    eventId: t.eventId,
                    eventTitle: t.eventTitle,
                    eventDate: t.eventDate.toISOString(),
                    eventLocation: t.eventLocation,
                    userId: t.userId,
                    userName: t.userName,
                    userEmail: t.userEmail,
                    price: t.price,
                    qrCode: t.qrCode,
                    status: t.status as 'active' | 'used' | 'transferred' | 'for_sale',
                    purchaseDate: t.purchaseDate.toISOString(),
                })));
            }
        } catch (error) {
            console.error('Error loading tickets:', error);
        }
    };

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
            case 'active': return '#00D9FF';
            case 'for_sale': return '#00FF9D';
            case 'used': return '#888';
            case 'transferred': return '#FF6B6B';
            default: return '#fff';
        }
    };

    const getStatusText = (status: string) => {
        switch (status) {
            case 'active': return 'ACTIVO';
            case 'for_sale': return 'EN VENTA';
            case 'used': return 'USADO';
            case 'transferred': return 'TRANSFERIDO';
            default: return status.toUpperCase();
        }
    };

    const renderTicketItem = ({ item }: { item: StoredTicket }) => {
        const isForSale = item.status === 'for_sale';

        return (
            <TouchableOpacity
                style={[styles.ticketCard, isForSale && styles.ticketCardForSale]}
                onPress={() => navigation.navigate('AttTicketDetalle', { ticketId: item.id })}
                activeOpacity={0.9}
            >
                <View style={styles.ticketHeader}>
                    <View style={[styles.statusBadge, { backgroundColor: getStatusColor(item.status) }]}>
                        <Text style={styles.statusText}>{getStatusText(item.status)}</Text>
                    </View>
                    <Text style={styles.qrCode}>#{item.qrCode.slice(-6)}</Text>
                </View>

                <Text style={styles.eventTitle}>{item.eventTitle}</Text>

                <View style={styles.infoRow}>
                    <Ionicons name="calendar-outline" size={16} color="#00D9FF" />
                    <Text style={styles.infoText}>
                        {item.eventDate ? new Date(item.eventDate).toLocaleDateString('es-AR', {
                            weekday: 'short',
                            day: 'numeric',
                            month: 'short',
                            hour: '2-digit',
                            minute: '2-digit',
                        }) : 'Fecha pendiente'}
                    </Text>
                </View>

                <View style={styles.infoRow}>
                    <Ionicons name="location-outline" size={16} color="#00D9FF" />
                    <Text style={styles.infoText}>{item.eventLocation}</Text>
                </View>

                <View style={styles.ticketFooter}>
                    <View>
                        <Text style={styles.priceLabel}>Pagaste</Text>
                        <Text style={styles.priceText}>${item.price?.toLocaleString() || '0'}</Text>
                    </View>
                    <Ionicons name="chevron-forward" size={20} color="#666" />
                </View>
            </TouchableOpacity>
        );
    };

    const renderEmptyState = () => (
        <View style={styles.emptyState}>
            <Ionicons name="ticket-outline" size={80} color="#333" />
            <Text style={styles.emptyTitle}>No tenés tickets</Text>
            <Text style={styles.emptySubtitle}>
                Cuando compres entradas para eventos, aparecerán aquí
            </Text>
            <TouchableOpacity
                style={styles.browseButton}
                onPress={() => navigation.navigate('Home')}
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

            {/* Filter Tabs */}
            <View style={styles.filterContainer}>
                {FILTER_TABS.map((tab) => {
                    const count = tab.key === 'all'
                        ? tickets.length
                        : tickets.filter(t => t.status === tab.key).length;
                    const isActive = activeFilter === tab.key;

                    return (
                        <TouchableOpacity
                            key={tab.key}
                            style={[styles.filterTab, isActive && styles.filterTabActive]}
                            onPress={() => setActiveFilter(tab.key)}
                        >
                            <Text style={[styles.filterTabText, isActive && styles.filterTabTextActive]}>
                                {tab.label}
                            </Text>
                            {count > 0 && (
                                <View style={[styles.filterBadge, isActive && styles.filterBadgeActive]}>
                                    <Text style={[styles.filterBadgeText, isActive && styles.filterBadgeTextActive]}>
                                        {count}
                                    </Text>
                                </View>
                            )}
                        </TouchableOpacity>
                    );
                })}
            </View>

            <FlatList
                data={filteredTickets}
                renderItem={renderTicketItem}
                keyExtractor={(item) => item.id}
                contentContainerStyle={[
                    styles.listContent,
                    filteredTickets.length === 0 && styles.emptyListContent,
                ]}
                showsVerticalScrollIndicator={false}
                ListEmptyComponent={renderEmptyState}
                refreshControl={
                    <RefreshControl
                        refreshing={refreshing}
                        onRefresh={onRefresh}
                        tintColor="#00D9FF"
                    />
                }
            />
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#000000',
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
        paddingBottom: 120,
    },
    emptyListContent: {
        flex: 1,
    },
    ticketCard: {
        backgroundColor: '#111111',
        borderRadius: 16,
        padding: 16,
        marginBottom: 16,
        borderWidth: 1,
        borderColor: '#222',
    },
    ticketCardForSale: {
        borderColor: '#00FF9D',
        borderWidth: 2,
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
    priceLabel: {
        color: '#666',
        fontSize: 11,
        marginBottom: 2,
    },
    priceText: {
        color: '#00D9FF',
        fontSize: 20,
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
        backgroundColor: '#00D9FF',
        paddingHorizontal: 30,
        paddingVertical: 14,
        borderRadius: 25,
    },
    browseButtonText: {
        color: '#000',
        fontWeight: 'bold',
        fontSize: 16,
    },
    // Filter Tabs
    filterContainer: {
        flexDirection: 'row',
        paddingHorizontal: 16,
        paddingVertical: 12,
        gap: 8,
        borderBottomWidth: 1,
        borderBottomColor: '#222',
    },
    filterTab: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 14,
        paddingVertical: 8,
        borderRadius: 20,
        backgroundColor: 'rgba(255,255,255,0.08)',
        gap: 6,
    },
    filterTabActive: {
        backgroundColor: '#00D9FF',
    },
    filterTabText: {
        color: '#888',
        fontSize: 13,
        fontWeight: '600',
    },
    filterTabTextActive: {
        color: '#000',
    },
    filterBadge: {
        backgroundColor: 'rgba(255,255,255,0.15)',
        paddingHorizontal: 6,
        paddingVertical: 2,
        borderRadius: 10,
        minWidth: 20,
        alignItems: 'center',
    },
    filterBadgeActive: {
        backgroundColor: 'rgba(0,0,0,0.2)',
    },
    filterBadgeText: {
        color: '#888',
        fontSize: 11,
        fontWeight: 'bold',
    },
    filterBadgeTextActive: {
        color: '#000',
    },
});

export default MyTicketsScreen;
