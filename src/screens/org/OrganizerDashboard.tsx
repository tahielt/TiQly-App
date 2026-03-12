import React, { useEffect, useState, useCallback } from 'react';
import {
    View,
    Text,
    StyleSheet,
    SafeAreaView,
    StatusBar,
    TouchableOpacity,
    RefreshControl,
    FlatList,
} from 'react-native';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';

import { HypeIndexWidget, TicketCard, RevenueCard, SlotMachineTicker } from '../../components/dashboard';
import { HypeIndexData, OrganizerRevenue, ResaleListing } from '../../types/dashboard';

const MOCK_HYPE_INDEX: HypeIndexData = {
    basePrice: 25000,
    averageAskingPrice: 52000,
    multiplier: 2.08,
    trendDirection: 'up',
};

const MOCK_REVENUE: OrganizerRevenue = {
    grossRevenue: 1850000,
    netProfit: 1665000,
    platformFee: 185000,
    resaleVolume: 47,
    lastUpdated: new Date(),
};

const MOCK_LISTINGS: ResaleListing[] = [
    {
        id: '1',
        ticketId: 't1',
        eventTitle: 'Tomorrowland BA 2026',
        eventDate: new Date('2026-03-15'),
        eventImage: 'https://images.unsplash.com/photo-1470229722913-7c0e2dbbafd3?w=400',
        ticketTier: 'VIP',
        originalPrice: 35000,
        askingPrice: 85000,
        sellerName: 'Juan P.',
        status: 'active',
        createdAt: new Date(),
        isHighDemand: true,
    },
    {
        id: '2',
        ticketId: 't2',
        eventTitle: 'Coldplay World Tour',
        eventDate: new Date('2026-04-20'),
        eventImage: 'https://images.unsplash.com/photo-1540039155733-5bb30b53aa14?w=400',
        ticketTier: 'Campo',
        originalPrice: 45000,
        askingPrice: 95000,
        sellerName: 'María G.',
        status: 'active',
        createdAt: new Date(),
        isHighDemand: true,
    },
    {
        id: '3',
        ticketId: 't3',
        eventTitle: 'Bad Bunny Most Wanted',
        eventDate: new Date('2026-02-28'),
        eventImage: 'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=400',
        ticketTier: 'General',
        originalPrice: 25000,
        askingPrice: 38000,
        sellerName: 'Carlos L.',
        status: 'active',
        createdAt: new Date(),
        isHighDemand: false,
    },
    {
        id: '4',
        ticketId: 't4',
        eventTitle: 'Ultra Music Festival',
        eventDate: new Date('2026-05-10'),
        eventImage: 'https://images.unsplash.com/photo-1459749411175-04bf5292ceea?w=400',
        ticketTier: 'Early Bird',
        originalPrice: 30000,
        askingPrice: 72000,
        sellerName: 'Ana F.',
        status: 'active',
        createdAt: new Date(),
        isHighDemand: true,
    },
    {
        id: '5',
        ticketId: 't5',
        eventTitle: 'Duki - DESDE EL FIN',
        eventDate: new Date('2026-03-22'),
        eventImage: 'https://images.unsplash.com/photo-1501386761578-eac5c94b800a?w=400',
        ticketTier: 'Platea',
        originalPrice: 28000,
        askingPrice: 42000,
        sellerName: 'Luis M.',
        status: 'active',
        createdAt: new Date(),
        isHighDemand: false,
    },
    {
        id: '6',
        ticketId: 't6',
        eventTitle: 'Lollapalooza Argentina',
        eventDate: new Date('2026-03-14'),
        eventImage: 'https://images.unsplash.com/photo-1429962714451-bb934ecdc4ec?w=400',
        ticketTier: '3-Day Pass',
        originalPrice: 55000,
        askingPrice: 120000,
        sellerName: 'Sofía R.',
        status: 'active',
        createdAt: new Date(),
        isHighDemand: true,
    },
];


