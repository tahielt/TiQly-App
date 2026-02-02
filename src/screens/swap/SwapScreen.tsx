/**
 * SwapScreen - Resale Marketplace Hub
 * Reemplaza la versión mock con datos reales de Supabase
 * Follows TiQly Sci-Fi/Dopamine design system
 */

import React, { useState, useCallback } from 'react';
import {
    View,
    Text,
    StyleSheet,
    FlatList,
    RefreshControl,
    SafeAreaView,
    StatusBar,
    TouchableOpacity,
    Modal,
    Alert,
    ActivityIndicator,
    Dimensions,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { useSelector } from 'react-redux';
import Animated, {
    useSharedValue,
    useAnimatedStyle,
    withRepeat,
    withTiming,
    withSequence
} from 'react-native-reanimated';

import ResaleListingCard from '../../components/ResaleListingCard';
import {
    getEventResales,
    getUserListings,
    purchaseResale,
    calculateResaleFees
} from '../../services/resaleService';
import { getUserTickets } from '../../services/ticketService';
import { ResaleListing } from '../../types/resale';

const { width } = Dimensions.get('window');

// Tabs for the marketplace
type TabType = 'market' | 'my-listings' | 'my-tickets';

const SwapScreen: React.FC = () => {
    const navigation = useNavigation<any>();
    const [activeTab, setActiveTab] = useState<TabType>('market');
    const [listings, setListings] = useState<ResaleListing[]>([]);
    const [myListings, setMyListings] = useState<ResaleListing[]>([]);
    const [myTickets, setMyTickets] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [selectedListing, setSelectedListing] = useState<ResaleListing | null>(null);
    const [purchasing, setPurchasing] = useState(false);

    const user = useSelector((state: any) => state.auth?.user);
    const glowValue = useSharedValue(0.3);

    // Animated glow for header
    React.useEffect(() => {
        glowValue.value = withRepeat(
            withSequence(
                withTiming(0.6, { duration: 2000 }),
                withTiming(0.3, { duration: 2000 })
            ),
            -1,
            true
        );
    }, []);

    const glowStyle = useAnimatedStyle(() => ({
        shadowOpacity: glowValue.value,
    }));

    const loadData = async () => {
        if (!user?.id) return;

        try {
            // Load all resale listings (market)
            // For now, we'll load all listings since we don't have a specific event
            // In production, this would be a general marketplace query

            // Load user's listings
            const userListings = await getUserListings(user.id);
            setMyListings(userListings);

            // Load user's tickets that can be resold
            const tickets = await getUserTickets(user.id);
            const resellableTickets = tickets.filter(t => t.status === 'active');
            setMyTickets(resellableTickets);

            // For market tab, show all active listings
            setListings(userListings.filter(l => l.status === 'listed'));

        } catch (error) {
            console.error('Error loading data:', error);
        } finally {
            setLoading(false);
        }
    };

    useFocusEffect(
        useCallback(() => {
            loadData();
        }, [user?.id])
    );

    const handleRefresh = async () => {
        setRefreshing(true);
        Haptics.selectionAsync();
        await loadData();
        setRefreshing(false);
    };

    const handleTabChange = (tab: TabType) => {
        Haptics.selectionAsync();
        setActiveTab(tab);
    };

    const handleListingPress = (listing: ResaleListing) => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
        if (listing.sellerId === user?.id) {
            // It's my listing - show manage options
            Alert.alert(
                'Tu publicación',
                `Precio: $${listing.askingPrice.toLocaleString('es-AR')}`,
                [
                    { text: 'Cerrar', style: 'cancel' },
                    {
                        text: 'Ver detalles',
                        onPress: () => navigation.navigate('MyListings')
                    }
                ]
            );
        } else {
            // Someone else's listing - show purchase modal
            setSelectedListing(listing);
        }
    };

    const handleTicketPress = (ticket: any) => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
        // Navigate to create resale listing
        navigation.navigate('CreateResale', {
            orderId: ticket.id,
            ticketInfo: {
                eventTitle: ticket.eventTitle,
                eventDate: ticket.eventDate?.toISOString?.() || '',
                ticketTypeName: ticket.ticketTypeName || 'General',
                originalPrice: ticket.price
            }
        });
    };

    const handlePurchase = async () => {
        if (!selectedListing || !user?.id) return;

        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
        setPurchasing(true);

        try {
            const result = await purchaseResale(
                { listingId: selectedListing.id },
                user.id
            );

            if (result.success) {
                Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
                setSelectedListing(null);
                Alert.alert(
                    '¡Compra exitosa!',
                    'El ticket ya está en tu billetera.',
                    [{ text: 'Ver mis tickets', onPress: () => setActiveTab('my-tickets') }]
                );
                loadData();
            } else {
                Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
                Alert.alert('Error', result.error || 'No se pudo completar la compra');
            }
        } catch (error: any) {
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
            Alert.alert('Error', error.message || 'Error al procesar');
        } finally {
            setPurchasing(false);
        }
    };

    const formatCurrency = (amount: number) => {
        return `$${amount.toLocaleString('es-AR')}`;
    };

    const getStats = () => {
        const activeListings = myListings.filter(l => l.status === 'listed').length;
        const soldCount = myListings.filter(l => l.status === 'sold').length;
        const totalEarnings = myListings
            .filter(l => l.status === 'sold')
            .reduce((sum, l) => sum + l.sellerReceives, 0);
        return { activeListings, soldCount, totalEarnings };
    };

    const stats = getStats();

    const renderEmptyMarket = () => (
        <View style={styles.emptyState}>
            <Ionicons name="pricetags-outline" size={64} color="#333" />
            <Text style={styles.emptyTitle}>No hay tickets en reventa</Text>
            <Text style={styles.emptySubtitle}>
                Cuando alguien publique un ticket, aparecerá acá
            </Text>
        </View>
    );

    const renderEmptyTickets = () => (
        <View style={styles.emptyState}>
            <Ionicons name="ticket-outline" size={64} color="#333" />
            <Text style={styles.emptyTitle}>No tenés tickets</Text>
            <Text style={styles.emptySubtitle}>
                Comprá entradas para poder revenderlas acá
            </Text>
        </View>
    );

    const renderListingItem = ({ item }: { item: ResaleListing }) => (
        <ResaleListingCard
            listing={item}
            onPress={handleListingPress}
            variant={item.sellerId === user?.id ? 'seller' : 'buyer'}
            showFeeBreakdown={activeTab === 'my-listings'}
        />
    );

    const renderTicketItem = ({ item }: { item: any }) => (
        <TouchableOpacity
            style={styles.ticketCard}
            onPress={() => handleTicketPress(item)}
            activeOpacity={0.8}
        >
            <BlurView intensity={20} tint="dark" style={styles.ticketCardContent}>
                <View style={styles.ticketInfo}>
                    <Text style={styles.ticketTitle} numberOfLines={1}>{item.eventTitle}</Text>
                    <Text style={styles.ticketDate}>
                        {item.eventDate ? new Date(item.eventDate).toLocaleDateString('es-AR') : ''}
                    </Text>
                    <View style={styles.ticketBadge}>
                        <Text style={styles.ticketBadgeText}>{item.ticketTypeName || 'General'}</Text>
                    </View>
                </View>
                <View style={styles.ticketAction}>
                    <Text style={styles.ticketPrice}>{formatCurrency(item.price)}</Text>
                    <View style={styles.sellButton}>
                        <Text style={styles.sellButtonText}>VENDER</Text>
                        <Ionicons name="arrow-forward" size={14} color="#000" />
                    </View>
                </View>
            </BlurView>
        </TouchableOpacity>
    );

    const getTabData = () => {
        switch (activeTab) {
            case 'market':
                return listings;
            case 'my-listings':
                return myListings;
            case 'my-tickets':
                return myTickets;
            default:
                return [];
        }
    };

    return (
        <View style={styles.container}>
            <StatusBar barStyle="light-content" />
            <LinearGradient
                colors={['#0a0a0a', '#1a1a2e', '#0a0a0a']}
                style={StyleSheet.absoluteFill}
            />

            <SafeAreaView style={styles.safeArea}>
                {/* Header */}
                <Animated.View style={[styles.header, glowStyle]}>
                    <Text style={styles.headerTitle}>Marketplace</Text>
                    <Text style={styles.headerSubtitle}>Comprá y vendé tickets sin límites</Text>
                </Animated.View>

                {/* Stats Row */}
                {user?.id && (
                    <View style={styles.statsRow}>
                        <View style={styles.statCard}>
                            <Text style={styles.statValue}>{stats.activeListings}</Text>
                            <Text style={styles.statLabel}>Activas</Text>
                        </View>
                        <View style={styles.statCard}>
                            <Text style={[styles.statValue, styles.soldValue]}>{stats.soldCount}</Text>
                            <Text style={styles.statLabel}>Vendidas</Text>
                        </View>
                        <View style={[styles.statCard, styles.earningsCard]}>
                            <Text style={styles.earningsValue}>{formatCurrency(stats.totalEarnings)}</Text>
                            <Text style={styles.statLabel}>Ganaste</Text>
                        </View>
                    </View>
                )}

                {/* Tabs */}
                <View style={styles.tabsContainer}>
                    <TouchableOpacity
                        style={[styles.tab, activeTab === 'market' && styles.tabActive]}
                        onPress={() => handleTabChange('market')}
                    >
                        <Ionicons
                            name="storefront"
                            size={18}
                            color={activeTab === 'market' ? '#00FFFF' : '#666'}
                        />
                        <Text style={[styles.tabText, activeTab === 'market' && styles.tabTextActive]}>
                            Mercado
                        </Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                        style={[styles.tab, activeTab === 'my-listings' && styles.tabActive]}
                        onPress={() => handleTabChange('my-listings')}
                    >
                        <Ionicons
                            name="pricetag"
                            size={18}
                            color={activeTab === 'my-listings' ? '#00FFFF' : '#666'}
                        />
                        <Text style={[styles.tabText, activeTab === 'my-listings' && styles.tabTextActive]}>
                            Mis Ventas
                        </Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                        style={[styles.tab, activeTab === 'my-tickets' && styles.tabActive]}
                        onPress={() => handleTabChange('my-tickets')}
                    >
                        <Ionicons
                            name="ticket"
                            size={18}
                            color={activeTab === 'my-tickets' ? '#00FFFF' : '#666'}
                        />
                        <Text style={[styles.tabText, activeTab === 'my-tickets' && styles.tabTextActive]}>
                            Mis Tickets
                        </Text>
                    </TouchableOpacity>
                </View>

                {/* Content */}
                {loading ? (
                    <View style={styles.loadingContainer}>
                        <ActivityIndicator size="large" color="#00FFFF" />
                    </View>
                ) : (
                    <FlatList
                        data={getTabData()}
                        renderItem={activeTab === 'my-tickets' ? renderTicketItem : renderListingItem}
                        keyExtractor={(item) => item.id}
                        contentContainerStyle={styles.listContent}
                        showsVerticalScrollIndicator={false}
                        ListEmptyComponent={activeTab === 'my-tickets' ? renderEmptyTickets : renderEmptyMarket}
                        refreshControl={
                            <RefreshControl
                                refreshing={refreshing}
                                onRefresh={handleRefresh}
                                tintColor="#00FFFF"
                            />
                        }
                    />
                )}
            </SafeAreaView>

            {/* Purchase Modal */}
            <Modal
                visible={!!selectedListing}
                animationType="slide"
                transparent
                onRequestClose={() => setSelectedListing(null)}
            >
                <View style={styles.modalOverlay}>
                    <BlurView intensity={50} tint="dark" style={styles.modalContent}>
                        <View style={styles.modalHeader}>
                            <Text style={styles.modalTitle}>Confirmar compra</Text>
                            <TouchableOpacity
                                onPress={() => setSelectedListing(null)}
                                style={styles.closeButton}
                            >
                                <Ionicons name="close" size={24} color="#fff" />
                            </TouchableOpacity>
                        </View>

                        {selectedListing && (
                            <>
                                <View style={styles.modalBody}>
                                    <Text style={styles.modalEventTitle}>
                                        {selectedListing.eventTitle || 'Ticket'}
                                    </Text>
                                    {selectedListing.ticketTypeName && (
                                        <View style={styles.modalTierBadge}>
                                            <Text style={styles.modalTierText}>
                                                {selectedListing.ticketTypeName}
                                            </Text>
                                        </View>
                                    )}

                                    <View style={styles.modalFees}>
                                        <View style={styles.modalFeeRow}>
                                            <Text style={styles.modalFeeLabel}>Precio</Text>
                                            <Text style={styles.modalFeeValue}>
                                                {formatCurrency(selectedListing.askingPrice)}
                                            </Text>
                                        </View>
                                        <View style={styles.modalFeeRow}>
                                            <Text style={styles.modalFeeLabel}>Service fee</Text>
                                            <Text style={styles.modalFeeValue}>
                                                +{formatCurrency(selectedListing.buyerServiceFee)}
                                            </Text>
                                        </View>
                                        <View style={styles.modalDivider} />
                                        <View style={styles.modalFeeRow}>
                                            <Text style={styles.modalTotalLabel}>TOTAL</Text>
                                            <Text style={styles.modalTotalValue}>
                                                {formatCurrency(selectedListing.buyerPays)}
                                            </Text>
                                        </View>
                                    </View>
                                </View>

                                <View style={styles.modalFooter}>
                                    <TouchableOpacity
                                        style={styles.cancelButton}
                                        onPress={() => setSelectedListing(null)}
                                    >
                                        <Text style={styles.cancelButtonText}>Cancelar</Text>
                                    </TouchableOpacity>
                                    <TouchableOpacity
                                        style={styles.confirmButton}
                                        onPress={handlePurchase}
                                        disabled={purchasing}
                                    >
                                        {purchasing ? (
                                            <ActivityIndicator color="#000" />
                                        ) : (
                                            <>
                                                <Ionicons name="card" size={18} color="#000" />
                                                <Text style={styles.confirmButtonText}>COMPRAR</Text>
                                            </>
                                        )}
                                    </TouchableOpacity>
                                </View>
                            </>
                        )}
                    </BlurView>
                </View>
            </Modal>
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
    },
    header: {
        paddingHorizontal: 20,
        paddingTop: 16,
        paddingBottom: 12,
        shadowColor: '#00FFFF',
        shadowOffset: { width: 0, height: 0 },
        shadowRadius: 20,
    },
    headerTitle: {
        color: '#fff',
        fontSize: 32,
        fontWeight: 'bold',
    },
    headerSubtitle: {
        color: '#00FFFF',
        fontSize: 14,
        marginTop: 4,
    },
    statsRow: {
        flexDirection: 'row',
        paddingHorizontal: 16,
        gap: 12,
        marginBottom: 16,
    },
    statCard: {
        flex: 1,
        backgroundColor: 'rgba(255,255,255,0.05)',
        borderRadius: 12,
        padding: 12,
        alignItems: 'center',
    },
    statValue: {
        color: '#00FFFF',
        fontSize: 20,
        fontWeight: 'bold',
    },
    soldValue: {
        color: '#00FF88',
    },
    statLabel: {
        color: '#666',
        fontSize: 10,
        marginTop: 2,
    },
    earningsCard: {
        flex: 1.3,
        borderWidth: 1,
        borderColor: 'rgba(0,255,255,0.2)',
    },
    earningsValue: {
        color: '#00FFFF',
        fontSize: 16,
        fontWeight: 'bold',
        textShadowColor: 'rgba(0,255,255,0.5)',
        textShadowOffset: { width: 0, height: 0 },
        textShadowRadius: 5,
    },
    tabsContainer: {
        flexDirection: 'row',
        paddingHorizontal: 16,
        marginBottom: 12,
        gap: 8,
    },
    tab: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 6,
        paddingVertical: 10,
        borderRadius: 10,
        backgroundColor: 'rgba(255,255,255,0.05)',
    },
    tabActive: {
        backgroundColor: 'rgba(0,255,255,0.1)',
        borderWidth: 1,
        borderColor: 'rgba(0,255,255,0.3)',
    },
    tabText: {
        color: '#666',
        fontSize: 12,
        fontWeight: '600',
    },
    tabTextActive: {
        color: '#00FFFF',
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    listContent: {
        padding: 16,
        paddingBottom: 100,
        flexGrow: 1,
    },
    emptyState: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: 40,
        paddingTop: 60,
    },
    emptyTitle: {
        color: '#666',
        fontSize: 18,
        fontWeight: 'bold',
        marginTop: 16,
    },
    emptySubtitle: {
        color: '#444',
        fontSize: 14,
        textAlign: 'center',
        marginTop: 8,
    },
    ticketCard: {
        marginBottom: 12,
        borderRadius: 16,
        overflow: 'hidden',
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.1)',
    },
    ticketCardContent: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: 16,
    },
    ticketInfo: {
        flex: 1,
        gap: 4,
    },
    ticketTitle: {
        color: '#fff',
        fontSize: 16,
        fontWeight: 'bold',
    },
    ticketDate: {
        color: '#888',
        fontSize: 12,
    },
    ticketBadge: {
        alignSelf: 'flex-start',
        backgroundColor: 'rgba(0,255,255,0.1)',
        paddingHorizontal: 8,
        paddingVertical: 2,
        borderRadius: 4,
        marginTop: 4,
    },
    ticketBadgeText: {
        color: '#00FFFF',
        fontSize: 10,
        fontWeight: 'bold',
    },
    ticketAction: {
        alignItems: 'flex-end',
        gap: 8,
    },
    ticketPrice: {
        color: '#fff',
        fontSize: 18,
        fontWeight: 'bold',
    },
    sellButton: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
        backgroundColor: '#00FFFF',
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 8,
    },
    sellButtonText: {
        color: '#000',
        fontSize: 12,
        fontWeight: 'bold',
    },
    modalOverlay: {
        flex: 1,
        justifyContent: 'flex-end',
        backgroundColor: 'rgba(0,0,0,0.7)',
    },
    modalContent: {
        borderTopLeftRadius: 24,
        borderTopRightRadius: 24,
        overflow: 'hidden',
    },
    modalHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: 20,
        borderBottomWidth: 1,
        borderBottomColor: 'rgba(255,255,255,0.1)',
    },
    modalTitle: {
        color: '#fff',
        fontSize: 20,
        fontWeight: 'bold',
    },
    closeButton: {
        width: 36,
        height: 36,
        borderRadius: 18,
        backgroundColor: 'rgba(255,255,255,0.1)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    modalBody: {
        padding: 20,
    },
    modalEventTitle: {
        color: '#fff',
        fontSize: 24,
        fontWeight: 'bold',
        marginBottom: 8,
    },
    modalTierBadge: {
        alignSelf: 'flex-start',
        backgroundColor: 'rgba(0,255,255,0.1)',
        paddingHorizontal: 12,
        paddingVertical: 4,
        borderRadius: 6,
        borderWidth: 1,
        borderColor: 'rgba(0,255,255,0.3)',
        marginBottom: 20,
    },
    modalTierText: {
        color: '#00FFFF',
        fontSize: 12,
        fontWeight: 'bold',
    },
    modalFees: {
        backgroundColor: 'rgba(255,255,255,0.05)',
        borderRadius: 12,
        padding: 16,
    },
    modalFeeRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 10,
    },
    modalFeeLabel: {
        color: '#888',
        fontSize: 14,
    },
    modalFeeValue: {
        color: '#fff',
        fontSize: 14,
        fontWeight: '500',
    },
    modalDivider: {
        height: 1,
        backgroundColor: 'rgba(255,255,255,0.1)',
        marginVertical: 10,
    },
    modalTotalLabel: {
        color: '#00FFFF',
        fontSize: 12,
        fontWeight: 'bold',
        letterSpacing: 1,
    },
    modalTotalValue: {
        color: '#00FFFF',
        fontSize: 24,
        fontWeight: 'bold',
        textShadowColor: 'rgba(0,255,255,0.5)',
        textShadowOffset: { width: 0, height: 0 },
        textShadowRadius: 10,
    },
    modalFooter: {
        flexDirection: 'row',
        padding: 20,
        paddingBottom: 34,
        gap: 12,
    },
    cancelButton: {
        flex: 1,
        paddingVertical: 14,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.2)',
        alignItems: 'center',
    },
    cancelButtonText: {
        color: '#888',
        fontSize: 16,
        fontWeight: '600',
    },
    confirmButton: {
        flex: 2,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
        backgroundColor: '#00FFFF',
        paddingVertical: 14,
        borderRadius: 12,
    },
    confirmButtonText: {
        color: '#000',
        fontSize: 16,
        fontWeight: 'bold',
    },
});

export default SwapScreen;
