import React, { useEffect, useState, useRef, useCallback } from 'react';
import { View, Text, StyleSheet, FlatList, Image, TouchableOpacity, StatusBar, SafeAreaView, ScrollView, Dimensions, TextInput, Animated, Keyboard } from 'react-native';
import { useNavigation, useIsFocused } from '@react-navigation/native';
import { EVENT_CATEGORIES } from '../constants/eventCategories';
import { eventService } from '../services/eventService';
import { Ionicons } from '@expo/vector-icons';
import { useSelector } from 'react-redux';
import { RootState } from '../store/store';
import { checkDailyStreak } from '../services/xpService';
import { DailyRewardModal } from '../components/gamification';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const CAROUSEL_ITEM_WIDTH = SCREEN_WIDTH - 60;

const HomeScreen = () => {
  const navigation = useNavigation<any>();
  const isFocused = useIsFocused();
  const { user } = useSelector((state: RootState) => state.auth);
  const [events, setEvents] = useState<any[]>([]);
  const [filteredEvents, setFilteredEvents] = useState<any[]>([]);
  const [selectedCategory, setSelectedCategory] = useState("Todos");

  // 🔍 Search State
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearchFocused, setIsSearchFocused] = useState(false);
  const searchInputRef = useRef<TextInput>(null);
  const searchBarAnim = useRef(new Animated.Value(0)).current;

  // Gamification State
  const [rewardModalVisible, setRewardModalVisible] = useState(false);
  const [streakData, setStreakData] = useState({ streak: 0, xpBonus: 0 });

  useEffect(() => {
    if (isFocused) {
      loadEvents();
      checkStreak();
    }
  }, [isFocused]);

  const checkStreak = async () => {
    if (user?.id) {
      try {
        const result = await checkDailyStreak(user.id);
        if (result.isFirstLogin || result.xpBonus > 0) {
          setStreakData({ streak: result.streak, xpBonus: result.xpBonus });
          setRewardModalVisible(true);
        }
      } catch (error) {
        console.log('Error checking streak:', error);
      }
    }
  };

  // 🎯 Smart filtering: category + search query
  useEffect(() => {
    let result = events;

    // Filter by category first
    if (selectedCategory !== "Todos") {
      result = result.filter(e => e.category === selectedCategory);
    }

    // Then filter by search query (fuzzy match on title, location, organizer)
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase().trim();
      result = result.filter(e =>
        e.title?.toLowerCase().includes(query) ||
        e.location?.address?.toLowerCase().includes(query) ||
        e.location?.city?.toLowerCase().includes(query) ||
        e.organizerName?.toLowerCase().includes(query) ||
        e.description?.toLowerCase().includes(query)
      );
    }

    setFilteredEvents(result);
  }, [selectedCategory, events, searchQuery]);

  // 🎬 Search bar animation
  const animateSearchBar = (focused: boolean) => {
    Animated.spring(searchBarAnim, {
      toValue: focused ? 1 : 0,
      useNativeDriver: false,
      tension: 100,
      friction: 10,
    }).start();
    setIsSearchFocused(focused);
  };

  const clearSearch = useCallback(() => {
    setSearchQuery('');
    searchInputRef.current?.blur();
    Keyboard.dismiss();
  }, []);

  const loadEvents = async () => {
    try {
      const data = await eventService.getEvents();
      // If data is empty, we set empty array. The UI already handles empty state.
      setEvents(data);
    } catch (error) {
      console.error("Error loading home events:", error);
    }
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
        <Image source={require('../../assets/color.png')} style={styles.logoImage} resizeMode="contain" />
        <View style={{ flexDirection: 'row', gap: 12 }}>
          <TouchableOpacity style={styles.createIconButton} onPress={() => navigation.navigate('CreateEvent')}>
            <Ionicons name="add" size={24} color="#00D9FF" />
          </TouchableOpacity>
          <TouchableOpacity style={styles.iconButton} onPress={() => navigation.navigate('Profile')}>
            {user?.avatar ? (
              <Image
                source={{ uri: user.avatar }}
                style={styles.avatarImage}
              />
            ) : (
              <Ionicons name="person-circle-outline" size={24} color="#fff" />
            )}
          </TouchableOpacity>
        </View>
      </View>

      {/* 🔍 Premium Animated Search Bar */}
      <Animated.View style={[
        styles.searchContainer,
        {
          borderColor: searchBarAnim.interpolate({
            inputRange: [0, 1],
            outputRange: ['rgba(255,255,255,0.08)', '#00D9FF'],
          }),
          backgroundColor: searchBarAnim.interpolate({
            inputRange: [0, 1],
            outputRange: ['rgba(255,255,255,0.05)', 'rgba(0,217,255,0.08)'],
          }),
        }
      ]}>
        <Ionicons
          name="search"
          size={20}
          color={isSearchFocused ? '#00D9FF' : '#666'}
          style={styles.searchIcon}
        />
        <TextInput
          ref={searchInputRef}
          style={styles.searchInput}
          placeholder="Buscar eventos, artistas, lugares..."
          placeholderTextColor="#555"
          value={searchQuery}
          onChangeText={setSearchQuery}
          onFocus={() => animateSearchBar(true)}
          onBlur={() => animateSearchBar(false)}
          returnKeyType="search"
          autoCorrect={false}
          autoCapitalize="none"
        />
        {searchQuery.length > 0 && (
          <TouchableOpacity onPress={clearSearch} style={styles.clearButton}>
            <Ionicons name="close-circle" size={20} color="#666" />
          </TouchableOpacity>
        )}
      </Animated.View>

      <ScrollView showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
        {/* Featured Carousel */}
        {featuredEvents.length > 0 && !searchQuery && (
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
          <Text style={styles.sectionTitle}>
            {searchQuery ? `🔍 Resultados para "${searchQuery}"` : '📅 Todos los Eventos'}
          </Text>
          {filteredEvents.length === 0 ? (
            <View style={styles.emptyContainer}>
              <Ionicons name={searchQuery ? "sad-outline" : "search-outline"} size={48} color="#333" />
              <Text style={styles.emptyText}>
                {searchQuery
                  ? `No encontramos eventos con "${searchQuery}"`
                  : 'No hay eventos en esta categoría'}
              </Text>
              {searchQuery && (
                <TouchableOpacity onPress={clearSearch} style={styles.clearSearchButton}>
                  <Text style={styles.clearSearchText}>Limpiar búsqueda</Text>
                </TouchableOpacity>
              )}
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

      <DailyRewardModal
        visible={rewardModalVisible}
        streak={streakData.streak}
        xpBonus={streakData.xpBonus}
        onClose={() => setRewardModalVisible(false)}
      />
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
    overflow: 'hidden', // Add this to ensure image stays inside circle
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarImage: {
    width: 40,
    height: 40,
    borderRadius: 20,
  },
  createIconButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#111',
    borderWidth: 1.5,
    borderColor: '#00D9FF',
    justifyContent: 'center',
    alignItems: 'center',
    // Subtle glow
    shadowColor: '#00D9FF',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.3,
    shadowRadius: 5,
    elevation: 3,
  },
  // 🔍 Search Bar Styles
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 20,
    marginBottom: 16,
    paddingHorizontal: 16,
    height: 52,
    borderRadius: 16,
    borderWidth: 1.5,
    // Glassmorphism shadow
    shadowColor: '#00D9FF',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 8,
  },
  searchIcon: {
    marginRight: 12,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: '#fff',
    fontWeight: '500',
  },
  clearButton: {
    padding: 6,
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
    paddingHorizontal: 20,
  },
  clearSearchButton: {
    marginTop: 8,
    paddingVertical: 12,
    paddingHorizontal: 24,
    backgroundColor: 'rgba(0,217,255,0.15)',
    borderRadius: 25,
    borderWidth: 1,
    borderColor: '#00D9FF',
  },
  clearSearchText: {
    color: '#00D9FF',
    fontWeight: '700',
    fontSize: 14,
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
