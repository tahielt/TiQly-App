import React, { useEffect, useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    SafeAreaView,
    StatusBar,
    ScrollView,
    TouchableOpacity,
    FlatList,
} from 'react-native';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';

// Mock data for demonstration
const MOCK_TICKET_SALES = [
    { id: '1', buyerName: 'Juan Pérez', email: 'juan@mail.com', ticketType: 'Early Bird', price: 15000, date: '2025-01-02T20:30:00' },
    { id: '2', buyerName: 'María García', email: 'maria@mail.com', ticketType: 'VIP', price: 35000, date: '2025-01-02T21:15:00' },
    { id: '3', buyerName: 'Carlos López', email: 'carlos@mail.com', ticketType: 'General', price: 20000, date: '2025-01-03T14:00:00' },
    { id: '4', buyerName: 'Ana Fernández', email: 'ana@mail.com', ticketType: 'Early Bird', price: 15000, date: '2025-01-03T15:30:00' },
    { id: '5', buyerName: 'Luis Martínez', email: 'luis@mail.com', ticketType: 'General', price: 20000, date: '2025-01-03T16:45:00' },
];

type RouteParams = {
    EventStats: {
        eventId: string;
        eventTitle: string;
    };
};

const EventStatsScreen = () => {
    const navigation = useNavigation<any>();
    const route = useRoute<RouteProp<RouteParams, 'EventStats'>>();
    const { eventId, eventTitle } = route.params || { eventId: '', eventTitle: 'Evento' };

    const [activeTab, setActiveTab] = useState<'ventas' | 'lotes'>('ventas');

    // Calculate stats from mock data
    const totalTickets = MOCK_TICKET_SALES.length;
    const totalRevenue = MOCK_TICKET_SALES.reduce((sum, t) => sum + t.price, 0);
    const ticketsByType = MOCK_TICKET_SALES.reduce((acc, t) => {
        acc[t.ticketType] = (acc[t.ticketType] || 0) + 1;
        return acc;
    }, {} as Record<string, number>);

    const renderSaleItem = ({ item }: { item: typeof MOCK_TICKET_SALES[0] }) => (
        <View style={styles.saleCard}>
            <View style={styles.saleTop}>
                <View style={styles.buyerInfo}>
                    <View style={styles.avatar}>
                        <Text style={styles.avatarText}>{item.buyerName.charAt(0)}</Text>
                    </View>
                    <View>
                        <Text style={styles.buyerName}>{item.buyerName}</Text>
                        <Text style={styles.buyerEmail}>{item.email}</Text>
                    </View>
                </View>
                <Text style={styles.salePrice}>${item.price.toLocaleString()}</Text>
            </View>
            <View style={styles.saleBottom}>
                <View style={styles.saleBadge}>
                    <Text style={styles.saleBadgeText}>{item.ticketType}</Text>
                </View>
                <Text style={styles.saleDate}>
                    {new Date(item.date).toLocaleDateString('es-AR', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
                </Text>
            </View>
        </View>
    );

    return (
        <SafeAreaView style={styles.container}>
            <StatusBar barStyle="light-content" />

            {/* Header */}
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
                    <Ionicons name="arrow-back" size={24} color="#fff" />
                </TouchableOpacity>
                <View style={styles.headerCenter}>
                    <Text style={styles.headerTitle}>Estadísticas</Text>
                    <Text style={styles.headerSubtitle} numberOfLines={1}>{eventTitle}</Text>
                </View>
                <View style={{ width: 40 }} />
            </View>

            <ScrollView>
                {/* Stats Cards */}
                <View style={styles.statsGrid}>
                    <View style={styles.statCard}>
                        <Ionicons name="ticket" size={28} color="#00D9FF" />
                        <Text style={styles.statValue}>{totalTickets}</Text>
                        <Text style={styles.statLabel}>Tickets Vendidos</Text>
                    </View>
                    <View style={styles.statCard}>
                        <Ionicons name="cash" size={28} color="#00FF9D" />
                        <Text style={styles.statValue}>${(totalRevenue / 1000).toFixed(0)}k</Text>
                        <Text style={styles.statLabel}>Recaudación Total</Text>
                    </View>
                </View>

                {/* Revenue Breakdown */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>💰 Tu Ganancia Neta</Text>
                    <View style={styles.revenueCard}>
                        <View style={styles.revenueRow}>
                            <Text style={styles.revenueLabel}>Total Vendido</Text>
                            <Text style={styles.revenueValue}>${totalRevenue.toLocaleString()}</Text>
                        </View>
                        <View style={styles.revenueDivider} />
                        <View style={styles.revenueRow}>
                            <Text style={styles.revenueLabel}>Comisión TiQly (15%)</Text>
                            <Text style={styles.revenueValueSmall}>Pagado por compradores</Text>
                        </View>
                        <View style={styles.revenueDivider} />
                        <View style={styles.revenueRow}>
                            <Text style={styles.revenueLabelBig}>Recibirás</Text>
                            <Text style={styles.revenueValueBig}>${totalRevenue.toLocaleString()}</Text>
                        </View>
                    </View>
                </View>

                {/* Lotes Breakdown */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>🎫 Por Tipo de Entrada</Text>
                    {Object.entries(ticketsByType).map(([type, count]) => (
                        <View key={type} style={styles.loteRow}>
                            <View style={styles.loteInfo}>
                                <View style={styles.loteIndicator} />
                                <Text style={styles.loteName}>{type}</Text>
                            </View>
                            <Text style={styles.loteCount}>{count} vendidos</Text>
                        </View>
                    ))}
                </View>

                {/* Sales List */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>📋 Últimas Ventas</Text>
                    {MOCK_TICKET_SALES.map((sale) => (
                        <View key={sale.id}>
                            {renderSaleItem({ item: sale })}
                        </View>
                    ))}
                </View>

                <View style={{ height: 40 }} />
            </ScrollView>
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
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 16,
        paddingVertical: 16,
        backgroundColor: '#111',
        borderBottomWidth: 1,
        borderBottomColor: '#222',
    },
    backBtn: {
        padding: 8,
    },
    headerCenter: {
        flex: 1,
        alignItems: 'center',
    },
    headerTitle: {
        color: '#fff',
        fontSize: 18,
        fontWeight: 'bold',
    },
    headerSubtitle: {
        color: '#666',
        fontSize: 12,
        marginTop: 2,
    },
    statsGrid: {
        flexDirection: 'row',
        padding: 16,
        gap: 12,
    },
    statCard: {
        flex: 1,
        backgroundColor: '#111',
        borderRadius: 16,
        padding: 20,
        alignItems: 'center',
        borderWidth: 1,
        borderColor: '#222',
    },
    statValue: {
        color: '#fff',
        fontSize: 32,
        fontWeight: '900',
        marginTop: 12,
    },
    statLabel: {
        color: '#666',
        fontSize: 12,
        fontWeight: 'bold',
        marginTop: 4,
        textTransform: 'uppercase',
    },
    section: {
        paddingHorizontal: 16,
        marginBottom: 24,
    },
    sectionTitle: {
        color: '#fff',
        fontSize: 16,
        fontWeight: '900',
        marginBottom: 12,
    },
    revenueCard: {
        backgroundColor: '#111',
        borderRadius: 16,
        padding: 16,
        borderWidth: 1,
        borderColor: '#222',
    },
    revenueRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingVertical: 12,
    },
    revenueDivider: {
        height: 1,
        backgroundColor: '#222',
    },
    revenueLabel: {
        color: '#888',
        fontSize: 14,
    },
    revenueValue: {
        color: '#fff',
        fontSize: 16,
        fontWeight: 'bold',
    },
    revenueValueSmall: {
        color: '#00D9FF',
        fontSize: 12,
        fontWeight: 'bold',
    },
    revenueLabelBig: {
        color: '#00FF9D',
        fontSize: 16,
        fontWeight: 'bold',
    },
    revenueValueBig: {
        color: '#00FF9D',
        fontSize: 24,
        fontWeight: '900',
    },
    loteRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        backgroundColor: '#111',
        padding: 16,
        borderRadius: 12,
        marginBottom: 8,
        borderWidth: 1,
        borderColor: '#222',
    },
    loteInfo: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
    },
    loteIndicator: {
        width: 8,
        height: 8,
        borderRadius: 4,
        backgroundColor: '#00D9FF',
    },
    loteName: {
        color: '#fff',
        fontSize: 14,
        fontWeight: 'bold',
    },
    loteCount: {
        color: '#666',
        fontSize: 14,
    },
    saleCard: {
        backgroundColor: '#111',
        borderRadius: 12,
        padding: 16,
        marginBottom: 8,
        borderWidth: 1,
        borderColor: '#222',
    },
    saleTop: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 12,
    },
    buyerInfo: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
    },
    avatar: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: '#00D9FF',
        justifyContent: 'center',
        alignItems: 'center',
    },
    avatarText: {
        color: '#000',
        fontWeight: 'bold',
        fontSize: 16,
    },
    buyerName: {
        color: '#fff',
        fontWeight: 'bold',
        fontSize: 14,
    },
    buyerEmail: {
        color: '#666',
        fontSize: 12,
    },
    salePrice: {
        color: '#00FF9D',
        fontWeight: '900',
        fontSize: 16,
    },
    saleBottom: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    saleBadge: {
        backgroundColor: 'rgba(0, 217, 255, 0.1)',
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 8,
        borderWidth: 1,
        borderColor: 'rgba(0, 217, 255, 0.2)',
    },
    saleBadgeText: {
        color: '#00D9FF',
        fontSize: 11,
        fontWeight: 'bold',
    },
    saleDate: {
        color: '#555',
        fontSize: 11,
    },
});

export default EventStatsScreen;
