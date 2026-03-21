/**
 * SwapScreen - Resale Marketplace Hub
 * Marketplace de reventa con datos reales de Supabase.
 */

import React, { useCallback, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Modal,
  RefreshControl,
  SafeAreaView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { useSelector } from 'react-redux';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withSequence,
  withTiming,
} from 'react-native-reanimated';

import ResaleListingCard from '../../components/ResaleListingCard';
import {
  getMarketListings,
  getUserListings,
  purchaseResale,
} from '../../services/resaleService';
import { getUserTickets } from '../../services/ticketService';
import { ResaleListing } from '../../types/resale';

type TabType = 'market' | 'my-listings' | 'my-tickets';

const SwapScreen: React.FC = () => {
  const navigation = useNavigation<any>();
  const user = useSelector((state: any) => state.auth?.user);

  const [activeTab, setActiveTab] = useState<TabType>('market');
  const [marketListings, setMarketListings] = useState<ResaleListing[]>([]);
  const [myListings, setMyListings] = useState<ResaleListing[]>([]);
  const [myTickets, setMyTickets] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedListing, setSelectedListing] = useState<ResaleListing | null>(null);
  const [purchasing, setPurchasing] = useState(false);

  const glowValue = useSharedValue(0.25);

  React.useEffect(() => {
    glowValue.value = withRepeat(
      withSequence(
        withTiming(0.55, { duration: 1800 }),
        withTiming(0.25, { duration: 1800 }),
      ),
      -1,
      true,
    );
  }, []);

  const glowStyle = useAnimatedStyle(() => ({
    shadowOpacity: glowValue.value,
  }));

  const loadData = async () => {
    if (!user?.id) {
      setMarketListings([]);
      setMyListings([]);
      setMyTickets([]);
      setLoading(false);
      return;
    }

    try {
      const [allListings, sellerListings, tickets] = await Promise.all([
        getMarketListings(),
        getUserListings(user.id),
        getUserTickets(user.id),
      ]);

      setMarketListings(allListings.filter((listing) => listing.sellerId !== user.id));
      setMyListings(sellerListings);
      setMyTickets(tickets.filter((ticket) => ticket.status === 'active'));
    } catch (error) {
      console.error('Error loading resale hub:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      loadData();
    }, [user?.id]),
  );

  const handleRefresh = async () => {
    setRefreshing(true);
    Haptics.selectionAsync();
    await loadData();
  };

  const handleTabChange = (tab: TabType) => {
    Haptics.selectionAsync();
    setActiveTab(tab);
  };

  const handleListingPress = (listing: ResaleListing) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    if (listing.sellerId === user?.id) {
      navigation.navigate('MyListings');
      return;
    }

    setSelectedListing(listing);
  };

  const handleTicketPress = (ticket: any) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    navigation.navigate('CreateResale', {
      ticketId: ticket.id,
      ticketInfo: {
        eventTitle: ticket.eventTitle,
        eventDate: ticket.eventDate?.toISOString?.() || '',
        ticketTypeName: ticket.ticketTypeName || 'General',
        originalPrice: ticket.basePrice || ticket.price,
      },
    });
  };

  const handlePurchase = async () => {
    if (!selectedListing || !user?.id) return;

    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    setPurchasing(true);

    try {
      const result = await purchaseResale({ listingId: selectedListing.id }, user.id);
      if (!result.success) {
        throw new Error(result.error || 'No se pudo completar la compra');
      }

      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      setSelectedListing(null);
      Alert.alert(
        'Compra exitosa',
        'El ticket ya está en tu billetera.',
        [{ text: 'Ver mis tickets', onPress: () => setActiveTab('my-tickets') }],
      );
      loadData();
    } catch (error: any) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      Alert.alert('Error', error.message || 'No se pudo completar la compra');
    } finally {
      setPurchasing(false);
    }
  };

  const formatCurrency = (amount: number) => `$${amount.toLocaleString('es-AR')}`;

  const renderListingItem = ({ item }: { item: ResaleListing }) => (
    <ResaleListingCard
      listing={item}
      onPress={handleListingPress}
      variant={item.sellerId === user?.id ? 'seller' : 'buyer'}
      showFeeBreakdown={activeTab !== 'market'}
    />
  );

  const renderTicketItem = ({ item }: { item: any }) => (
    <TouchableOpacity style={styles.ticketCard} onPress={() => handleTicketPress(item)} activeOpacity={0.85}>
      <BlurView intensity={18} tint="dark" style={styles.ticketCardContent}>
        <View style={styles.ticketCopy}>
          <Text style={styles.ticketTitle} numberOfLines={1}>{item.eventTitle}</Text>
          <Text style={styles.ticketDate}>
            {item.eventDate ? new Date(item.eventDate).toLocaleDateString('es-AR') : 'Fecha a confirmar'}
          </Text>
          <View style={styles.ticketBadge}>
            <Text style={styles.ticketBadgeText}>{item.ticketTypeName || 'General'}</Text>
          </View>
        </View>
        <View style={styles.ticketAction}>
          <Text style={styles.ticketPrice}>{formatCurrency(item.basePrice || item.price || 0)}</Text>
          <View style={styles.sellButton}>
            <Text style={styles.sellButtonText}>REVENDER</Text>
            <Ionicons name="arrow-forward" size={14} color="#000" />
          </View>
        </View>
      </BlurView>
    </TouchableOpacity>
  );

  const listData = activeTab === 'market'
    ? marketListings
    : activeTab === 'my-listings'
      ? myListings
      : myTickets;

  const listRenderer = activeTab === 'my-tickets' ? renderTicketItem : renderListingItem;

  const emptyState = (
    <View style={styles.emptyState}>
      <Ionicons
        name={activeTab === 'my-tickets' ? 'ticket-outline' : 'pricetags-outline'}
        size={64}
        color="#333"
      />
      <Text style={styles.emptyTitle}>
        {activeTab === 'market'
          ? 'No hay tickets listados'
          : activeTab === 'my-listings'
            ? 'Todavía no publicaste tickets'
            : 'No tenés tickets listos para revender'}
      </Text>
      <Text style={styles.emptySubtitle}>
        {activeTab === 'market'
          ? 'Cuando aparezcan publicaciones, las vas a ver acá.'
          : activeTab === 'my-listings'
            ? 'Tus publicaciones activas y vendidas se agrupan en este panel.'
            : 'Comprá entradas o revisá tu billetera para publicar una reventa.'}
      </Text>
    </View>
  );

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" />
      <LinearGradient colors={['#050505', '#0C1220', '#050505']} style={StyleSheet.absoluteFill} />

      <SafeAreaView style={styles.safeArea}>
        <View style={styles.header}>
          <Animated.View style={[styles.headerGlow, glowStyle]} />
          <Text style={styles.headerEyebrow}>RESALE COMMAND</Text>
          <Text style={styles.headerTitle}>Swap</Text>
          <Text style={styles.headerSubtitle}>Publicá, seguí el mercado y recomprá desde un solo lugar.</Text>
        </View>

        <View style={styles.tabsRow}>
          {[
            { id: 'market', label: 'Mercado' },
            { id: 'my-listings', label: 'Mis publicaciones' },
            { id: 'my-tickets', label: 'Mis tickets' },
          ].map((tab) => (
            <TouchableOpacity
              key={tab.id}
              style={[styles.tabButton, activeTab === tab.id && styles.tabButtonActive]}
              onPress={() => handleTabChange(tab.id as TabType)}
            >
              <Text style={[styles.tabText, activeTab === tab.id && styles.tabTextActive]}>{tab.label}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#00FFFF" />
          </View>
        ) : (
          <FlatList
            data={listData}
            renderItem={listRenderer as any}
            keyExtractor={(item: any) => item.id}
            contentContainerStyle={styles.listContent}
            showsVerticalScrollIndicator={false}
            ListEmptyComponent={emptyState}
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

      <Modal visible={!!selectedListing} animationType="slide" transparent onRequestClose={() => setSelectedListing(null)}>
        <View style={styles.modalOverlay}>
          <BlurView intensity={40} tint="dark" style={styles.modalCard}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Confirmar compra</Text>
              <TouchableOpacity onPress={() => setSelectedListing(null)}>
                <Ionicons name="close" size={24} color="#fff" />
              </TouchableOpacity>
            </View>

            {selectedListing && (
              <>
                <Text style={styles.modalEvent}>{selectedListing.eventTitle || 'Evento'}</Text>
                {!!selectedListing.ticketTypeName && (
                  <View style={styles.modalBadge}>
                    <Text style={styles.modalBadgeText}>{selectedListing.ticketTypeName}</Text>
                  </View>
                )}

                <View style={styles.modalBreakdown}>
                  <View style={styles.modalRow}>
                    <Text style={styles.modalLabel}>Precio ticket</Text>
                    <Text style={styles.modalValue}>{formatCurrency(selectedListing.askingPrice)}</Text>
                  </View>
                  <View style={styles.modalRow}>
                    <Text style={styles.modalLabel}>Fee TiQly</Text>
                    <Text style={styles.modalValue}>+{formatCurrency(selectedListing.platformFee)}</Text>
                  </View>
                  <View style={styles.modalDivider} />
                  <View style={styles.modalRow}>
                    <Text style={styles.modalTotalLabel}>TOTAL</Text>
                    <Text style={styles.modalTotalValue}>{formatCurrency(selectedListing.buyerPays)}</Text>
                  </View>
                </View>

                <View style={styles.modalFooter}>
                  <TouchableOpacity style={styles.cancelButton} onPress={() => setSelectedListing(null)}>
                    <Text style={styles.cancelButtonText}>Cancelar</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.confirmButton} onPress={handlePurchase} disabled={purchasing}>
                    {purchasing ? (
                      <ActivityIndicator color="#000" />
                    ) : (
                      <>
                        <Ionicons name="card" size={18} color="#000" />
                        <Text style={styles.confirmButtonText}>Comprar</Text>
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
    paddingTop: 18,
    paddingBottom: 12,
  },
  headerGlow: {
    position: 'absolute',
    top: 16,
    left: 20,
    right: 20,
    height: 1,
    backgroundColor: '#00FFFF',
    shadowColor: '#00FFFF',
    shadowRadius: 14,
  },
  headerEyebrow: {
    color: '#00FFFF',
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 2,
  },
  headerTitle: {
    color: '#fff',
    fontSize: 28,
    fontWeight: '900',
    marginTop: 8,
  },
  headerSubtitle: {
    color: '#6F7A8A',
    marginTop: 6,
    lineHeight: 20,
  },
  tabsRow: {
    flexDirection: 'row',
    gap: 10,
    paddingHorizontal: 20,
    paddingBottom: 8,
  },
  tabButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
    backgroundColor: 'rgba(255,255,255,0.04)',
    alignItems: 'center',
  },
  tabButtonActive: {
    backgroundColor: 'rgba(0,255,255,0.14)',
    borderColor: 'rgba(0,255,255,0.32)',
  },
  tabText: {
    color: '#8C95A3',
    fontSize: 12,
    fontWeight: '700',
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
    padding: 20,
    paddingBottom: 40,
    flexGrow: 1,
  },
  ticketCard: {
    marginBottom: 16,
    borderRadius: 18,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
  },
  ticketCardContent: {
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
  },
  ticketCopy: {
    flex: 1,
  },
  ticketTitle: {
    color: '#fff',
    fontSize: 17,
    fontWeight: '800',
  },
  ticketDate: {
    color: '#888',
    marginTop: 4,
  },
  ticketBadge: {
    alignSelf: 'flex-start',
    marginTop: 10,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
    backgroundColor: 'rgba(0,255,255,0.12)',
    borderWidth: 1,
    borderColor: 'rgba(0,255,255,0.3)',
  },
  ticketBadgeText: {
    color: '#00FFFF',
    fontSize: 11,
    fontWeight: '700',
  },
  ticketAction: {
    alignItems: 'flex-end',
    gap: 10,
  },
  ticketPrice: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '800',
  },
  sellButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 999,
    backgroundColor: '#00FFFF',
  },
  sellButtonText: {
    color: '#000',
    fontSize: 11,
    fontWeight: '900',
    letterSpacing: 1,
  },
  emptyState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 30,
    paddingTop: 40,
  },
  emptyTitle: {
    color: '#888',
    fontSize: 18,
    fontWeight: '800',
    marginTop: 16,
    textAlign: 'center',
  },
  emptySubtitle: {
    color: '#555',
    fontSize: 14,
    lineHeight: 20,
    textAlign: 'center',
    marginTop: 8,
  },
  modalOverlay: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0,0,0,0.7)',
  },
  modalCard: {
    borderTopLeftRadius: 26,
    borderTopRightRadius: 26,
    overflow: 'hidden',
    padding: 20,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 18,
  },
  modalTitle: {
    color: '#fff',
    fontSize: 20,
    fontWeight: '800',
  },
  modalEvent: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '800',
  },
  modalBadge: {
    alignSelf: 'flex-start',
    marginTop: 10,
    marginBottom: 16,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
    backgroundColor: 'rgba(0,255,255,0.12)',
  },
  modalBadgeText: {
    color: '#00FFFF',
    fontWeight: '700',
  },
  modalBreakdown: {
    backgroundColor: 'rgba(255,255,255,0.04)',
    borderRadius: 16,
    padding: 16,
  },
  modalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
  },
  modalLabel: {
    color: '#96A2B4',
  },
  modalValue: {
    color: '#fff',
    fontWeight: '700',
  },
  modalDivider: {
    height: 1,
    backgroundColor: 'rgba(255,255,255,0.08)',
    marginVertical: 8,
  },
  modalTotalLabel: {
    color: '#fff',
    fontWeight: '800',
  },
  modalTotalValue: {
    color: '#00FFFF',
    fontSize: 18,
    fontWeight: '900',
  },
  modalFooter: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 18,
  },
  cancelButton: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    borderRadius: 14,
    backgroundColor: 'rgba(255,255,255,0.08)',
  },
  cancelButtonText: {
    color: '#fff',
    fontWeight: '700',
  },
  confirmButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 14,
    borderRadius: 14,
    backgroundColor: '#00FFFF',
  },
  confirmButtonText: {
    color: '#000',
    fontWeight: '900',
    textTransform: 'uppercase',
  },
});

export default SwapScreen;
