import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, FlatList, Image, TouchableOpacity, StatusBar, SafeAreaView, ScrollView, Dimensions } from 'react-native';
import { useNavigation, useIsFocused } from '@react-navigation/native';
import { getEvents, EVENT_CATEGORIES } from '../lib/mock-data';
import { Ionicons } from '@expo/vector-icons';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const CAROUSEL_ITEM_WIDTH = SCREEN_WIDTH - 60;

const HomeScreen = () => {
  const navigation = useNavigation<any>();
  const isFocused = useIsFocused();
  const [events, setEvents] = useState<any[]>([]);
  const [filteredEvents, setFilteredEvents] = useState<any[]>([]);
  const [selectedCategory, setSelectedCategory] = useState("Todos");

  useEffect(() => {
    if (isFocused) {
      loadEvents();
    }
  }, [isFocused]);

  useEffect(() => {
    if (selectedCategory === "Todos") {
      setFilteredEvents(events);
    } else {
      setFilteredEvents(events.filter(e => e.category === selectedCategory));
    }
  }, [selectedCategory, events]);

  const loadEvents = async () => {
    const data = await getEvents();
    setEvents(data);
  };

  // Featured events (first 5)
  const featuredEvents = events.slice(0, 5);

  const renderCarouselItem = ({ item }: { item: any }) => (
    <TouchableOpacity
      style={styles.carouselCard}
      onPress={() => navigation.navigate('AttEventoDetalle', { eventId: item.id })}
      activeOpacity={0.9}
    >
      <Image source={{ uri: item.coverImage }} style={styles.carouselImage} />
      <View style={styles.carouselGradient}>
        <View style={styles.carouselBadge}>
          <Text style={styles.carouselBadgeText}>{item.category}</Text>
        </View>
        <Text style={styles.carouselDate}>
          {item.startDate ? new Date(item.startDate).toLocaleDateString('es-AR', { weekday: 'short', day: 'numeric', month: 'short' }).toUpperCase() : ''}
        </Text>
        <Text style={styles.carouselTitle} numberOfLines={2}>{item.title}</Text>
        <View style={styles.carouselFooter}>
          <View style={styles.carouselLocation}>
            <Ionicons name="location" size={14} color="#00D9FF" />
            <Text style={styles.carouselLocationText} numberOfLines={1}>{item.location?.city}</Text>
          </View>
          <Text style={styles.carouselPrice}>${item.price?.toLocaleString()}</Text>
        </View>
      </View>
    </TouchableOpacity>
  );

  const renderEventItem = ({ item }: { item: any }) => (
    <TouchableOpacity
      style={styles.card}
      onPress={() => navigation.navigate('AttEventoDetalle', { eventId: item.id })}
    >
      <Image source={{ uri: item.coverImage }} style={styles.cardImage} />
      <View style={styles.cardContent}>
        <View style={styles.badgeContainer}>
          <Text style={styles.badgeText}>{item.category}</Text>
        </View>
        <Text style={styles.date}>
          {item.startDate ? new Date(item.startDate).toLocaleDateString('es-AR', { weekday: 'short', day: 'numeric', month: 'short' }).toUpperCase() : 'FECHA PENDIENTE'}
        </Text>
        <Text style={styles.title}>{item.title}</Text>
        <View style={styles.locationContainer}>
          <Ionicons name="location-outline" size={16} color="#666" />
          <Text style={styles.location}>{item.location.address}, {item.location.city}</Text>
        </View>
        <Text style={styles.price}>${item.price?.toLocaleString() || '0'}</Text>
      </View>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" />
      <View style={styles.header}>
        <Image source={require('../../assets/Tiqly nuevo color marca SINLOGO.png')} style={styles.logoImage} resizeMode="contain" />
        <View style={{ flexDirection: 'row', gap: 12 }}>
          <TouchableOpacity style={styles.iconButton} onPress={() => navigation.navigate('CreateEvent')}>
            <Ionicons name="add-circle-outline" size={24} color="#00D9FF" />
          </TouchableOpacity>
          <TouchableOpacity style={styles.iconButton} onPress={() => navigation.navigate('Profile')}>
            <Ionicons name="person-circle-outline" size={24} color="#fff" />
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Featured Carousel */}
        {featuredEvents.length > 0 && (
          <View style={styles.carouselSection}>
            <Text style={styles.sectionTitle}>🔥 Destacados</Text>
            <FlatList
              horizontal
              data={featuredEvents}
              renderItem={renderCarouselItem}
              keyExtractor={(item) => `featured-${item.id}`}
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.carouselList}
              snapToInterval={CAROUSEL_ITEM_WIDTH + 16}
              decelerationRate="fast"
            />
          </View>
        )}

        {/* Category Filters */}
        <View style={styles.categoriesContainer}>
          <FlatList
            horizontal
            showsHorizontalScrollIndicator={false}
            data={EVENT_CATEGORIES}
            keyExtractor={(item) => item}
            renderItem={({ item }) => (
              <TouchableOpacity
                style={[styles.categoryChip, selectedCategory === item && styles.categoryChipActive]}
                onPress={() => setSelectedCategory(item)}
              >
                <Text style={[styles.categoryText, selectedCategory === item && styles.categoryTextActive]}>{item}</Text>
              </TouchableOpacity>
            )}
            contentContainerStyle={styles.categoriesList}
          />
        </View>

        {/* All Events List */}
        <View style={styles.listSection}>
          <Text style={styles.sectionTitle}>📅 Todos los Eventos</Text>
          {filteredEvents.length === 0 ? (
            <View style={styles.emptyContainer}>
              <Ionicons name="search-outline" size={48} color="#333" />
              <Text style={styles.emptyText}>No hay eventos en esta categoría</Text>
            </View>
          ) : (
            filteredEvents.map((item) => (
              <View key={item.id}>
                {renderEventItem({ item })}
              </View>
            ))
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000000',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#000000',
  },
  logoImage: {
    height: 40,
    width: 140,
  },
  logo: {
    fontSize: 28,
    fontWeight: '900',
    color: '#fff',
  },
  iconButton: {
    padding: 8,
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: 20,
  },
  // Carousel Styles
  carouselSection: {
    marginBottom: 16,
  },
  sectionTitle: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '900',
    marginBottom: 12,
    paddingHorizontal: 20,
  },
  carouselList: {
    paddingHorizontal: 20,
  },
  carouselCard: {
    width: CAROUSEL_ITEM_WIDTH,
    height: 200,
    borderRadius: 20,
    overflow: 'hidden',
    marginRight: 16,
    position: 'relative',
  },
  carouselImage: {
    width: '100%',
    height: '100%',
    position: 'absolute',
  },
  carouselGradient: {
    flex: 1,
    justifyContent: 'flex-end',
    padding: 16,
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  carouselBadge: {
    alignSelf: 'flex-start',
    backgroundColor: '#00D9FF',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 10,
    marginBottom: 8,
  },
  carouselBadgeText: {
    color: '#000',
    fontSize: 11,
    fontWeight: 'bold',
  },
  carouselDate: {
    color: '#00D9FF',
    fontSize: 11,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  carouselTitle: {
    color: '#fff',
    fontSize: 20,
    fontWeight: '900',
    marginBottom: 8,
  },
  carouselFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  carouselLocation: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  carouselLocationText: {
    color: '#888',
    fontSize: 12,
  },
  carouselPrice: {
    color: '#00FF9D',
    fontSize: 18,
    fontWeight: '900',
  },
  listSection: {
    paddingHorizontal: 20,
    paddingBottom: 40,
  },
  listContent: {
    padding: 20,
    paddingTop: 10,
  },
  categoriesContainer: {
    backgroundColor: '#000000',
    paddingVertical: 10,
  },
  categoriesList: {
    paddingHorizontal: 20,
    gap: 10,
  },
  categoryChip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#111',
    borderWidth: 1,
    borderColor: '#222',
  },
  categoryChipActive: {
    backgroundColor: '#00D9FF',
    borderColor: '#00D9FF',
  },
  categoryText: {
    color: '#888',
    fontWeight: 'bold',
    fontSize: 14,
  },
  categoryTextActive: {
    color: '#000',
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 100,
    gap: 16,
  },
  emptyText: {
    color: '#444',
    fontSize: 16,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  card: {
    backgroundColor: '#111111',
    borderRadius: 20,
    overflow: 'hidden',
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#222',
  },
  cardImage: {
    width: '100%',
    height: 180,
  },
  cardContent: {
    padding: 16,
  },
  badgeContainer: {
    position: 'absolute',
    top: -160,
    right: 16,
    backgroundColor: '#00D9FF',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  badgeText: {
    color: '#000',
    fontWeight: 'bold',
    fontSize: 12,
  },
  date: {
    color: '#00D9FF',
    fontWeight: '700',
    marginBottom: 4,
    fontSize: 12,
  },
  title: {
    color: '#fff',
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  locationContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  location: {
    color: '#888',
    marginLeft: 4,
    fontSize: 14,
  },
  price: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
});

export default HomeScreen;
