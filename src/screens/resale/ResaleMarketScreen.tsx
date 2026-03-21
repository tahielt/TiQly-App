/**
 * ResaleMarketScreen - Browse and purchase resale tickets
 * Follows TiQly Sci-Fi/Dopamine design system
 * 
 * Features:
 * - List of available resales for an event
 * - Purchase flow with confirmation
 * - Animated UI with glow effects
 */

import React, { useState, useEffect, useCallback } from 'react';
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
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useNavigation, useRoute, useFocusEffect } from '@react-navigation/native';
import { useSelector } from 'react-redux';

import ResaleListingCard from '../../components/ResaleListingCard';
import { getEventResales, purchaseResale } from '../../services/resaleService';
import { ResaleListing } from '../../types/resale';

interface RouteParams {
    eventId: string;
    eventTitle?: string;
}

const ResaleMarketScreen: React.FC = () => {
    const navigation = useNavigation();
    const route = useRoute();
    const params = route.params as RouteParams;

    const [listings, setListings] = useState<ResaleListing[]>([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [selectedListing, setSelectedListing] = useState<ResaleListing | null>(null);
    const [purchasing, setPurchasing] = useState(false);

    const user = useSelector((state: any) => state.auth?.user);

    const loadListings = async () => {
        try {
            const data = await getEventResales(params.eventId);
            setListings(data);
        } catch (error) {
            console.error('Error loading resales:', error);
        } finally {
            setLoading(false);
        }
    };

    useFocusEffect(
        useCallback(() => {
            loadListings();
        }, [params.eventId])
    );

    const handleRefresh = async () => {
        setRefreshing(true);
        Haptics.selectionAsync();
        await loadListings();
        setRefreshing(false);
    };

    const handleListingPress = (listing: ResaleListing) => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
        setSelectedListing(listing);
    };

    const handlePurchase = async () => {
        if (!selectedListing || !user?.id) {
            Alert.alert('Error', 'Debés iniciar sesión para comprar');
            return;
        }

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
                    [{ text: 'Ver mis tickets', onPress: () => navigation.navigate('MyTickets' as never) }]
                );
                loadListings();
            } else {
                Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
                Alert.alert('Error', result.error || 'No se pudo completar la compra');
            }
        } catch (error: any) {
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
            Alert.alert('Error', error.message || 'Error al procesar la compra');
        } finally {
            setPurchasing(false);
        }
    };

    const formatCurrency = (amount: number) => {
        return `$${amount.toLocaleString('es-AR')}`;
    };

    const renderEmptyState = () => (
        <View style={styles.emptyState}>
            <Ionicons name="pricetags-outline" size={64} color="#333" />
            <Text style={styles.emptyTitle}>No hay tickets en reventa</Text>
            <Text style={styles.emptySubtitle}>
                Cuando alguien publique un ticket, aparecerá acá
            </Text>
        </View>
    );

    const renderListingItem = ({ item }: { item: ResaleListing }) => (
        <ResaleListingCard
            listing={item}
            onPress={handleListingPress}
            variant="buyer"
            showFeeBreakdown={false}
        />
    );

    return (
        <View style={styles.container}>
            <StatusBar barStyle="light-content" />
            <LinearGradient
                colors={['#0a0a0a', '#1a1a2e', '#0a0a0a']}
                style={StyleSheet.absoluteFill}
            />

            <SafeAreaView style={styles.safeArea}>
                {/* Header */}
                <View style={styles.header}>
                    <TouchableOpacity
                        onPress={() => navigation.goBack()}
                        style={styles.backButton}
                    >
                        <Ionicons name="arrow-back" size={24} color="#fff" />
                    </TouchableOpacity>
                    <View style={styles.headerText}>
                        <Text style={styles.headerTitle}>Reventa</Text>
                        <Text style={styles.headerSubtitle} numberOfLines={1}>
                            {params.eventTitle || 'Marketplace'}
                        </Text>
                    </View>
                    <View style={styles.listingCount}>
                        <Text style={styles.countText}>{listings.length}</Text>
                        <Text style={styles.countLabel}>tickets</Text>
                    </View>
                </View>

                {/* Content */}
                {loading ? (
                    <View style={styles.loadingContainer}>
                        <ActivityIndicator size="large" color="#00FFFF" />
                    </View>
                ) : (
                    <FlatList
                        data={listings}
                        renderItem={renderListingItem}
                        keyExtractor={(item) => item.id}
                        contentContainerStyle={styles.listContent}
                        showsVerticalScrollIndicator={false}
                        ListEmptyComponent={renderEmptyState}
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
                                        {selectedListing.eventTitle || 'Evento'}
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
                                            <Text style={styles.modalFeeLabel}>Precio ticket</Text>
                                            <Text style={styles.modalFeeValue}>
                                                {formatCurrency(selectedListing.askingPrice)}
                                            </Text>
                                        </View>
                                        <View style={styles.modalFeeRow}>
                                            <Text style={styles.modalFeeLabel}>Fee TiQly</Text>
                                            <Text style={styles.modalFeeValue}>
+{formatCurrency(selectedListing.platformFee)}
                                            </Text>
                                        </View>
                                        <View style={styles.modalDivider} />
                                        <View style={styles.modalFeeRow}>
                                            <Text style={styles.modalTotalLabel}>TOTAL A PAGAR</Text>
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
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 16,
        paddingVertical: 12,
    },
    backButton: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: 'rgba(255,255,255,0.1)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    headerText: {
        flex: 1,
        marginLeft: 12,
    },
    headerTitle: {
        color: '#fff',
        fontSize: 20,
        fontWeight: 'bold',
    },
    headerSubtitle: {
        color: '#888',
        fontSize: 12,
    },
    listingCount: {
        alignItems: 'center',
        backgroundColor: 'rgba(0,255,255,0.1)',
        paddingHorizontal: 16,
        paddingVertical: 8,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: 'rgba(0,255,255,0.3)',
    },
    countText: {
        color: '#00FFFF',
        fontSize: 20,
        fontWeight: 'bold',
    },
    countLabel: {
        color: '#00FFFF',
        fontSize: 10,
        opacity: 0.7,
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    listContent: {
        padding: 16,
        flexGrow: 1,
    },
    emptyState: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: 40,
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

export default ResaleMarketScreen;


