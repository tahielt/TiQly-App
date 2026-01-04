import React, { useEffect, useState } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  Image,
  TextInput
} from 'react-native';
import { useNavigation, useIsFocused } from '@react-navigation/native';
import { Event, EventFilter, EventType } from '../../../types/event';
import { getEvents } from '../../../services/eventService';
import { colors, spacing, typography } from '../../../theme';
import * as Location from 'expo-location';

const EventsFeedScreen = () => {
  const navigation = useNavigation();
  const isFocused = useIsFocused();

  const [events, setEvents] = useState<Event[]>([]);
  const [filteredEvents, setFilteredEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Filtros
  const [searchText, setSearchText] = useState('');
  const [selectedType, setSelectedType] = useState<EventType | 'all'>('all');
  const [showFilters, setShowFilters] = useState(false);
  const [userLocation, setUserLocation] = useState<{ latitude: number; longitude: number } | null>(null);
  const [radiusKm, setRadiusKm] = useState(10);

  useEffect(() => {
    if (isFocused) {
      getUserLocation();
      loadEvents();
    }
  }, [isFocused]);

  useEffect(() => {
    applyFilters();
  }, [events, searchText, selectedType, userLocation, radiusKm]);

  const getUserLocation = async () => {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status === 'granted') {
        const location = await Location.getCurrentPositionAsync({});
        setUserLocation({
          latitude: location.coords.latitude,
          longitude: location.coords.longitude
        });
      }
    } catch (error) {
      console.error('Error getting location:', error);
    }
  };

  const loadEvents = async () => {
    try {
      const filter: EventFilter = {
        search: searchText || undefined,
        type: selectedType !== 'all' ? [selectedType] : undefined
      };

      const fetchedEvents = await getEvents(filter);
      setEvents(fetchedEvents);
    } catch (error) {
      console.error('Error loading events:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const applyFilters = () => {
    let filtered = [...events];

    // Filtro por texto de búsqueda
    if (searchText.trim()) {
      const search = searchText.toLowerCase();
      filtered = filtered.filter(event =>
        event.title.toLowerCase().includes(search) ||
        event.description.toLowerCase().includes(search) ||
        event.tags.some(tag => tag.toLowerCase().includes(search))
      );
    }

    // Filtro por tipo
    if (selectedType !== 'all') {
      filtered = filtered.filter(event => event.type === selectedType);
    }

    // Filtro por ubicación (eventos cercanos)
    if (userLocation) {
      filtered = filtered.filter(event => {
        const distance = calculateDistance(
          userLocation.latitude,
          userLocation.longitude,
          event.location.coordinates.latitude,
          event.location.coordinates.longitude
        );
        return distance <= radiusKm;
      });
    }

    setFilteredEvents(filtered);
  };

  const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number): number => {
    const R = 6371; // Radio de la Tierra en km
    const dLat = toRad(lat2 - lat1);
    const dLon = toRad(lon2 - lon1);
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) *
      Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  };

  const toRad = (deg: number): number => {
    return deg * (Math.PI / 180);
  };

  const handleRefresh = () => {
    setRefreshing(true);
    loadEvents();
  };

  const handleEventPress = (eventId: string) => {
    // @ts-ignore
    navigation.navigate('AttEventoDetalle', { eventId });
  };

  const renderEvent = ({ item }: { item: Event }) => {
    const distance = userLocation
      ? calculateDistance(
          userLocation.latitude,
          userLocation.longitude,
          item.location.coordinates.latitude,
          item.location.coordinates.longitude
        )
      : null;

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
          <View style={styles.typeBadge}>
            <Text style={styles.typeText}>
              {item.type === 'public' ? '🌐 Público' : '🔒 Privado'}
            </Text>
          </View>

          <Text style={styles.eventTitle} numberOfLines={2}>{item.title}</Text>
          
          <Text style={styles.eventDate}>
            📅 {item.startDate.toLocaleDateString()} - {item.startDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </Text>
          
          <Text style={styles.eventLocation} numberOfLines={1}>
            📍 {item.location.venue || item.location.address}
            {distance && ` (${distance.toFixed(1)} km)`}
          </Text>

          <View style={styles.footer}>
            <Text style={styles.organizer}>Por {item.organizerName}</Text>
            {item.ticketTypes.length > 0 && (
              <Text style={styles.price}>
                Desde ${item.ticketTypes[0].price}
              </Text>
            )}
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
      {/* Barra de búsqueda */}
      <View style={styles.searchBar}>
        <TextInput
          style={styles.searchInput}
          placeholder="Buscar eventos..."
          placeholderTextColor={colors.textSecondary}
          value={searchText}
          onChangeText={setSearchText}
        />
        <TouchableOpacity 
          style={styles.filterButton}
          onPress={() => setShowFilters(!showFilters)}
        >
          <Text>🔍</Text>
        </TouchableOpacity>
      </View>

      {/* Filtros */}
      {showFilters && (
        <View style={styles.filtersContainer}>
          <Text style={styles.filterLabel}>Tipo de evento:</Text>
          <View style={styles.typeFilters}>
            {['all', 'public', 'private'].map((type) => (
              <TouchableOpacity
                key={type}
                style={[
                  styles.typeFilterButton,
                  selectedType === type && styles.typeFilterButtonActive
                ]}
                onPress={() => setSelectedType(type as EventType | 'all')}
              >
                <Text style={[
                  styles.typeFilterText,
                  selectedType === type && styles.typeFilterTextActive
                ]}>
                  {type === 'all' ? '🌐 Todos' :
                   type === 'public' ? '🌐 Público' : '🔒 Privado'}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          <Text style={styles.filterLabel}>Radio: {radiusKm} km</Text>
          <View style={styles.radiusButtons}>
            {[5, 10, 25, 50].map((km) => (
              <TouchableOpacity
                key={km}
                style={[
                  styles.radiusButton,
                  radiusKm === km && styles.radiusButtonActive
                ]}
                onPress={() => setRadiusKm(km)}
              >
                <Text style={[
                  styles.radiusText,
                  radiusKm === km && styles.radiusTextActive
                ]}>
                  {km} km
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      )}

      {/* Lista de eventos */}
      <FlatList
        data={filteredEvents}
        renderItem={renderEvent}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        refreshing={refreshing}
        onRefresh={handleRefresh}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>
              {searchText ? 'No se encontraron eventos' : 'No hay eventos disponibles'}
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
  },
  searchBar: {
    flexDirection: 'row',
    padding: spacing.medium,
    backgroundColor: colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  searchInput: {
    flex: 1,
    ...typography.body1,
    backgroundColor: colors.background,
    borderRadius: 8,
    padding: spacing.small,
    paddingHorizontal: spacing.medium,
    marginRight: spacing.small,
  },
  filterButton: {
    width: 44,
    height: 44,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.primary,
    borderRadius: 8,
  },
  filtersContainer: {
    padding: spacing.medium,
    backgroundColor: colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  filterLabel: {
    ...typography.subtitle2,
    marginBottom: spacing.small,
    color: colors.text,
  },
  typeFilters: {
    flexDirection: 'row',
    marginBottom: spacing.medium,
  },
  typeFilterButton: {
    flex: 1,
    padding: spacing.small,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.border,
    marginRight: spacing.xsmall,
    alignItems: 'center',
  },
  typeFilterButtonActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  typeFilterText: {
    ...typography.caption,
    color: colors.text,
  },
  typeFilterTextActive: {
    color: colors.onPrimary,
  },
  radiusButtons: {
    flexDirection: 'row',
    marginTop: spacing.small,
  },
  radiusButton: {
    flex: 1,
    padding: spacing.small,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.border,
    marginRight: spacing.xsmall,
    alignItems: 'center',
  },
  radiusButtonActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  radiusText: {
    ...typography.caption,
    color: colors.text,
  },
  radiusTextActive: {
    color: colors.onPrimary,
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
    height: 180,
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
  typeBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: spacing.small,
    paddingVertical: 4,
    backgroundColor: colors.primary,
    borderRadius: 12,
    marginBottom: spacing.small,
  },
  typeText: {
    ...typography.caption,
    color: colors.onPrimary,
    fontWeight: 'bold',
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
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: spacing.small,
    paddingTop: spacing.small,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  organizer: {
    ...typography.caption,
    color: colors.textSecondary,
  },
  price: {
    ...typography.subtitle2,
    color: colors.primary,
    fontWeight: 'bold',
  },
  emptyContainer: {
    alignItems: 'center',
    padding: spacing.xlarge,
  },
  emptyText: {
    ...typography.body1,
    color: colors.textSecondary,
  },
});

export default EventsFeedScreen;