const OrganizerDashboard = () => {
    const navigation = useNavigation<any>();
    const [refreshing, setRefreshing] = useState(false);
    const [hypeIndex, setHypeIndex] = useState<HypeIndexData>(MOCK_HYPE_INDEX);
    const [revenue, setRevenue] = useState<OrganizerRevenue>(MOCK_REVENUE);
    const [listings, setListings] = useState<ResaleListing[]>(MOCK_LISTINGS);
    const [activeListings, setActiveListings] = useState(MOCK_LISTINGS.length);

    const onRefresh = useCallback(async () => {
        setRefreshing(true);
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

        await new Promise(resolve => setTimeout(resolve, 1000));

        setHypeIndex(prev => ({
            ...prev,
            multiplier: prev.multiplier + (Math.random() * 0.1 - 0.05),
            averageAskingPrice: prev.averageAskingPrice + Math.floor(Math.random() * 2000 - 1000),
        }));

        setRevenue(prev => ({
            ...prev,
            grossRevenue: prev.grossRevenue + Math.floor(Math.random() * 50000),
            resaleVolume: prev.resaleVolume + Math.floor(Math.random() * 3),
        }));

        setRefreshing(false);
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }, []);

    const renderHeader = () => (
        <>
            {/* Header */}
            <View style={styles.header}>
                <TouchableOpacity
                    onPress={() => navigation.goBack()}
                    style={styles.backBtn}
                    hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                >
                    <Ionicons name="arrow-back" size={24} color="#fff" />
                </TouchableOpacity>
                <View style={styles.headerCenter}>
                    <Text style={styles.headerTitle}>COMMAND CENTER</Text>
                    <Text style={styles.headerSubtitle}>Dopamine Dashboard</Text>
                </View>
                <TouchableOpacity style={styles.profileBtn}>
                    <Ionicons name="person-circle" size={32} color="#00D9FF" />
                </TouchableOpacity>
            </View>

            <View style={styles.statsRow}>
                <HypeIndexWidget data={hypeIndex} />
                <View style={styles.activeListingsWidget}>
                    <BlurView intensity={40} tint="dark" style={styles.widgetBlur}>
                        <LinearGradient
                            colors={['rgba(0,217,255,0.1)', 'rgba(0,0,0,0.6)']}
                            style={styles.widgetGradient}
                        >
                            <Text style={styles.widgetLabel}>ACTIVE</Text>
                            <SlotMachineTicker
                                value={activeListings}
                                style={styles.activeCount}
                            />
                            <Text style={styles.widgetSubtext}>listings</Text>

                            <View style={styles.liveIndicator}>
                                <View style={styles.livePulse} />
                                <Text style={styles.liveLabel}>LIVE</Text>
                            </View>
                        </LinearGradient>
                    </BlurView>
                </View>
            </View>

            <View style={styles.revenueSection}>
                <RevenueCard revenue={revenue} feePercentage={0} />
            </View>
            <View style={styles.sectionHeader}>
                <View style={styles.sectionTitleRow}>
                    <Ionicons name="flame" size={18} color="#FF4444" />
                    <Text style={styles.sectionTitle}>High Demand Listings</Text>
                </View>
                <TouchableOpacity style={styles.viewAllBtn}>
                    <Text style={styles.viewAllText}>Ver todo</Text>
                    <Ionicons name="chevron-forward" size={14} color="#00D9FF" />
                </TouchableOpacity>
            </View>
        </>
    );

    const renderItem = ({ item }: { item: ResaleListing }) => (
        <TicketCard
            listing={item}
            onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
            }}
        />
    );

    return (
        <View style={styles.container}>
            <StatusBar barStyle="light-content" />

            <LinearGradient
                colors={['#0a0a0a', '#000', '#050510']}
                style={StyleSheet.absoluteFill}
            />

            <SafeAreaView style={styles.safeArea}>
                <FlatList
                    data={listings}
                    renderItem={renderItem}
                    ListHeaderComponent={renderHeader}
                    keyExtractor={(item) => item.id}
                    showsVerticalScrollIndicator={false}
                    contentContainerStyle={styles.listContent}
                    refreshControl={
                        <RefreshControl
                            refreshing={refreshing}
                            onRefresh={onRefresh}
                            tintColor="#00D9FF"
                            colors={['#00D9FF']}
                        />
                    }
                    ListFooterComponent={<View style={{ height: 100 }} />}
                />
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
    listContent: {
        paddingBottom: 20,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 16,
        paddingVertical: 16,
    },
    backBtn: {
        width: 40,
        height: 40,
        justifyContent: 'center',
        alignItems: 'center',
    },
    headerCenter: {
        flex: 1,
        alignItems: 'center',
    },
    headerTitle: {
        color: '#00D9FF',
        fontSize: 12,
        fontWeight: '900',
        letterSpacing: 3,
    },
    headerSubtitle: {
        color: '#666',
        fontSize: 10,
        marginTop: 2,
        letterSpacing: 1,
    },
    profileBtn: {
        width: 40,
        height: 40,
        justifyContent: 'center',
        alignItems: 'center',
    },
    statsRow: {
        flexDirection: 'row',
        paddingHorizontal: 16,
        gap: 12,
        marginBottom: 16,
    },
    activeListingsWidget: {
        flex: 1,
        borderRadius: 20,
        overflow: 'hidden',
        minHeight: 180,
    },
    widgetBlur: {
        flex: 1,
        borderRadius: 20,
        overflow: 'hidden',
        borderWidth: 1,
        borderColor: 'rgba(0,217,255,0.2)',
    },
    widgetGradient: {
        flex: 1,
        padding: 16,
        alignItems: 'center',
        justifyContent: 'center',
    },
    widgetLabel: {
        color: '#00D9FF',
        fontSize: 10,
        fontWeight: '900',
        letterSpacing: 2,
        marginBottom: 8,
    },
    activeCount: {
        color: '#fff',
        fontSize: 48,
        fontWeight: '900',
    },
    widgetSubtext: {
        color: '#666',
        fontSize: 11,
        marginTop: 4,
        textTransform: 'uppercase',
        letterSpacing: 1,
    },
    liveIndicator: {
        flexDirection: 'row',
        alignItems: 'center',
        marginTop: 12,
        gap: 6,
    },
    livePulse: {
        width: 8,
        height: 8,
        borderRadius: 4,
        backgroundColor: '#00FF9D',
    },
    liveLabel: {
        color: '#00FF9D',
        fontSize: 9,
        fontWeight: 'bold',
    },
    revenueSection: {
        marginBottom: 24,
    },
    sectionHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 16,
        marginBottom: 12,
    },
    sectionTitleRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    sectionTitle: {
        color: '#fff',
        fontSize: 16,
        fontWeight: '900',
    },
    viewAllBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
    },
    viewAllText: {
        color: '#00D9FF',
        fontSize: 12,
        fontWeight: '600',
    },
});

export default OrganizerDashboard;

