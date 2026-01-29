import React, { useState, useRef, useCallback } from 'react';
import {
    View,
    Text,
    StyleSheet,
    FlatList,
    TouchableOpacity,
    SafeAreaView,
    StatusBar,
    RefreshControl,
    Animated,
    Modal,
    Image,
    ScrollView,
    NativeSyntheticEvent,
    NativeScrollEvent,
} from 'react-native';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { getUserTickets } from '../../services/ticketService';
import { supabase } from '../../lib/supabase';

// Mock swap listings
const MOCK_SWAP_LISTINGS = [
    {
        id: 'swap1',
        eventTitle: 'Gotham White Party',
        eventDate: '2026-01-18T23:00:00',
        eventImage: 'https://images.unsplash.com/photo-1571266028243-3716f02d2d2e?w=200',
        tier: 'TIER 1',
        originalPrice: 5000,
        resalePrice: 35295,
        sellerName: 'Juan M.',
    },
    {
        id: 'swap2',
        eventTitle: 'Boris Brejcha',
        eventDate: '2026-01-25T22:00:00',
        eventImage: 'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=200',
        tier: 'VIP',
        originalPrice: 15000,
        resalePrice: 45000,
        sellerName: 'María G.',
    },
    {
        id: 'swap3',
        eventTitle: 'Hash Fest - Apertura',
        eventDate: '2026-01-20T23:30:00',
        eventImage: 'https://images.unsplash.com/photo-1545128485-c400e7702796?w=200',
        tier: 'General',
        originalPrice: 3500,
        resalePrice: 4500,
        sellerName: 'Lucas T.',
    },
];

interface SwapListing {
    id: string;
    eventTitle: string;
    eventDate: string;
    eventImage: string;
    tier: string;
    originalPrice: number;
    resalePrice: number;
    sellerName: string;
}

interface UserTicket {
    id: string;
    eventTitle: string;
    eventDate: string;
    price: number;
    status: string;
}

