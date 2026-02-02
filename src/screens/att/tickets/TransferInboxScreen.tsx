import React, { useEffect, useState, useCallback } from 'react';
import {
    View,
    Text,
    StyleSheet,
    FlatList,
    TouchableOpacity,
    Alert,
    ActivityIndicator,
    RefreshControl,
} from 'react-native';
import { useSelector } from 'react-redux';
import { RootState } from '../../../store/store';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import {
    getPendingTransfers,
    acceptTicketTransfer,
    rejectTicketTransfer,
    TicketTransfer
} from '../../../services/ticketService';
import { notifyTicketTransferAccepted } from '../../../services/notificationService';
import { colors, spacing, typography } from '../../../theme';

const TransferInboxScreen = () => {
    const { user } = useSelector((state: RootState) => state.auth);
    const [transfers, setTransfers] = useState<TicketTransfer[]>([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [processingId, setProcessingId] = useState<string | null>(null);

    const loadTransfers = useCallback(async () => {
        if (!user) return;

        try {
            const pending = await getPendingTransfers(user.email);
            setTransfers(pending);
        } catch (error) {
            console.error('Error loading transfers:', error);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    }, [user]);

    useEffect(() => {
        loadTransfers();
    }, [loadTransfers]);

    const handleRefresh = () => {
        setRefreshing(true);
        loadTransfers();
    };

    const handleAccept = async (transfer: TicketTransfer) => {
        if (!user) return;

        Alert.alert(
            'Aceptar Transferencia',
            `¿Querés aceptar la entrada para "${transfer.eventTitle}" de ${transfer.fromUserName}?`,
            [
                { text: 'Cancelar', style: 'cancel' },
                {
                    text: 'Aceptar',
                    style: 'default',
                    onPress: async () => {
                        setProcessingId(transfer.id);
                        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

                        try {
                            await acceptTicketTransfer(
                                transfer.id,
                                transfer.ticketId,
                                user.id,
                                user.name,
                                user.email
                            );

                            await notifyTicketTransferAccepted(transfer.fromUserName, transfer.eventTitle);

                            Alert.alert(
                                '🎉 ¡Entrada Recibida!',
                                `Ya tenés tu entrada para ${transfer.eventTitle}. La podés ver en Mis Tickets.`
                            );

                            setTransfers(prev => prev.filter(t => t.id !== transfer.id));
                        } catch (error) {
                            console.error('Error accepting transfer:', error);
                            Alert.alert('Error', 'No se pudo aceptar la transferencia. Intenta de nuevo.');
                        } finally {
                            setProcessingId(null);
                        }
                    },
                },
            ]
        );
    };

    const handleReject = async (transfer: TicketTransfer) => {
        Alert.alert(
            'Rechazar Transferencia',
            `¿Estás seguro de rechazar la entrada para "${transfer.eventTitle}"?`,
            [
                { text: 'Cancelar', style: 'cancel' },
                {
                    text: 'Rechazar',
                    style: 'destructive',
                    onPress: async () => {
                        setProcessingId(transfer.id);
                        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);

                        try {
                            await rejectTicketTransfer(transfer.id);
                            setTransfers(prev => prev.filter(t => t.id !== transfer.id));
                        } catch (error) {
                            console.error('Error rejecting transfer:', error);
                            Alert.alert('Error', 'No se pudo rechazar la transferencia.');
                        } finally {
                            setProcessingId(null);
                        }
                    },
                },
            ]
        );
    };

    const renderTransfer = ({ item }: { item: TicketTransfer }) => {
        const isProcessing = processingId === item.id;

        return (
            <View style={styles.transferCard}>
                <LinearGradient
                    colors={['#1a1a2e', '#16213e']}
                    style={styles.cardGradient}
                >
                    <View style={styles.cardHeader}>
                        <View style={styles.senderInfo}>
                            <View style={styles.avatarPlaceholder}>
                                <Ionicons name="person" size={20} color={colors.primary} />
                            </View>
                            <View>
                                <Text style={styles.senderName}>{item.fromUserName}</Text>
                                <Text style={styles.senderLabel}>te envió una entrada</Text>
                            </View>
                        </View>
                        <View style={styles.pendingBadge}>
                            <Text style={styles.pendingText}>Pendiente</Text>
                        </View>
                    </View>

                    <View style={styles.eventInfo}>
                        <Text style={styles.eventTitle}>{item.eventTitle}</Text>
                        <View style={styles.eventDetails}>
                            <Text style={styles.eventDetail}>
                                📅 {new Date(item.requestDate).toLocaleDateString()}
                            </Text>
                        </View>
                    </View>

                    {item.message && (
                        <View style={styles.messageContainer}>
                            <Text style={styles.messageLabel}>Mensaje:</Text>
                            <Text style={styles.messageText}>"{item.message}"</Text>
                        </View>
                    )}

                    <View style={styles.actions}>
                        <TouchableOpacity
                            style={[styles.actionBtn, styles.rejectBtn]}
                            onPress={() => handleReject(item)}
                            disabled={isProcessing}
                        >
                            {isProcessing ? (
                                <ActivityIndicator size="small" color={colors.error} />
                            ) : (
                                <>
                                    <Ionicons name="close" size={18} color={colors.error} />
                                    <Text style={styles.rejectText}>Rechazar</Text>
                                </>
                            )}
                        </TouchableOpacity>

                        <TouchableOpacity
                            style={[styles.actionBtn, styles.acceptBtn]}
                            onPress={() => handleAccept(item)}
                            disabled={isProcessing}
                        >
                            {isProcessing ? (
                                <ActivityIndicator size="small" color={colors.white} />
                            ) : (
                                <>
                                    <Ionicons name="checkmark" size={18} color={colors.white} />
                                    <Text style={styles.acceptText}>Aceptar</Text>
                                </>
                            )}
                        </TouchableOpacity>
                    </View>
                </LinearGradient>
            </View>
        );
    };

    if (loading) {
        return (
            <View style={styles.centered}>
                <ActivityIndicator size="large" color={colors.primary} />
                <Text style={styles.loadingText}>Cargando transferencias...</Text>
            </View>
        );
    }

    return (
        <View style={styles.container}>
            <View style={styles.header}>
                <Text style={styles.headerTitle}>📨 Transferencias Recibidas</Text>
                <Text style={styles.headerSubtitle}>
                    {transfers.length} {transfers.length === 1 ? 'pendiente' : 'pendientes'}
                </Text>
            </View>

            <FlatList
                data={transfers}
                renderItem={renderTransfer}
                keyExtractor={(item) => item.id}
                contentContainerStyle={styles.list}
                refreshControl={
                    <RefreshControl
                        refreshing={refreshing}
                        onRefresh={handleRefresh}
                        tintColor={colors.primary}
                    />
                }
                ListEmptyComponent={
                    <View style={styles.emptyState}>
                        <Ionicons name="mail-open-outline" size={64} color={colors.textSecondary} />
                        <Text style={styles.emptyTitle}>Sin transferencias pendientes</Text>
                        <Text style={styles.emptyText}>
                            Cuando alguien te envíe una entrada, aparecerá aquí
                        </Text>
                    </View>
                }
            />
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: colors.background,
    },
    centered: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        gap: 12,
    },
    loadingText: {
        ...typography.body2,
        color: colors.textSecondary,
    },
    header: {
        padding: spacing.large,
        backgroundColor: colors.surface,
        borderBottomWidth: 1,
        borderBottomColor: colors.border,
    },
    headerTitle: {
        ...typography.h2,
        color: colors.text,
    },
    headerSubtitle: {
        ...typography.body2,
        color: colors.textSecondary,
        marginTop: 4,
    },
    list: {
        padding: spacing.medium,
        gap: spacing.medium,
    },
    transferCard: {
        borderRadius: 16,
        overflow: 'hidden',
        marginBottom: spacing.medium,
    },
    cardGradient: {
        padding: spacing.medium,
    },
    cardHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: spacing.medium,
    },
    senderInfo: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
    },
    avatarPlaceholder: {
        width: 44,
        height: 44,
        borderRadius: 22,
        backgroundColor: 'rgba(0, 217, 255, 0.15)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    senderName: {
        ...typography.subtitle1,
        color: colors.text,
        fontWeight: 'bold',
    },
    senderLabel: {
        ...typography.caption,
        color: colors.textSecondary,
    },
    pendingBadge: {
        backgroundColor: 'rgba(255, 193, 7, 0.2)',
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 12,
    },
    pendingText: {
        ...typography.caption,
        color: '#FFC107',
        fontWeight: 'bold',
    },
    eventInfo: {
        marginBottom: spacing.medium,
    },
    eventTitle: {
        ...typography.h3,
        color: colors.text,
        marginBottom: 8,
    },
    eventDetails: {
        flexDirection: 'row',
        gap: 16,
    },
    eventDetail: {
        ...typography.body2,
        color: colors.textSecondary,
    },
    messageContainer: {
        backgroundColor: 'rgba(255,255,255,0.05)',
        padding: spacing.small,
        borderRadius: 8,
        marginBottom: spacing.medium,
    },
    messageLabel: {
        ...typography.caption,
        color: colors.textSecondary,
        marginBottom: 4,
    },
    messageText: {
        ...typography.body2,
        color: colors.text,
        fontStyle: 'italic',
    },
    actions: {
        flexDirection: 'row',
        gap: spacing.small,
    },
    actionBtn: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        padding: spacing.small,
        borderRadius: 8,
        gap: 6,
    },
    rejectBtn: {
        backgroundColor: 'rgba(244, 67, 54, 0.15)',
        borderWidth: 1,
        borderColor: 'rgba(244, 67, 54, 0.3)',
    },
    acceptBtn: {
        backgroundColor: colors.primary,
    },
    rejectText: {
        ...typography.button,
        color: colors.error,
    },
    acceptText: {
        ...typography.button,
        color: colors.white,
    },
    emptyState: {
        alignItems: 'center',
        justifyContent: 'center',
        padding: spacing.xlarge,
        marginTop: 40,
    },
    emptyTitle: {
        ...typography.h3,
        color: colors.text,
        marginTop: spacing.medium,
    },
    emptyText: {
        ...typography.body2,
        color: colors.textSecondary,
        textAlign: 'center',
        marginTop: 8,
    },
});

export default TransferInboxScreen;
