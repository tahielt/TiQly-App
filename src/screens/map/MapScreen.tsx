import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
    View,
    Text,
    StyleSheet,
    Image,
    TouchableOpacity,
    ScrollView,
    Dimensions,
    SafeAreaView,
    StatusBar,
    Animated,
    Platform,
    TextInput,
    ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { EVENT_CATEGORIES } from '../../constants/eventCategories';
import { eventService } from '../../services/eventService';
import { useNavigation, useIsFocused } from '@react-navigation/native';
import MapView, { MapViewHandle } from '../../components/MapView';
import * as Haptics from 'expo-haptics';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

const MapScreen = () => {
    const navigation = useNavigation<any>();
    const isFocused = useIsFocused();
    const mapRef = useRef<MapViewHandle>(null);

    // Data State
    const [events, setEvents] = useState<any[]>([]);
    const [selectedCategory, setSelectedCategory] = useState("Todos");
    const [filteredEvents, setFilteredEvents] = useState<any[]>([]);
    const [selectedEvent, setSelectedEvent] = useState<any | null>(null);

    // Search & Loading State
    const [searchQuery, setSearchQuery] = useState('');
    const [isLoading, setIsLoading] = useState(true);

    // Card Animation
    const cardAnim = useRef(new Animated.Value(0)).current;

    // Load events when screen is focused
    useEffect(() => {
        if (isFocused) {
            loadEvents();
        }
    }, [isFocused]);

    // Filter events based on category AND search query
    useEffect(() => {
        let filtered = events;

        // Filter by category
        if (selectedCategory !== "Todos") {
            filtered = filtered.filter(e => e.category === selectedCategory);
        }

        // Filter by search query
        if (searchQuery.trim()) {
            const query = searchQuery.toLowerCase();
            filtered = filtered.filter(e =>
                e.title?.toLowerCase().includes(query) ||
                e.location?.address?.toLowerCase().includes(query)
            );
        }

        setFilteredEvents(filtered);

        // Reset selection if current event is filtered out
        if (selectedEvent && !filtered.find(e => e.id === selectedEvent.id)) {
            closeCard();
        }
    }, [selectedCategory, events, searchQuery]);

    // Animate card when event is selected/deselected
    useEffect(() => {
        Animated.spring(cardAnim, {
            toValue: selectedEvent ? 1 : 0,
            tension: 80,
            friction: 12,
            useNativeDriver: true,
        }).start();
    }, [selectedEvent]);

    const loadEvents = async () => {
        setIsLoading(true);
        try {
            const data = await eventService.getEvents();
            setEvents(data);
        } catch (error) {
            console.error("Failed to load events", error);
        } finally {
            setIsLoading(false);
        }
    };

    const handleEventPress = useCallback((eventId: string) => {
        const event = events.find(e => e.id === eventId);
        if (event) {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
            setSelectedEvent(event);
        }
    }, [events]);

    const closeCard = () => {
        setSelectedEvent(null);
    };

    const navigateToDetail = (event: any) => {
        navigation.navigate('AttEventoDetalle', { eventId: event.id });
    };

    /**
     * Opens Google Maps (Android) or Apple Maps (iOS) with real turn-by-turn directions
     * instead of drawing a fake straight line on the map
     */
    const handleGetDirections = (event: any) => {
        if (event.location?.coordinates) {
            mapRef.current?.openDirections(
                event.location.coordinates,
                event.title
            );
        }
    };

    // Transform events for MapView
    const mapEvents = filteredEvents
        .filter(e => e.location?.coordinates)
        .map(e => ({
            id: e.id,
            title: e.title,
            coordinates: e.location.coordinates,
            image: e.coverImage
        }));

    // Format date
    const formatDate = (dateString: string) => {
        if (!dateString) return 'Fecha por confirmar';
        const date = new Date(dateString);
        return date.toLocaleDateString('es-AR', {
            weekday: 'short',
            day: 'numeric',
            month: 'short'
        });
    };

    // Format time
    const formatTime = (dateString: string) => {
        if (!dateString) return '';
        const date = new Date(dateString);
        return date.toLocaleTimeString('es-AR', {
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    // Get lowest ticket price
    const getLowestPrice = (event: any) => {
        if (event.ticketTypes && event.ticketTypes.length > 0) {
            const lowest = Math.min(...event.ticketTypes.map((t: any) => t.price || 0));
            return lowest > 0 ? `$${lowest.toLocaleString()}` : 'Gratis';
        }
        if (event.price !== undefined) {
            return event.price > 0 ? `$${event.price.toLocaleString()}` : 'Gratis';
        }
        return null;
    };

    return (
        <View style={styles.container}>
            <StatusBar barStyle="light-content" />

            {/* Map */}
            <MapView
                ref={mapRef}
                style={styles.map}
                events={mapEvents}
                onMarkerPress={handleEventPress}
            />

            {/* Header */}
            <SafeAreaView style={styles.headerSafe} pointerEvents="box-none">
                <View style={styles.header}>
                    <View style={styles.headerMain}>
                        <Text style={styles.headerTitle}>¿Qué hacemos hoy?</Text>
                        <View style={styles.headerActions}>
                            {isLoading && (
                                <ActivityIndicator size="small" color="#00D9FF" style={{ marginRight: 12 }} />
                            )}
                            <TouchableOpacity
                                style={styles.locateBtn}
                                onPress={() => {
                                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                                    mapRef.current?.centerOnUser();
                                }}
                            >
                                <Ionicons name="locate" size={20} color="#00D9FF" />
                            </TouchableOpacity>
                        </View>
                    </View>

                    {/* Search Bar */}
                    <View style={styles.searchContainer}>
                        <Ionicons name="search" size={18} color="#666" />
                        <TextInput
                            style={styles.searchInput}
                            placeholder="Buscar eventos, lugares..."
                            placeholderTextColor="#666"
                            value={searchQuery}
                            onChangeText={setSearchQuery}
                        />
                        {searchQuery.length > 0 && (
                            <TouchableOpacity onPress={() => setSearchQuery('')}>
                                <Ionicons name="close-circle" size={18} color="#666" />
                            </TouchableOpacity>
                        )}
                    </View>

                    {/* Event Count Badge */}
                    {filteredEvents.length > 0 && (
                        <View style={styles.eventCountBadge}>
                            <Ionicons name="musical-notes" size={12} color="#00D9FF" />
                            <Text style={styles.eventCountText}>
                                {filteredEvents.length} evento{filteredEvents.length !== 1 ? 's' : ''} cerca
                                {selectedCategory !== "Todos" ? ` · ${selectedCategory}` : ''}
                            </Text>
                        </View>
                    )}
                </View>

                {/* Category Filters */}
                <ScrollView
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    style={styles.filtersScroll}
                    contentContainerStyle={styles.filtersContent}
                >
                    {EVENT_CATEGORIES.map((cat) => {
                        const isActive = selectedCategory === cat;
                        return (
                            <TouchableOpacity
                                key={cat}
                                style={[styles.chip, isActive && styles.chipActive]}
                                onPress={() => {
                                    Haptics.selectionAsync();
                                    setSelectedCategory(cat);
                                }}
                            >
                                <Text style={[styles.chipText, isActive && styles.chipTextActive]}>
                                    {cat}
                                </Text>
                            </TouchableOpacity>
                        );
                    })}
                </ScrollView>
            </SafeAreaView>

            {/* Event Detail Card (appears when a marker is tapped) */}
            <Animated.View
                style={[
                    styles.cardContainer,
                    {
                        transform: [{
                            translateY: cardAnim.interpolate({
                                inputRange: [0, 1],
                                outputRange: [300, 0],
                            })
                        }],
                        opacity: cardAnim,
                    }
                ]}
                pointerEvents={selectedEvent ? 'auto' : 'none'}
            >
                {selectedEvent && (
                    <View style={styles.card}>
                        {/* Close Button */}
                        <TouchableOpacity
                            style={styles.closeBtn}
                            onPress={() => {
                                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                                closeCard();
                            }}
                        >
                            <Ionicons name="close" size={18} color="#fff" />
                        </TouchableOpacity>

                        {/* Event Image */}
                        <Image
                            source={{ uri: selectedEvent.coverImage }}
                            style={styles.cardImage}
                        />
                        <LinearGradient
                            colors={['transparent', 'rgba(0,0,0,0.8)']}
                            style={styles.cardImageGradient}
                        />

                        {/* Price Badge on image */}
                        {getLowestPrice(selectedEvent) && (
                            <View style={styles.priceBadge}>
                                <Text style={styles.priceBadgeText}>
                                    {getLowestPrice(selectedEvent) === 'Gratis' ? '🎉 Gratis' : `Desde ${getLowestPrice(selectedEvent)}`}
                                </Text>
                            </View>
                        )}

                        {/* Content */}
                        <View style={styles.cardContent}>
                            <Text style={styles.cardTitle} numberOfLines={1}>
                                {selectedEvent.title}
                            </Text>

                            <View style={styles.cardMetaRow}>
                                <View style={styles.cardMeta}>
                                    <Ionicons name="calendar" size={13} color="#00D9FF" />
                                    <Text style={styles.cardMetaText}>
                                        {formatDate(selectedEvent.startDate)}
                                    </Text>
                                </View>
                                <View style={styles.cardMeta}>
                                    <Ionicons name="time" size={13} color="#00D9FF" />
                                    <Text style={styles.cardMetaText}>
                                        {formatTime(selectedEvent.startDate)}
                                    </Text>
                                </View>
                            </View>

                            <View style={styles.cardMeta}>
                                <Ionicons name="location" size={13} color="#888" />
                                <Text style={styles.cardLocation} numberOfLines={1}>
                                    {selectedEvent.location?.address || 'Sin dirección'}
                                </Text>
                            </View>

                            {/* Actions */}
                            <View style={styles.cardActions}>
                                <TouchableOpacity
                                    style={styles.directionsBtn}
                                    onPress={() => {
                                        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                                        handleGetDirections(selectedEvent);
                                    }}
                                >
                                    <Ionicons name="navigate" size={16} color="#00D9FF" />
                                    <Text style={styles.directionsBtnText}>Cómo llegar</Text>
                                </TouchableOpacity>

                                <TouchableOpacity
                                    style={styles.viewBtn}
                                    onPress={() => navigateToDetail(selectedEvent)}
                                >
                                    <Text style={styles.viewBtnText}>Ver Evento</Text>
                                    <Ionicons name="arrow-forward" size={16} color="#000" />
                                </TouchableOpacity>
                            </View>
                        </View>
                    </View>
                )}
            </Animated.View>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#000',
    },
    map: {
        flex: 1,
    },

    // Header
    headerSafe: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        zIndex: 10,
    },
    header: {
        marginHorizontal: 16,
        marginTop: Platform.OS === 'android' ? (StatusBar.currentHeight || 0) + 8 : 8,
        backgroundColor: 'rgba(10,10,10,0.92)',
        borderRadius: 20,
        padding: 16,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.08)',
    },
    headerMain: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    headerTitle: {
        color: '#fff',
        fontSize: 20,
        fontWeight: '800',
        letterSpacing: -0.5,
    },
    locateBtn: {
        width: 42,
        height: 42,
        borderRadius: 14,
        backgroundColor: 'rgba(0,217,255,0.12)',
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: 'rgba(0,217,255,0.25)',
    },
    headerActions: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    searchContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'rgba(255,255,255,0.06)',
        borderRadius: 14,
        paddingHorizontal: 12,
        paddingVertical: 10,
        marginTop: 12,
        gap: 8,
    },
    searchInput: {
        flex: 1,
        color: '#fff',
        fontSize: 15,
        padding: 0,
    },
    eventCountBadge: {
        alignSelf: 'flex-start',
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
        backgroundColor: 'rgba(0,217,255,0.12)',
        paddingHorizontal: 10,
        paddingVertical: 5,
        borderRadius: 12,
        marginTop: 10,
    },
    eventCountText: {
        color: '#00D9FF',
        fontSize: 12,
        fontWeight: '600',
    },

    // Filters
    filtersScroll: {
        marginTop: 12,
    },
    filtersContent: {
        paddingHorizontal: 16,
        gap: 8,
    },
    chip: {
        paddingHorizontal: 16,
        paddingVertical: 10,
        borderRadius: 20,
        backgroundColor: 'rgba(0,0,0,0.85)',
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.15)',
    },
    chipActive: {
        backgroundColor: '#00D9FF',
        borderColor: '#00D9FF',
    },
    chipText: {
        color: '#fff',
        fontSize: 13,
        fontWeight: '600',
    },
    chipTextActive: {
        color: '#000',
    },

    // Card
    cardContainer: {
        position: 'absolute',
        bottom: 100,
        left: 16,
        right: 16,
        zIndex: 20,
    },
    card: {
        backgroundColor: 'rgba(12,12,12,0.98)',
        borderRadius: 24,
        overflow: 'hidden',
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.1)',
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 12 },
        shadowOpacity: 0.5,
        shadowRadius: 20,
        elevation: 15,
    },
    closeBtn: {
        position: 'absolute',
        top: 12,
        right: 12,
        zIndex: 10,
        width: 32,
        height: 32,
        borderRadius: 16,
        backgroundColor: 'rgba(0,0,0,0.6)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    cardImage: {
        width: '100%',
        height: 140,
    },
    cardImageGradient: {
        position: 'absolute',
        left: 0,
        right: 0,
        top: 100,
        height: 40,
    },
    priceBadge: {
        position: 'absolute',
        top: 12,
        left: 12,
        backgroundColor: 'rgba(0,217,255,0.9)',
        paddingHorizontal: 10,
        paddingVertical: 5,
        borderRadius: 10,
    },
    priceBadgeText: {
        color: '#000',
        fontSize: 12,
        fontWeight: '800',
    },
    cardContent: {
        padding: 16,
        gap: 8,
    },
    cardTitle: {
        color: '#fff',
        fontSize: 18,
        fontWeight: '800',
        letterSpacing: -0.3,
    },
    cardMetaRow: {
        flexDirection: 'row',
        gap: 16,
    },
    cardMeta: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 5,
    },
    cardMetaText: {
        color: '#00D9FF',
        fontSize: 13,
        fontWeight: '600',
    },
    cardLocation: {
        color: '#888',
        fontSize: 13,
        flex: 1,
    },
    cardActions: {
        flexDirection: 'row',
        gap: 10,
        marginTop: 4,
    },
    directionsBtn: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 6,
        backgroundColor: 'rgba(0,217,255,0.12)',
        paddingVertical: 12,
        borderRadius: 14,
        borderWidth: 1,
        borderColor: 'rgba(0,217,255,0.25)',
    },
    directionsBtnText: {
        color: '#00D9FF',
        fontSize: 13,
        fontWeight: '700',
    },
    viewBtn: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 6,
        backgroundColor: '#00D9FF',
        paddingVertical: 12,
        borderRadius: 14,
    },
    viewBtnText: {
        color: '#000',
        fontSize: 13,
        fontWeight: '800',
    },
});

export default MapScreen;