const SwapScreen = () => {
    const navigation = useNavigation<any>();
    const [listings, setListings] = useState<SwapListing[]>(MOCK_SWAP_LISTINGS);
    const [refreshing, setRefreshing] = useState(false);
    const [publishModalVisible, setPublishModalVisible] = useState(false);
    const [userTickets, setUserTickets] = useState<UserTicket[]>([]);
    const [selectedFilter, setSelectedFilter] = useState('Todos');

    // FAB animation
    const fabWidth = useRef(new Animated.Value(140)).current;
    const fabTextOpacity = useRef(new Animated.Value(1)).current;
    const lastScrollY = useRef(0);

    useFocusEffect(
        useCallback(() => {
            loadUserTickets();
        }, [])
    );

    const loadUserTickets = async () => {
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (user) {
                const data = await getUserTickets(user.id);
                setUserTickets(data.filter(t => t.status === 'active').map(t => ({
                    id: t.id,
                    eventTitle: t.eventTitle,
                    eventDate: t.eventDate.toISOString(),
                    price: t.price,
                    status: t.status,
                })));
            }
        } catch (error) {
            console.error('Error loading user tickets:', error);
        }
    };

    const onRefresh = async () => {
        setRefreshing(true);
        // In production: fetch from API
        await new Promise(resolve => setTimeout(resolve, 1000));
        setRefreshing(false);
    };

    // Animate FAB based on scroll direction
    const handleScroll = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
        const currentY = event.nativeEvent.contentOffset.y;
        const isScrollingDown = currentY > lastScrollY.current && currentY > 50;

        if (isScrollingDown) {
            // Collapse FAB
            Animated.parallel([
                Animated.spring(fabWidth, {
                    toValue: 56,
                    tension: 100,
                    friction: 10,
                    useNativeDriver: false,
                }),
                Animated.timing(fabTextOpacity, {
                    toValue: 0,
                    duration: 150,
                    useNativeDriver: false,
                }),
            ]).start();
        } else {
            // Expand FAB
            Animated.parallel([
                Animated.spring(fabWidth, {
                    toValue: 140,
                    tension: 80,
                    friction: 10,
                    useNativeDriver: false,
                }),
                Animated.timing(fabTextOpacity, {
                    toValue: 1,
                    duration: 200,
                    useNativeDriver: false,
                }),
            ]).start();
        }

        lastScrollY.current = currentY;
    };

    const formatDate = (dateString: string) => {
        const date = new Date(dateString);
        return date.toLocaleDateString('es-AR', { day: '2-digit', month: '2-digit' });
    };

    const handlePublish = (ticket: UserTicket) => {
        // In production: navigate to price setting screen
        setPublishModalVisible(false);
        // Mock: add to listings
        const newListing: SwapListing = {
            id: `swap-${Date.now()}`,
            eventTitle: ticket.eventTitle,
            eventDate: ticket.eventDate,
            eventImage: 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=200',
            tier: 'General',
            originalPrice: ticket.price,
            resalePrice: ticket.price * 1.2,
            sellerName: 'Vos',
        };
        setListings([newListing, ...listings]);
    };

    const renderListingCard = ({ item }: { item: SwapListing }) => (
        <TouchableOpacity style={styles.listingCard} activeOpacity={0.9}>
            <Image source={{ uri: item.eventImage }} style={styles.listingImage} />

            <View style={styles.listingContent}>
                <View style={styles.listingHeader}>
                    <Ionicons name="ticket-outline" size={14} color="#888" />
                    <Text style={styles.listingDate}>{formatDate(item.eventDate)}</Text>
                </View>

                <Text style={styles.listingTitle} numberOfLines={1}>{item.eventTitle}</Text>

                <Text style={styles.listingTier}>{item.tier}</Text>
            </View>

            <View style={styles.listingPrice}>
                <Text style={styles.priceValue}>${item.resalePrice.toLocaleString()}</Text>
            </View>
        </TouchableOpacity>
    );

    const renderEmptyState = () => (
        <View style={styles.emptyState}>
            <Ionicons name="swap-horizontal" size={64} color="#333" />
            <Text style={styles.emptyTitle}>No hay tickets en venta</Text>
            <Text style={styles.emptySubtitle}>
                Sé el primero en publicar un ticket
            </Text>
        </View>
    );

    const filters = ['Todos', 'Cerca', 'Esta semana', 'Menor precio'];

    return (
        <SafeAreaView style={styles.container}>
            <StatusBar barStyle="light-content" />

            {/* Header */}
            <View style={styles.header}>
                <Text style={styles.headerTitle}>Swap</Text>
                <TouchableOpacity style={styles.searchButton}>
                    <Ionicons name="search" size={22} color="#fff" />
                </TouchableOpacity>
            </View>

            {/* Filters */}
            <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                style={styles.filtersScroll}
                contentContainerStyle={styles.filtersContent}
            >
                {filters.map(filter => (
                    <TouchableOpacity
                        key={filter}
                        style={[styles.filterChip, selectedFilter === filter && styles.filterChipActive]}
                        onPress={() => setSelectedFilter(filter)}
                    >
                        {filter === 'Cerca' && <Ionicons name="location" size={14} color={selectedFilter === filter ? '#000' : '#888'} />}
                        {filter === 'Esta semana' && <Ionicons name="calendar" size={14} color={selectedFilter === filter ? '#000' : '#888'} />}
                        <Text style={[styles.filterText, selectedFilter === filter && styles.filterTextActive]}>
                            {filter}
                        </Text>
                    </TouchableOpacity>
                ))}
            </ScrollView>

            {/* Listings */}
            <FlatList
                data={listings}
                renderItem={renderListingCard}
                keyExtractor={item => item.id}
                contentContainerStyle={styles.listContent}
                showsVerticalScrollIndicator={false}
                ListEmptyComponent={renderEmptyState}
                onScroll={handleScroll}
                scrollEventThrottle={16}
                refreshControl={
                    <RefreshControl
                        refreshing={refreshing}
                        onRefresh={onRefresh}
                        tintColor="#00D9FF"
                    />
                }
            />

            {/* Animated FAB */}
            <Animated.View style={[styles.fab, { width: fabWidth }]}>
                <TouchableOpacity
                    style={styles.fabTouchable}
                    onPress={() => setPublishModalVisible(true)}
                    activeOpacity={0.9}
                >
                    <Ionicons name="add" size={24} color="#000" />
                    <Animated.Text style={[styles.fabText, { opacity: fabTextOpacity }]}>
                        Publicar
                    </Animated.Text>
                </TouchableOpacity>
            </Animated.View>

            {/* Publish Modal */}
            <Modal
                visible={publishModalVisible}
                transparent
                animationType="slide"
                onRequestClose={() => setPublishModalVisible(false)}
            >
                <View style={styles.modalOverlay}>
                    <View style={styles.modalContent}>
                        <View style={styles.modalHeader}>
                            <Text style={styles.modalTitle}>Publicar Ticket</Text>
                            <TouchableOpacity onPress={() => setPublishModalVisible(false)}>
                                <Ionicons name="close" size={24} color="#fff" />
                            </TouchableOpacity>
                        </View>

                        <Text style={styles.modalSubtitle}>
                            Seleccioná el ticket que querés vender
                        </Text>

                        {userTickets.length === 0 ? (
                            <View style={styles.noTickets}>
                                <Ionicons name="ticket-outline" size={48} color="#333" />
                                <Text style={styles.noTicketsText}>No tenés tickets activos</Text>
                            </View>
                        ) : (
                            <ScrollView style={styles.ticketList}>
                                {userTickets.map(ticket => (
                                    <TouchableOpacity
                                        key={ticket.id}
                                        style={styles.ticketOption}
                                        onPress={() => handlePublish(ticket)}
                                    >
                                        <View style={styles.ticketOptionInfo}>
                                            <Text style={styles.ticketOptionTitle}>{ticket.eventTitle}</Text>
                                            <Text style={styles.ticketOptionDate}>
                                                {formatDate(ticket.eventDate)}
                                            </Text>
                                        </View>
                                        <Ionicons name="chevron-forward" size={20} color="#666" />
                                    </TouchableOpacity>
                                ))}
                            </ScrollView>
                        )}

                        <View style={styles.commissionNote}>
                            <Ionicons name="information-circle" size={16} color="#888" />
                            <Text style={styles.commissionNoteText}>
                                TiQly cobra 10% de comisión por cada venta
                            </Text>
                        </View>
                    </View>
                </View>
            </Modal>
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
        paddingHorizontal: 20,
        paddingVertical: 16,
    },
    headerTitle: {
        color: '#fff',
        fontSize: 28,
        fontWeight: '800',
    },
    searchButton: {
        width: 44,
        height: 44,
        borderRadius: 22,
        backgroundColor: 'rgba(255,255,255,0.1)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    filtersScroll: {
        maxHeight: 50,
        marginBottom: 8,
    },
    filtersContent: {
        paddingHorizontal: 20,
        gap: 8,
    },
    filterChip: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        paddingHorizontal: 16,
        paddingVertical: 10,
        borderRadius: 20,
        backgroundColor: '#111',
        borderWidth: 1,
        borderColor: '#222',
    },
    filterChipActive: {
        backgroundColor: '#00D9FF',
        borderColor: '#00D9FF',
    },
    filterText: {
        color: '#888',
        fontSize: 14,
        fontWeight: '600',
    },
    filterTextActive: {
        color: '#000',
    },
    listContent: {
        padding: 20,
        paddingBottom: 120,
    },
    listingCard: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#111',
        borderRadius: 16,
        padding: 12,
        marginBottom: 12,
        borderWidth: 1,
        borderColor: '#1a1a1a',
    },
    listingImage: {
        width: 60,
        height: 60,
        borderRadius: 12,
        backgroundColor: '#222',
    },
    listingContent: {
        flex: 1,
        marginLeft: 14,
    },
    listingHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        marginBottom: 4,
    },
    listingDate: {
        color: '#666',
        fontSize: 12,
    },
    listingTitle: {
        color: '#fff',
        fontSize: 16,
        fontWeight: '700',
        marginBottom: 4,
    },
    listingTier: {
        color: '#888',
        fontSize: 12,
    },
    listingPrice: {
        backgroundColor: '#000',
        paddingHorizontal: 14,
        paddingVertical: 10,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: '#222',
    },
    priceValue: {
        color: '#00FF9D',
        fontSize: 16,
        fontWeight: '800',
    },
    emptyState: {
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 80,
    },
    emptyTitle: {
        color: '#fff',
        fontSize: 20,
        fontWeight: '700',
        marginTop: 16,
    },
    emptySubtitle: {
        color: '#666',
        fontSize: 14,
        marginTop: 8,
    },
    fab: {
        position: 'absolute',
        bottom: 100,
        right: 20,
        height: 56,
        borderRadius: 28,
        backgroundColor: '#00D9FF',
        overflow: 'hidden',
        shadowColor: '#00D9FF',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.4,
        shadowRadius: 12,
        elevation: 8,
    },
    fabTouchable: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingHorizontal: 20,
        gap: 8,
    },
    fabText: {
        color: '#000',
        fontSize: 16,
        fontWeight: '700',
    },
    // Modal
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.85)',
        justifyContent: 'flex-end',
    },
    modalContent: {
        backgroundColor: '#111',
        borderTopLeftRadius: 24,
        borderTopRightRadius: 24,
        padding: 24,
        paddingBottom: 40,
        maxHeight: '70%',
    },
    modalHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 8,
    },
    modalTitle: {
        color: '#fff',
        fontSize: 22,
        fontWeight: '800',
    },
    modalSubtitle: {
        color: '#666',
        fontSize: 14,
        marginBottom: 24,
    },
    ticketList: {
        maxHeight: 300,
    },
    ticketOption: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#0a0a0a',
        padding: 16,
        borderRadius: 14,
        marginBottom: 10,
        borderWidth: 1,
        borderColor: '#222',
    },
    ticketOptionInfo: {
        flex: 1,
    },
    ticketOptionTitle: {
        color: '#fff',
        fontSize: 16,
        fontWeight: '600',
        marginBottom: 4,
    },
    ticketOptionDate: {
        color: '#666',
        fontSize: 13,
    },
    noTickets: {
        alignItems: 'center',
        paddingVertical: 40,
    },
    noTicketsText: {
        color: '#666',
        fontSize: 16,
        marginTop: 16,
    },
    commissionNote: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        marginTop: 20,
        padding: 14,
        backgroundColor: 'rgba(0,217,255,0.1)',
        borderRadius: 12,
    },
    commissionNoteText: {
        color: '#888',
        fontSize: 13,
        flex: 1,
    },
});

export default SwapScreen;
