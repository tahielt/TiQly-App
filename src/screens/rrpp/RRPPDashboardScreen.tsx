import React, { useEffect, useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    TouchableOpacity,
    RefreshControl,
    ActivityIndicator,
    Share,
    Clipboard,
    Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { organizationService } from '../../services/organizationService';
import { RRPPDashboardItem } from '../../types/organization';

const RRPPDashboardScreen = () => {
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [assignments, setAssignments] = useState<RRPPDashboardItem[]>([]);

    const loadData = async () => {
        try {
            const data = await organizationService.getRRPPDashboard();
            setAssignments(data);
        } catch (error) {
            console.error('Error loading RRPP data:', error);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    useEffect(() => {
        loadData();
    }, []);

    const handleCopyLink = (code: string) => {
        const link = `https://tiqly.app/r/${code}`;
        Clipboard.setString(link);
        Alert.alert('✅ Link copiado', 'Compartilo con tus contactos');
    };

    const handleShareLink = async (code: string, eventTitle: string) => {
        const link = `https://tiqly.app/r/${code}`;
        try {
            await Share.share({
                message: `🎉 Comprá tu entrada para ${eventTitle} con mi link: ${link}`,
                url: link,
            });
        } catch (error) {
            console.error('Error sharing:', error);
        }
    };

    if (loading) {
        return (
            <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color="#00D9FF" />
            </View>
        );
    }

    // Calculate totals
    const totalSales = assignments.reduce((sum, a) => sum + a.tickets_sold, 0);
    const totalEarnings = assignments.reduce((sum, a) => sum + a.commission_earned, 0);

    return (
        <SafeAreaView style={styles.container} edges={['top']}>
            {/* Header */}
            <LinearGradient
                colors={['#1a1a1a', '#0D0D0D']}
                style={styles.header}
            >
                <Text style={styles.headerTitle}>Mis Ventas</Text>
            </LinearGradient>

            {/* Stats Summary */}
            <View style={styles.statsRow}>
                <View style={styles.statCard}>
                    <Text style={styles.statValue}>{totalSales}</Text>
                    <Text style={styles.statLabel}>Tickets Vendidos</Text>
                </View>
                <View style={styles.statCard}>
                    <Text style={[styles.statValue, { color: '#00FF9D' }]}>
                        ${totalEarnings.toLocaleString()}
                    </Text>
                    <Text style={styles.statLabel}>Comisión Total</Text>
                </View>
            </View>

            <ScrollView
                style={styles.content}
                refreshControl={
                    <RefreshControl
                        refreshing={refreshing}
                        onRefresh={() => { setRefreshing(true); loadData(); }}
                        tintColor="#00D9FF"
                    />
                }
            >
                {assignments.length > 0 ? (
                    assignments.map((item) => (
                        <View key={item.assignment_id} style={styles.eventCard}>
                            {/* Event Header */}
                            <View style={styles.eventHeader}>
                                <View style={styles.eventInfo}>
                                    <Text style={styles.eventTitle}>{item.event_title}</Text>
                                    <Text style={styles.eventDate}>
                                        📅 {new Date(item.event_date).toLocaleDateString('es-AR', {
                                            day: 'numeric',
                                            month: 'short',
                                            year: 'numeric',
                                        })}
                                    </Text>
                                    <Text style={styles.orgName}>🏢 {item.organization_name}</Text>
                                </View>
                            </View>

                            {/* Referral Link */}
                            <View style={styles.linkSection}>
                                <Text style={styles.linkLabel}>Tu link de referido:</Text>
                                <View style={styles.linkRow}>
                                    <Text style={styles.linkText} numberOfLines={1}>
                                        tiqly.app/r/{item.referral_code}
                                    </Text>
                                    <TouchableOpacity
                                        style={styles.copyButton}
                                        onPress={() => handleCopyLink(item.referral_code)}
                                    >
                                        <Ionicons name="copy-outline" size={18} color="#00D9FF" />
                                    </TouchableOpacity>
                                    <TouchableOpacity
                                        style={styles.shareButton}
                                        onPress={() => handleShareLink(item.referral_code, item.event_title)}
                                    >
                                        <Ionicons name="share-social" size={18} color="#FFF" />
                                    </TouchableOpacity>
                                </View>
                            </View>

                            {/* Stats */}
                            <View style={styles.eventStats}>
                                <View style={styles.eventStat}>
                                    <Text style={styles.eventStatValue}>{item.tickets_sold}</Text>
                                    <Text style={styles.eventStatLabel}>Vendidos</Text>
                                </View>
                                <View style={styles.eventStat}>
                                    <Text style={styles.eventStatValue}>
                                        {item.used_cortesias}/{item.max_cortesias}
                                    </Text>
                                    <Text style={styles.eventStatLabel}>Cortesías</Text>
                                </View>
                                <View style={styles.eventStat}>
                                    <Text style={[styles.eventStatValue, { color: '#00FF9D' }]}>
                                        ${item.commission_earned.toLocaleString()}
                                    </Text>
                                    <Text style={styles.eventStatLabel}>Comisión</Text>
                                </View>
                            </View>
                        </View>
                    ))
                ) : (
                    <View style={styles.emptyState}>
                        <Ionicons name="megaphone-outline" size={64} color="#333" />
                        <Text style={styles.emptyTitle}>Sin asignaciones</Text>
                        <Text style={styles.emptySubtitle}>
                            Cuando te asignen a un evento, aparecerá aquí con tu link de referido
                        </Text>
                    </View>
                )}
            </ScrollView>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#0D0D0D',
    },
    loadingContainer: {
        flex: 1,
        backgroundColor: '#0D0D0D',
        justifyContent: 'center',
        alignItems: 'center',
    },
    header: {
        paddingHorizontal: 20,
        paddingVertical: 16,
        borderBottomWidth: 1,
        borderBottomColor: '#222',
    },
    headerTitle: {
        fontSize: 24,
        fontWeight: '700',
        color: '#FFF',
    },
    statsRow: {
        flexDirection: 'row',
        padding: 16,
        gap: 12,
    },
    statCard: {
        flex: 1,
        backgroundColor: '#1a1a1a',
        borderRadius: 12,
        padding: 16,
        alignItems: 'center',
        borderWidth: 1,
        borderColor: '#333',
    },
    statValue: {
        fontSize: 28,
        fontWeight: '700',
        color: '#00D9FF',
    },
    statLabel: {
        fontSize: 12,
        color: '#888',
        marginTop: 4,
    },
    content: {
        flex: 1,
        padding: 16,
    },
    eventCard: {
        backgroundColor: '#1a1a1a',
        borderRadius: 16,
        padding: 16,
        marginBottom: 16,
        borderWidth: 1,
        borderColor: '#333',
    },
    eventHeader: {
        flexDirection: 'row',
        marginBottom: 16,
    },
    eventInfo: {
        flex: 1,
    },
    eventTitle: {
        fontSize: 18,
        fontWeight: '700',
        color: '#FFF',
        marginBottom: 4,
    },
    eventDate: {
        fontSize: 14,
        color: '#888',
        marginBottom: 2,
    },
    orgName: {
        fontSize: 14,
        color: '#666',
    },
    linkSection: {
        backgroundColor: 'rgba(0, 217, 255, 0.08)',
        borderRadius: 12,
        padding: 12,
        marginBottom: 16,
    },
    linkLabel: {
        fontSize: 12,
        color: '#888',
        marginBottom: 8,
    },
    linkRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    linkText: {
        flex: 1,
        fontSize: 14,
        color: '#00D9FF',
        fontFamily: 'monospace',
    },
    copyButton: {
        padding: 8,
        borderRadius: 8,
        backgroundColor: 'rgba(0, 217, 255, 0.15)',
    },
    shareButton: {
        padding: 8,
        borderRadius: 8,
        backgroundColor: '#00D9FF',
    },
    eventStats: {
        flexDirection: 'row',
        justifyContent: 'space-between',
    },
    eventStat: {
        alignItems: 'center',
        flex: 1,
    },
    eventStatValue: {
        fontSize: 20,
        fontWeight: '700',
        color: '#FFF',
    },
    eventStatLabel: {
        fontSize: 11,
        color: '#666',
        marginTop: 2,
    },
    emptyState: {
        alignItems: 'center',
        paddingVertical: 60,
        paddingHorizontal: 32,
    },
    emptyTitle: {
        fontSize: 20,
        fontWeight: '600',
        color: '#FFF',
        marginTop: 16,
        marginBottom: 8,
    },
    emptySubtitle: {
        fontSize: 14,
        color: '#888',
        textAlign: 'center',
    },
});

export default RRPPDashboardScreen;
