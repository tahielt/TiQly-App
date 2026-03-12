import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  Share,
  ActivityIndicator,
  Modal,
  TextInput
} from 'react-native';
import { useRoute, RouteProp } from '@react-navigation/native';
import { useSelector } from 'react-redux';
import { RootState } from '../../../store/store';
import QRCode from 'react-native-qrcode-svg';
import { Ionicons } from '@expo/vector-icons';
import { Ticket } from '../../../types/ticket';
import { getTicketById, initiateTicketTransfer } from '../../../services/ticketService';
import * as Haptics from 'expo-haptics';
import { colors, spacing, typography } from '../../../theme';

type RouteParams = {
  params: {
    ticketId: string;
  };
};

const TicketDetailScreen = () => {
  const route = useRoute<RouteProp<RouteParams, 'params'>>();
  const { user } = useSelector((state: RootState) => state.auth);

  const { ticketId } = route.params;
  const [ticket, setTicket] = useState<Ticket | null>(null);
  const [loading, setLoading] = useState(true);
  const [transferring, setTransferring] = useState(false);
  const [transferModalVisible, setTransferModalVisible] = useState(false);
  const [transferEmail, setTransferEmail] = useState('');

  useEffect(() => {
    loadTicket();
  }, [ticketId]);

  const loadTicket = async () => {
    try {
      const fetchedTicket = await getTicketById(ticketId);
      setTicket(fetchedTicket);
    } catch (error) {
      console.error('Error loading ticket:', error);
      Alert.alert('Error', 'No se pudo cargar el ticket');
    } finally {
      setLoading(false);
    }
  };

  const handleTransfer = () => {
    if (!ticket || !user) return;
    Haptics.selectionAsync();
    setTransferModalVisible(true);
  };

  const submitTransfer = async () => {
    if (!ticket || !user) return;

    const email = transferEmail.trim();
    if (!email || !email.includes('@')) {
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      Alert.alert('Error', 'Email inválido');
      return;
    }

    setTransferring(true);
    try {
      await initiateTicketTransfer(
        ticket.id,
        user.id,
        user.name,
        email
      );

      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      setTransferModalVisible(false);
      setTransferEmail('');

      Alert.alert(
        'Transferencia Enviada',
        `Se ha enviado la solicitud de transferencia a ${email}. El destinatario debe aceptarla para completar la transferencia.`
      );
    } catch (error: any) {
      console.error('Error transferring ticket:', error);
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      Alert.alert('Error', error?.message || 'No se pudo transferir el ticket');
    } finally {
      setTransferring(false);
    }
  };

  const handleShare = async () => {
    if (!ticket) return;

    try {
      await Share.share({
        message: `¡Voy a ${ticket.eventTitle}! 🎉\n\nFecha: ${ticket.eventDate.toLocaleDateString()}\nLugar: ${ticket.eventLocation}`,
        title: ticket.eventTitle,
      });
    } catch (error) {
      console.error('Error sharing:', error);
    }
  };

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  if (!ticket) {
    return (
      <View style={styles.centered}>
        <Text style={styles.errorText}>No se encontró el ticket</Text>
      </View>
    );
  }

  const statusColors: Record<string, string> = {
    active: colors.success,
    used: colors.textSecondary,
    transferred: colors.warning,
    cancelled: colors.error,
    expired: colors.textSecondary,
    listed: colors.primary
  };

  const statusLabels: Record<string, string> = {
    active: '✓ Activo',
    used: '✓ Usado',
    transferred: '↔ Transferido',
    cancelled: '✗ Cancelado',
    expired: '⏰ Expirado',
    listed: '📢 En Venta'
  };

  return (
    <ScrollView style={styles.container}>
      {/* Header con estado */}
      <View style={styles.header}>
        <View style={[styles.statusBadge, { backgroundColor: statusColors[ticket.status] }]}>
          <Text style={styles.statusText}>{statusLabels[ticket.status]}</Text>
        </View>
        <Text style={styles.ticketId}>#{ticket.id.slice(-8).toUpperCase()}</Text>
      </View>

      {/* Información del evento */}
      <View style={styles.section}>
        <Text style={styles.eventTitle}>{ticket.eventTitle}</Text>

        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>📅 Fecha</Text>
          <Text style={styles.infoValue}>
            {ticket.eventDate.toLocaleDateString()} - {ticket.eventDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </Text>
        </View>

        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>📍 Lugar</Text>
          <Text style={styles.infoValue}>{ticket.eventLocation}</Text>
        </View>

        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>🎫 Tipo</Text>
          <Text style={styles.infoValue}>{ticket.ticketTypeName}</Text>
        </View>

        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>💰 Precio</Text>
          <Text style={styles.infoValue}>${ticket.price.toFixed(2)}</Text>
        </View>
      </View>

      {/* Código QR */}
      {ticket.status === 'active' && (
        <View style={styles.qrSection}>
          <Text style={styles.qrTitle}>Tu Código QR</Text>
          <Text style={styles.qrSubtitle}>Muestra este código en el evento</Text>

          <View style={styles.qrContainer}>
            <QRCode
              value={ticket.qrCode}
              size={220}
              backgroundColor={colors.white}
              color={colors.text}
            />
          </View>

          <Text style={styles.qrWarning}>
            ⚠️ No compartas este código con nadie
          </Text>
        </View>
      )}

      {/* Información del propietario */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Propietario</Text>

        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>👤 Nombre</Text>
          <Text style={styles.infoValue}>{ticket.userName}</Text>
        </View>

        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>📧 Email</Text>
          <Text style={styles.infoValue}>{ticket.userEmail}</Text>
        </View>

        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>🛒 Comprado</Text>
          <Text style={styles.infoValue}>
            {ticket.purchaseDate.toLocaleDateString()}
          </Text>
        </View>
      </View>

      {/* Historial de transferencias */}
      {ticket.transferHistory && ticket.transferHistory.length > 0 && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Historial de Transferencias</Text>
          {ticket.transferHistory.map((transfer, index) => (
            <View key={transfer.id} style={styles.transferItem}>
              <Text style={styles.transferText}>
                De: {transfer.fromUserName} → A: {transfer.toUserName}
              </Text>
              <Text style={styles.transferDate}>
                {transfer.requestDate.toLocaleDateString()}
              </Text>
            </View>
          ))}
        </View>
      )}

      {/* Acciones */}
      {ticket.status === 'active' && (
        <View style={styles.actions}>
          <TouchableOpacity
            style={[styles.actionButton, styles.transferButton]}
            onPress={handleTransfer}
            disabled={transferring}
          >
            {transferring ? (
              <ActivityIndicator color={colors.onPrimary} />
            ) : (
              <Text style={styles.actionButtonText}>↔️ Transferir</Text>
            )}
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.actionButton, styles.shareButton]}
            onPress={handleShare}
          >
            <Text style={styles.actionButtonText}>📤 Compartir</Text>
          </TouchableOpacity>
        </View>
      )}

      {ticket.status === 'used' && ticket.usedAt && (
        <View style={styles.usedInfo}>
          <Text style={styles.usedText}>
            ✓ Entrada utilizada el {ticket.usedAt.toLocaleDateString()} a las {ticket.usedAt.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </Text>
        </View>
      )}

      <Modal
        visible={transferModalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setTransferModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Transferir Entrada</Text>
              <TouchableOpacity onPress={() => setTransferModalVisible(false)}>
                <Ionicons name="close" size={24} color={colors.text} />
              </TouchableOpacity>
            </View>
            <Text style={styles.modalSubtitle}>Ingresá el email del destinatario</Text>
            <TextInput
              style={styles.modalInput}
              placeholder="email@ejemplo.com"
              placeholderTextColor={colors.textSecondary}
              autoCapitalize="none"
              keyboardType="email-address"
              value={transferEmail}
              onChangeText={setTransferEmail}
            />
            <View style={styles.modalActions}>
              <TouchableOpacity style={styles.modalCancel} onPress={() => setTransferModalVisible(false)}>
                <Text style={styles.modalCancelText}>Cancelar</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.modalConfirm}
                onPress={submitTransfer}
                disabled={transferring}
              >
                {transferring ? (
                  <ActivityIndicator color={colors.onPrimary} />
                ) : (
                  <Text style={styles.modalConfirmText}>Enviar</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
      <View style={{ height: 40 }} />
    </ScrollView>
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
  },
  errorText: {
    ...typography.h3,
    color: colors.error,
  },
  header: {
    padding: spacing.large,
    backgroundColor: colors.surface,
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  statusBadge: {
    paddingHorizontal: spacing.medium,
    paddingVertical: spacing.small,
    borderRadius: 20,
    marginBottom: spacing.small,
  },
  statusText: {
    ...typography.button,
    color: colors.white,
    fontWeight: 'bold',
  },
  ticketId: {
    ...typography.caption,
    color: colors.textSecondary,
  },
  section: {
    padding: spacing.medium,
    backgroundColor: colors.surface,
    marginTop: spacing.small,
  },
  eventTitle: {
    ...typography.h2,
    color: colors.text,
    marginBottom: spacing.medium,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: spacing.small,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  infoLabel: {
    ...typography.body2,
    color: colors.textSecondary,
  },
  infoValue: {
    ...typography.body1,
    color: colors.text,
    fontWeight: '600',
  },
  qrSection: {
    padding: spacing.large,
    backgroundColor: colors.surface,
    marginTop: spacing.small,
    alignItems: 'center',
  },
  qrTitle: {
    ...typography.h3,
    color: colors.text,
    marginBottom: spacing.xsmall,
  },
  qrSubtitle: {
    ...typography.caption,
    color: colors.textSecondary,
    marginBottom: spacing.large,
  },
  qrContainer: {
    padding: spacing.large,
    backgroundColor: colors.white,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  qrWarning: {
    ...typography.caption,
    color: colors.warning,
    marginTop: spacing.medium,
    textAlign: 'center',
  },
  sectionTitle: {
    ...typography.h3,
    color: colors.text,
    marginBottom: spacing.medium,
  },
  transferItem: {
    paddingVertical: spacing.small,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  transferText: {
    ...typography.body2,
    color: colors.text,
  },
  transferDate: {
    ...typography.caption,
    color: colors.textSecondary,
    marginTop: spacing.xsmall,
  },
  actions: {
    flexDirection: 'row',
    padding: spacing.medium,
    gap: spacing.small,
  },
  actionButton: {
    flex: 1,
    padding: spacing.medium,
    borderRadius: 8,
    alignItems: 'center',
  },
  transferButton: {
    backgroundColor: colors.primary,
  },
  shareButton: {
    backgroundColor: colors.success,
  },
  actionButtonText: {
    ...typography.button,
    color: colors.onPrimary,
  },
  usedInfo: {
    padding: spacing.medium,
    backgroundColor: colors.surface,
    marginTop: spacing.small,
    alignItems: 'center',
  },
  usedText: {
    ...typography.body2,
    color: colors.textSecondary,
    textAlign: 'center',
  },
  modalOverlay: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0,0,0,0.75)',
  },
  modalContent: {
    backgroundColor: colors.surface,
    padding: spacing.large,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    borderWidth: 1,
    borderColor: colors.border,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.small,
  },
  modalTitle: {
    ...typography.h3,
    color: colors.text,
  },
  modalSubtitle: {
    ...typography.body2,
    color: colors.textSecondary,
    marginBottom: spacing.medium,
  },
  modalInput: {
    backgroundColor: colors.background,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 10,
    padding: spacing.small,
    color: colors.text,
    marginBottom: spacing.medium,
  },
  modalActions: {
    flexDirection: 'row',
    gap: spacing.small,
  },
  modalCancel: {
    flex: 1,
    padding: spacing.small,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
  },
  modalCancelText: {
    ...typography.button,
    color: colors.textSecondary,
  },
  modalConfirm: {
    flex: 1,
    padding: spacing.small,
    borderRadius: 10,
    backgroundColor: colors.primary,
    alignItems: 'center',
  },
  modalConfirmText: {
    ...typography.button,
    color: colors.onPrimary,
  },
});

export default TicketDetailScreen;
