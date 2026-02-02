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
    TextInput,
    Alert,
    NativeSyntheticEvent,
    NativeScrollEvent,
    KeyboardAvoidingView,
    Platform,
} from 'react-native';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import {
    getUserTickets,
    getActiveListings,
    listTicketForSale,
    purchaseListedTicket,
    TicketListing,
    RESALE_FEE_PERCENTAGE,
    MAX_MARKUP_PERCENTAGE
} from '../../services/ticketService';
import { supabase } from '../../lib/supabase';

const SwapScreen = () => {
    const navigation = useNavigation<any>();
    const [listings, setListings] = useState<TicketListing[]>([]);
    const [refreshing, setRefreshing] = useState(false);
    const [loading, setLoading] = useState(true);

    // Publish modal
    const [publishModalVisible, setPublishModalVisible] = useState(false);
    const [userTickets, setUserTickets] = useState<any[]>([]);
    const [selectedTicket, setSelectedTicket] = useState<any>(null);
    const [askingPrice, setAskingPrice] = useState('');
    const [priceModalVisible, setPriceModalVisible] = useState(false);

    // Purchase modal
    const [purchaseModalVisible, setPurchaseModalVisible] = useState(false);
    const [selectedListing, setSelectedListing] = useState<TicketListing | null>(null);

    const [selectedFilter, setSelectedFilter] = useState('Todos');

    // FAB animation
    const fabWidth = useRef(new Animated.Value(140)).current;
    const fabTextOpacity = useRef(new Animated.Value(1)).current;
    const lastScrollY = useRef(0);

    useFocusEffect(
        useCallback(() => {
            loadListings();
            loadUserTickets();
        }, [])
    );

    const loadListings = async () => {
        try {
            setLoading(true);
            const data = await getActiveListings();
            setListings(data);
        } catch (error) {
            console.error('Error loading listings:', error);
        } finally {
            setLoading(false);
        }
    };

    const loadUserTickets = async () => {
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (user) {
                // Get user tickets
                const data = await getUserTickets(user.id);

                // Also get ticket IDs that are already listed
                const { data: activeListings } = await supabase
                    .from('ticket_listings')
                    .select('ticket_id')
                    .eq('seller_id', user.id)
                    .eq('status', 'active');

                const listedTicketIds = new Set((activeListings || []).map(l => l.ticket_id));

                // Filter: only active tickets that are NOT already listed
                setUserTickets(data.filter(t =>
                    t.status === 'active' && !listedTicketIds.has(t.id)
                ));
            }
        } catch (error) {
            console.error('Error loading user tickets:', error);
        }
    };

    const onRefresh = async () => {
        setRefreshing(true);
        await loadListings();
        await loadUserTickets();
        setRefreshing(false);
    };

    // Handle ticket selection for publishing
    const handleSelectTicketToSell = (ticket: any) => {
        setSelectedTicket(ticket);
        setPublishModalVisible(false);
        // Calculate suggested price and max price
        const maxPrice = Math.floor(ticket.price * MAX_MARKUP_PERCENTAGE);
        setAskingPrice(ticket.price.toString());
        setPriceModalVisible(true);
    };

    // Handle publish confirmation
    const handleConfirmPublish = async () => {
        if (!selectedTicket || !askingPrice) return;

        const price = parseFloat(askingPrice);
        const maxAllowed = selectedTicket.price * MAX_MARKUP_PERCENTAGE;

        if (price > maxAllowed) {
            Alert.alert('Precio muy alto', `El precio máximo permitido es $${maxAllowed.toLocaleString()}`);
            return;
        }

        if (price < selectedTicket.price * 0.5) {
            Alert.alert('Precio muy bajo', 'El precio mínimo es 50% del precio original');
            return;
        }

        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) {
                Alert.alert('Error', 'Debés estar logueado');
                return;
            }

            await listTicketForSale(selectedTicket.id, price, user.id);

            setPriceModalVisible(false);
            setSelectedTicket(null);
            setAskingPrice('');

            Alert.alert('✅ Publicado', 'Tu ticket ya está en venta en el marketplace');
            await loadListings();
            await loadUserTickets();
        } catch (error: any) {
            Alert.alert('Error', error.message || 'No se pudo publicar el ticket');
        }
    };

    // Handle purchase
    const handlePurchase = async () => {
        if (!selectedListing) return;

        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) {
                Alert.alert('Error', 'Debés estar logueado para comprar');
                return;
            }

            // Get user profile
            const { data: profile } = await supabase
                .from('profiles')
                .select('name, email')
                .eq('id', user.id)
                .single();

            await purchaseListedTicket(
                selectedListing.id,
                user.id,
                profile?.name || 'Usuario',
                profile?.email || user.email || ''
            );

            setPurchaseModalVisible(false);
            setSelectedListing(null);

            Alert.alert('🎉 ¡Compra exitosa!', 'El ticket ya está en tu cuenta. Revisá "Mis Tickets".');
            await loadListings();
        } catch (error: any) {
            Alert.alert('Error', error.message || 'No se pudo completar la compra');
        }
    };

    // Animate FAB based on scroll direction
    const handleScroll = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
        const currentY = event.nativeEvent.contentOffset.y;
        const isScrollingDown = currentY > lastScrollY.current && currentY > 50;

        if (isScrollingDown) {
            Animated.parallel([
                Animated.spring(fabWidth, { toValue: 56, tension: 100, friction: 10, useNativeDriver: false }),
                Animated.timing(fabTextOpacity, { toValue: 0, duration: 150, useNativeDriver: false }),
            ]).start();
        } else {
            Animated.parallel([
                Animated.spring(fabWidth, { toValue: 140, tension: 80, friction: 10, useNativeDriver: false }),
                Animated.timing(fabTextOpacity, { toValue: 1, duration: 200, useNativeDriver: false }),
            ]).start();
        }
        lastScrollY.current = currentY;
    };

    const formatDate = (date: Date) => {
        return date.toLocaleDateString('es-AR', { day: '2-digit', month: '2-digit' });
    };

    const renderListingCard = ({ item }: { item: TicketListing }) => {
        const isOwnListing = item.sellerName === 'Vos';

        return (
            <TouchableOpacity
                style={styles.listingCard}
                activeOpacity={0.9}
                onPress={() => {
                    if (!isOwnListing) {
                        setSelectedListing(item);
                        setPurchaseModalVisible(true);
                    }
                }}
            >
                <Image source={{ uri: item.eventImage }} style={styles.listingImage} />

                <View style={styles.listingContent}>
                    <View style={styles.listingHeader}>
                        <Ionicons name="ticket-outline" size={14} color="#888" />
                        <Text style={styles.listingDate}>{formatDate(item.eventDate)}</Text>
                    </View>

                    <Text style={styles.listingTitle} numberOfLines={1}>{item.eventTitle}</Text>

                    <View style={styles.sellerRow}>
                        <Ionicons name="person-circle-outline" size={14} color="#666" />
                        <Text style={styles.listingSeller}>{item.sellerName}</Text>
                    </View>
                </View>

                <View style={styles.listingPrice}>
                    {item.askingPrice > item.originalPrice && (
                        <Text style={styles.originalPrice}>${item.originalPrice.toLocaleString()}</Text>
                    )}
                    <Text style={styles.priceValue}>${item.askingPrice.toLocaleString()}</Text>
                </View>
            </TouchableOpacity>
        );
    };

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
                ListEmptyComponent={!loading ? renderEmptyState : null}
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
                        Vender
                    </Animated.Text>
                </TouchableOpacity>
            </Animated.View>

            {/* Select Ticket Modal */}
            <Modal
                visible={publishModalVisible}
                transparent
                animationType="slide"
                onRequestClose={() => setPublishModalVisible(false)}
            >
                <View style={styles.modalOverlay}>
                    <View style={styles.modalContent}>
                        <View style={styles.modalHeader}>
                            <Text style={styles.modalTitle}>Vender Ticket</Text>
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
                                <Text style={styles.noTicketsText}>No tenés tickets disponibles</Text>
                                <Text style={styles.noTicketsSubtext}>Comprá tickets para poder revenderlos</Text>
                            </View>
                        ) : (
                            <ScrollView style={styles.ticketList}>
                                {userTickets.map(ticket => (
                                    <TouchableOpacity
                                        key={ticket.id}
                                        style={styles.ticketOption}
                                        onPress={() => handleSelectTicketToSell(ticket)}
                                    >
                                        <View style={styles.ticketOptionInfo}>
                                            <Text style={styles.ticketOptionTitle}>{ticket.eventTitle}</Text>
                                            <Text style={styles.ticketOptionDate}>
                                                {formatDate(new Date(ticket.eventDate))} • ${ticket.price.toLocaleString()}
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
                                TiQly cobra {RESALE_FEE_PERCENTAGE * 100}% de comisión por cada venta
                            </Text>
                        </View>
                    </View>
                </View>
            </Modal>

            {/* Set Price Modal */}
            <Modal
                visible={priceModalVisible}
                transparent
                animationType="slide"
                onRequestClose={() => setPriceModalVisible(false)}
            >
                <KeyboardAvoidingView
                    behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                    style={styles.modalOverlay}
                >
                    <TouchableOpacity
                        style={styles.modalBackdrop}
                        activeOpacity={1}
                        onPress={() => setPriceModalVisible(false)}
                    />
                    <View style={styles.priceModalContent}>
                        <View style={styles.modalHeader}>
                            <Text style={styles.modalTitle}>Precio de Venta</Text>
                            <TouchableOpacity onPress={() => setPriceModalVisible(false)}>
                                <Ionicons name="close" size={24} color="#fff" />
                            </TouchableOpacity>
                        </View>

                        {selectedTicket && (
                            <>
                                <Text style={styles.priceTicketName}>{selectedTicket.eventTitle}</Text>
                                <Text style={styles.priceOriginal}>
                                    Precio original: ${selectedTicket.price.toLocaleString()}
                                </Text>

                                <View style={styles.priceInputContainer}>
                                    <Text style={styles.priceSymbol}>$</Text>
                                    <TextInput
                                        style={styles.priceInput}
                                        value={askingPrice}
                                        onChangeText={setAskingPrice}
                                        keyboardType="numeric"
                                        placeholder="0"
                                        placeholderTextColor="#444"
                                    />
                                </View>

                                <Text style={styles.priceMax}>
                                    Máximo permitido: ${Math.floor(selectedTicket.price * MAX_MARKUP_PERCENTAGE).toLocaleString()}
                                </Text>

                                <View style={styles.earningsPreview}>
                                    <Text style={styles.earningsLabel}>Vas a recibir:</Text>
                                    <Text style={styles.earningsValue}>
                                        ${Math.floor(parseFloat(askingPrice || '0') * (1 - RESALE_FEE_PERCENTAGE)).toLocaleString()}
                                    </Text>
                                </View>

                                <TouchableOpacity
                                    style={styles.publishButton}
                                    onPress={handleConfirmPublish}
                                >
                                    <Ionicons name="flash" size={20} color="#000" />
                                    <Text style={styles.publishButtonText}>Publicar en Swap</Text>
                                </TouchableOpacity>
                            </>
                        )}
                    </View>
                </KeyboardAvoidingView>
            </Modal>

            {/* Purchase Modal */}
            <Modal
                visible={purchaseModalVisible}
                transparent
                animationType="slide"
                onRequestClose={() => setPurchaseModalVisible(false)}
            >
                <View style={styles.modalOverlay}>
                    <View style={styles.modalContent}>
                        <View style={styles.modalHeader}>
                            <Text style={styles.modalTitle}>Comprar Ticket</Text>
                            <TouchableOpacity onPress={() => setPurchaseModalVisible(false)}>
                                <Ionicons name="close" size={24} color="#fff" />
                            </TouchableOpacity>
                        </View>

                        {selectedListing && (
                            <>
                                <Image
                                    source={{ uri: selectedListing.eventImage }}
                                    style={styles.purchaseImage}
                                />

                                <Text style={styles.purchaseEventTitle}>{selectedListing.eventTitle}</Text>
                                <Text style={styles.purchaseDate}>
                                    {formatDate(selectedListing.eventDate)}
                                </Text>

                                <View style={styles.purchasePriceBox}>
                                    <Text style={styles.purchasePriceLabel}>Precio</Text>
                                    <Text style={styles.purchasePrice}>
                                        ${selectedListing.askingPrice.toLocaleString()}
                                    </Text>
                                </View>

                                <View style={styles.sellerInfo}>
                                    <Ionicons name="person-circle" size={24} color="#00D9FF" />
                                    <Text style={styles.sellerInfoText}>
                                        Vendedor: {selectedListing.sellerName}
                                    </Text>
                                </View>

                                <TouchableOpacity
                                    style={styles.buyButton}
                                    onPress={handlePurchase}
                                >
                                    <Text style={styles.buyButtonText}>Comprar Ahora</Text>
                                    <Ionicons name="arrow-forward" size={20} color="#000" />
                                </TouchableOpacity>
                            </>
                        )}
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
    sellerRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
    },
    listingSeller: {
        color: '#666',
        fontSize: 12,
    },
    listingPrice: {
        alignItems: 'flex-end',
        backgroundColor: '#000',
        paddingHorizontal: 14,
        paddingVertical: 10,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: '#222',
    },
    originalPrice: {
        color: '#555',
        fontSize: 11,
        textDecorationLine: 'line-through',
        marginBottom: 2,
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
    // Modals
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
        maxHeight: '80%',
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
        color: '#fff',
        fontSize: 16,
        fontWeight: '600',
        marginTop: 16,
    },
    noTicketsSubtext: {
        color: '#666',
        fontSize: 14,
        marginTop: 8,
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
    modalBackdrop: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
    },
    priceModalContent: {
        backgroundColor: '#1a1a1a',
        borderRadius: 24,
        padding: 24,
        marginHorizontal: 20,
        borderWidth: 1,
        borderColor: '#333',
    },
    // Price Modal
    priceTicketName: {
        color: '#fff',
        fontSize: 18,
        fontWeight: '700',
        marginBottom: 8,
    },
    priceOriginal: {
        color: '#666',
        fontSize: 14,
        marginBottom: 24,
    },
    priceInputContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#0a0a0a',
        borderRadius: 16,
        paddingHorizontal: 20,
        marginBottom: 12,
        borderWidth: 1,
        borderColor: '#222',
    },
    priceSymbol: {
        color: '#00FF9D',
        fontSize: 28,
        fontWeight: '800',
    },
    priceInput: {
        flex: 1,
        color: '#fff',
        fontSize: 28,
        fontWeight: '800',
        paddingVertical: 16,
        marginLeft: 8,
    },
    priceMax: {
        color: '#666',
        fontSize: 12,
        textAlign: 'center',
        marginBottom: 20,
    },
    earningsPreview: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        backgroundColor: 'rgba(0,255,157,0.1)',
        padding: 16,
        borderRadius: 12,
        marginBottom: 20,
    },
    earningsLabel: {
        color: '#888',
        fontSize: 14,
    },
    earningsValue: {
        color: '#00FF9D',
        fontSize: 20,
        fontWeight: '800',
    },
    publishButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#00D9FF',
        paddingVertical: 16,
        borderRadius: 16,
        gap: 8,
    },
    publishButtonText: {
        color: '#000',
        fontSize: 18,
        fontWeight: '800',
    },
    // Purchase Modal
    purchaseImage: {
        width: '100%',
        height: 150,
        borderRadius: 16,
        marginBottom: 16,
    },
    purchaseEventTitle: {
        color: '#fff',
        fontSize: 22,
        fontWeight: '800',
        marginBottom: 4,
    },
    purchaseDate: {
        color: '#666',
        fontSize: 14,
        marginBottom: 20,
    },
    purchasePriceBox: {
        backgroundColor: '#0a0a0a',
        padding: 20,
        borderRadius: 16,
        alignItems: 'center',
        marginBottom: 16,
        borderWidth: 1,
        borderColor: '#222',
    },
    purchasePriceLabel: {
        color: '#666',
        fontSize: 12,
        marginBottom: 4,
    },
    purchasePrice: {
        color: '#00FF9D',
        fontSize: 32,
        fontWeight: '900',
    },
    sellerInfo: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
        marginBottom: 24,
    },
    sellerInfoText: {
        color: '#888',
        fontSize: 14,
    },
    buyButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#00FF9D',
        paddingVertical: 18,
        borderRadius: 16,
        gap: 8,
    },
    buyButtonText: {
        color: '#000',
        fontSize: 18,
        fontWeight: '800',
    },
});

export default SwapScreen;
