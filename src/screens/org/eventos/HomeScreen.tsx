import React, { useEffect, useState } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  Image
} from 'react-native';
import { useNavigation, useIsFocused } from '@react-navigation/native';
import { useSelector } from 'react-redux';
import { RootState } from '../../../store/store';
import { Event } from '../../../types/event';
import { getOrganizerEvents } from '../../../services/eventService';
import { colors, spacing, typography } from '../../../theme';

const OrganizerEventsHomeScreen = () => {
  const navigation = useNavigation();
  const { user } = useSelector((state: RootState) => state.auth);
  const isFocused = useIsFocused();

  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadEvents = async () => {
    if (!user) return;

    try {
      const fetchedEvents = await getOrganizerEvents(user.id);
      setEvents(fetchedEvents);
    } catch (error) {
      console.error('Error loading events:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    if (isFocused) {
      loadEvents();
    }
  }, [isFocused, user]);

  const handleRefresh = () => {
    setRefreshing(true);
    loadEvents();
  };

  const handleEventPress = (eventId: string) => {
    // @ts-ignore
    navigation.navigate('OrgEventoDetalle', { eventId });
  };

  const handleCreateEvent = () => {
    // @ts-ignore
    navigation.navigate('OrgCrearEvento');
  };

  const renderEvent = ({ item }: { item: Event }) => {
    const statusColors = {
      draft: colors.warning,
      published: colors.success,
      cancelled: colors.error,
      completed: colors.textSecondary
    };

    return (
      <TouchableOpacity 
        style={styles.eventCard}
        onPress={() => handleEventPress(item.id)}
      >
        {item.coverImage ? (
          <Image source={{ uri: item.coverImage }} style={styles.coverImage} />
        ) : (
          <View style={[styles.coverImage, styles.placeholderImage]}>
            <Text style={styles.placeholderText}>🎉</Text>
          </View>
        )}

        <View style={styles.eventInfo}>
          <Text style={styles.eventTitle} numberOfLines={2}>{item.title}</Text>
          
          <Text style={styles.eventDate}>
            📅 {item.startDate.toLocaleDateString()} - {item.startDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </Text>
          
          <Text style={styles.eventLocation} numberOfLines={1}>
            📍 {item.location.venue || item.location.address}
          </Text>

          <View style={styles.statsRow}>
            <Text style={styles.stat}>
              👥 {item.attendeeCount} asistentes
            </Text>
            <View style={[styles.statusBadge, { backgroundColor: statusColors[item.status] }]}>
              <Text style={styles.statusText}>
                {item.status === 'draft' ? 'Borrador' :
                 item.status === 'published' ? 'Publicado' :
                 item.status === 'cancelled' ? 'Cancelado' : 'Finalizado'}
              </Text>
            </View>
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Mis Eventos</Text>
      </View>

      <FlatList
        data={events}
        renderItem={renderEvent}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        refreshing={refreshing}
        onRefresh={handleRefresh}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>No tienes eventos creados</Text>
            <Text style={styles.emptySubtext}>
              Crea tu primer evento para empezar
            </Text>
          </View>
        }
      />

      <TouchableOpacity 
        style={styles.fab}
        onPress={handleCreateEvent}
      >
        <Text style={styles.fabText}>+</Text>
      </TouchableOpacity>
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
  },
  header: {
    padding: spacing.medium,
    backgroundColor: colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  title: {
    ...typography.h1,
    color: colors.text,
  },
  listContent: {
    padding: spacing.medium,
  },
  eventCard: {
    backgroundColor: colors.surface,
    borderRadius: 12,
    marginBottom: spacing.medium,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  coverImage: {
    width: '100%',
    height: 160,
  },
  placeholderImage: {
    backgroundColor: colors.border,
    justifyContent: 'center',
    alignItems: 'center',
  },
  placeholderText: {
    fontSize: 48,
  },
  eventInfo: {
    padding: spacing.medium,
  },
  eventTitle: {
    ...typography.h3,
    marginBottom: spacing.small,
    color: colors.text,
  },
  eventDate: {
    ...typography.body2,
    color: colors.textSecondary,
    marginBottom: spacing.xsmall,
  },
  eventLocation: {
    ...typography.body2,
    color: colors.textSecondary,
    marginBottom: spacing.small,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: spacing.small,
  },
  stat: {
    ...typography.caption,
    color: colors.textSecondary,
  },
  statusBadge: {
    paddingHorizontal: spacing.small,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    ...typography.caption,
    color: colors.white,
    fontWeight: 'bold',
  },
  emptyContainer: {
    alignItems: 'center',
    padding: spacing.xlarge,
  },
  emptyText: {
    ...typography.h3,
    color: colors.textSecondary,
    marginBottom: spacing.small,
  },
  emptySubtext: {
    ...typography.body2,
    color: colors.textSecondary,
  },
  fab: {
    position: 'absolute',
    right: 20,
    bottom: 20,
    backgroundColor: colors.primary,
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
  },
  fabText: {
    color: colors.onPrimary,
    fontSize: 28,
    lineHeight: 32,
  },
});

export default OrganizerEventsHomeScreen;
