import React, { useEffect, useState, useMemo } from 'react';
import {
    View,
    Text,
    StyleSheet,
    SafeAreaView,
    StatusBar,
    ScrollView,
    TouchableOpacity,
    ActivityIndicator,
} from 'react-native';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { getEventTicketSales, PLATFORM_FEE_PERCENTAGE } from '../../../services/ticketService';

// Types for route params
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

    const [loading, setLoading] = useState(true);
    const [sales, setSales] = useState<any[]>([]);

    useEffect(() => {
        loadSales();
    }, [eventId]);

    const loadSales = async () => {
        if (!eventId) return;
        setLoading(true);
        try {
            const data = await getEventTicketSales(eventId);
            setSales(data);
        } catch (error) {
            console.error('Error loading event sales:', error);
        } finally {
            setLoading(false);
        }
    };

    const totalTickets = sales.length;
    const totalRevenue = sales.reduce((sum, t) => sum + (t.price || 0), 0);
    const showPlatformFee = PLATFORM_FEE_PERCENTAGE > 0;
    const baseRevenue = showPlatformFee ? totalRevenue / (1 + PLATFORM_FEE_PERCENTAGE) : totalRevenue;
    const platformFee = showPlatformFee ? totalRevenue - baseRevenue : 0;

    const ticketsByType = useMemo(() => {
        return sales.reduce((acc, t) => {
            const type = t.ticketType || 'General';
            acc[type] = (acc[type] || 0) + 1;
            return acc;
        }, {} as Record<string, number>);
    }, [sales]);

    const renderSaleItem = ({ item }: { item: any }) => (
        <View style={styles.saleCard}>
            <View style={styles.saleTop}>
                <View style={styles.buyerInfo}>
                    <View style={styles.avatar}>
                        <Text style={styles.avatarText}>{item.buyerName?.charAt(0) || 'U'}</Text>
                    </View>
                    <View>
                        <Text style={styles.buyerName}>{item.buyerName || 'Usuario'}</Text>
                        <Text style={styles.buyerEmail}>{item.email || 'sin email'}</Text>
                    </View>
                </View>
                <Text style={styles.salePrice}>${(item.price || 0).toLocaleString()}</Text>
            </View>
            <View style={styles.saleBottom}>
                <View style={styles.saleBadge}>
                    <Text style={styles.saleBadgeText}>{item.ticketType || 'General'}</Text>
                </View>
                <Text style={styles.saleDate}>
                    {item.date ? new Date(item.date).toLocaleDateString('es-AR', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' }) : ''}
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

            {loading ? (
                <View style={styles.loadingContainer}>
                    <ActivityIndicator size="large" color="#00D9FF" />
                    <Text style={styles.loadingText}>Cargando ventas...</Text>
                </View>
            ) : (
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
                            {showPlatformFee && (
                                <>
                                    <View style={styles.revenueDivider} />
                                    <View style={styles.revenueRow}>
                                        <Text style={styles.revenueLabel}>Comisión TiQly ({Math.round(PLATFORM_FEE_PERCENTAGE * 100)}%)</Text>
                                        <Text style={styles.revenueValueSmall}>-${platformFee.toLocaleString()}</Text>
                                    </View>
                                </>
                            )}
                            <View style={styles.revenueDivider} />
                            <View style={styles.revenueRow}>
                                <Text style={styles.revenueLabelBig}>Recibirás</Text>
                                <Text style={styles.revenueValueBig}>${Math.round(baseRevenue).toLocaleString()}</Text>
                            </View>
                        </View>
                    </View>

                    {/* Lotes Breakdown */}
                    <View style={styles.section}>
                        <Text style={styles.sectionTitle}>🎫 Por Tipo de Entrada</Text>
                        {Object.entries(ticketsByType).length === 0 ? (
                            <Text style={styles.emptyText}>Aún no hay ventas para este evento.</Text>
                        ) : (
                            Object.entries(ticketsByType).map(([type, count]) => (
                                <View key={type} style={styles.loteRow}>
                                    <View style={styles.loteInfo}>
                                        <View style={styles.loteIndicator} />
                                        <Text style={styles.loteName}>{type}</Text>
                                    </View>
                                    <Text style={styles.loteCount}>{count} vendidos</Text>
                                </View>
                            ))
                        )}
                    </View>

                    {/* Sales List */}
                    <View style={styles.section}>
                        <Text style={styles.sectionTitle}>📋 Últimas Ventas</Text>
                        {sales.length === 0 ? (
                            <Text style={styles.emptyText}>Sin ventas registradas todavía.</Text>
                        ) : (
                            sales.map((sale) => (
                                <View key={sale.id}>
                                    {renderSaleItem({ item: sale })}
                                </View>
                            ))
                        )}
                    </View>

                    <View style={{ height: 40 }} />
                </ScrollView>
            )}
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
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        gap: 12,
    },
    loadingText: {
        color: '#666',
        fontSize: 14,
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
    emptyText: {
        color: '#666',
        fontSize: 13,
    },
});

export default EventStatsScreen;


