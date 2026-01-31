/**
 * MyListingsScreen - Manage user's resale listings
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
    Alert,
    ActivityIndicator,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { useSelector } from 'react-redux';

import ResaleListingCard from '../../components/ResaleListingCard';
import { getUserListings, cancelResaleListing } from '../../services/resaleService';
import { ResaleListing } from '../../types/resale';

const MyListingsScreen: React.FC = () => {
    const navigation = useNavigation();
    const [listings, setListings] = useState<ResaleListing[]>([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);

    const user = useSelector((state: any) => state.auth?.user);

    const loadListings = async () => {
        if (!user?.id) return;
        try {
            const data = await getUserListings(user.id);
            setListings(data);
        } catch (error) {
            console.error('Error loading listings:', error);
        } finally {
            setLoading(false);
        }
    };

    useFocusEffect(
        useCallback(() => {
            loadListings();
        }, [user?.id])
    );

    const handleRefresh = async () => {
        setRefreshing(true);
        Haptics.selectionAsync();
        await loadListings();
        setRefreshing(false);
    };

    const handleListingPress = (listing: ResaleListing) => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

        if (listing.status === 'listed') {
            Alert.alert(
                'Gestionar publicación',
                `Precio: $${listing.askingPrice.toLocaleString('es-AR')}`,
                [
                    { text: 'Cerrar', style: 'cancel' },
                    {
                        text: 'Cancelar venta',
                        style: 'destructive',
                        onPress: () => handleCancelListing(listing)
                    }
                ]
            );
        }
    };

    const handleCancelListing = async (listing: ResaleListing) => {
        if (!user?.id) return;

        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

        try {
            await cancelResaleListing(listing.id, user.id, 'Cancelled by user');
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
            loadListings();
        } catch (error: any) {
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
            Alert.alert('Error', error.message || 'No se pudo cancelar');
        }
    };

    const getStatusStats = () => {
        const active = listings.filter(l => l.status === 'listed').length;
        const sold = listings.filter(l => l.status === 'sold').length;
        const totalEarnings = listings
            .filter(l => l.status === 'sold')
            .reduce((sum, l) => sum + l.sellerReceives, 0);

        return { active, sold, totalEarnings };
    };

    const stats = getStatusStats();

    const renderEmptyState = () => (
        <View style={styles.emptyState}>
            <Ionicons name="pricetag-outline" size={64} color="#333" />
            <Text style={styles.emptyTitle}>No tenés publicaciones</Text>
            <Text style={styles.emptySubtitle}>
                Publicá tickets que no vayas a usar desde "Mis Tickets"
            </Text>
        </View>
    );

    const renderListingItem = ({ item }: { item: ResaleListing }) => (
        <ResaleListingCard
            listing={item}
            onPress={handleListingPress}
            variant="seller"
            showFeeBreakdown={item.status === 'listed'}
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
                    <Text style={styles.headerTitle}>Mis Publicaciones</Text>
                    <View style={{ width: 40 }} />
                </View>

                {/* Stats */}
                <View style={styles.statsRow}>
                    <View style={styles.statCard}>
                        <Text style={styles.statValue}>{stats.active}</Text>
                        <Text style={styles.statLabel}>Activas</Text>
                    </View>
                    <View style={styles.statCard}>
                        <Text style={[styles.statValue, styles.soldValue]}>{stats.sold}</Text>
                        <Text style={styles.statLabel}>Vendidas</Text>
                    </View>
                    <View style={[styles.statCard, styles.earningsCard]}>
                        <Text style={styles.earningsValue}>
                            ${stats.totalEarnings.toLocaleString('es-AR')}
                        </Text>
                        <Text style={styles.statLabel}>Ganaste</Text>
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
        justifyContent: 'space-between',
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
    headerTitle: {
        color: '#fff',
        fontSize: 18,
        fontWeight: 'bold',
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
        fontSize: 24,
        fontWeight: 'bold',
    },
    soldValue: {
        color: '#00FF88',
    },
    statLabel: {
        color: '#666',
        fontSize: 12,
        marginTop: 4,
    },
    earningsCard: {
        flex: 1.5,
        borderWidth: 1,
        borderColor: 'rgba(0,255,255,0.2)',
    },
    earningsValue: {
        color: '#00FFFF',
        fontSize: 18,
        fontWeight: 'bold',
        textShadowColor: 'rgba(0,255,255,0.5)',
        textShadowOffset: { width: 0, height: 0 },
        textShadowRadius: 5,
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
});

export default MyListingsScreen;
