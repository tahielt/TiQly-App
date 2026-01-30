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
    Alert,
    Animated,
    Platform
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { EVENT_CATEGORIES } from '../../lib/mock-data';
import { eventService } from '../../services/eventService';
import { useNavigation, useIsFocused } from '@react-navigation/native';
import MapView from '../../components/MapView';
import { BlurView } from 'expo-blur';
import * as Haptics from 'expo-haptics';
import FocusModeCard from '../../components/FocusModeCard';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

const MapScreen = () => {
    const navigation = useNavigation<any>();
    const isFocused = useIsFocused();
    const mapRef = useRef<any>(null);

    // Data State
    const [events, setEvents] = useState<any[]>([]);
    const [selectedCategory, setSelectedCategory] = useState("Todos");
    const [filteredEvents, setFilteredEvents] = useState<any[]>([]);
    const [selectedEvent, setSelectedEvent] = useState<any | null>(null);
    const [routeTo, setRouteTo] = useState<{ latitude: number; longitude: number } | null>(null);

    // Card Animation
    const cardAnim = useRef(new Animated.Value(0)).current;

    // Load events when screen is focused
    useEffect(() => {
        if (isFocused) {
            loadEvents();
        }
    }, [isFocused]);

    // Filter events based on category
    useEffect(() => {
        let filtered = events;
        if (selectedCategory !== "Todos") {
            filtered = filtered.filter(e => e.category === selectedCategory);
        }
        setFilteredEvents(filtered);

        // Reset selection if current event is filtered out
        if (selectedEvent && !filtered.find(e => e.id === selectedEvent.id)) {
            closeCard();
        }
    }, [selectedCategory, events]);

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
        try {
            const data = await eventService.getEvents();
            setEvents(data);
        } catch (error) {
            console.error("Failed to load events", error);
        }
    };

    const handleEventPress = useCallback((eventId: string) => {
        const event = events.find(e => e.id === eventId);
        if (event) {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
            setSelectedEvent(event);
            setRouteTo(null);
        }
    }, [events]);

    const closeCard = () => {
        setSelectedEvent(null);
        setRouteTo(null);
    };

    const navigateToDetail = (event: any) => {
        navigation.navigate('AttEventoDetalle', { eventId: event.id });
    };

    const handleGetDirections = (event: any) => {
        if (event.location?.coordinates) {
            setRouteTo(event.location.coordinates);
        } else {
            Alert.alert("Error", "Este evento no tiene ubicación válida");
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
    return (
        <View style={styles.container}>
            <StatusBar barStyle="light-content" />

            {/* Map */}
            <MapView
                ref={mapRef}
                style={styles.map}
                events={mapEvents}
                onMarkerPress={handleEventPress}
                initialLocation={{
                    latitude: -41.133472,
                    longitude: -71.310278,
                    zoom: 12
                }}
                routeTo={routeTo}
            />

            {/* Header */}
            <SafeAreaView style={styles.headerSafe} pointerEvents="box-none">
                <View style={styles.header}>
                    <View style={styles.headerMain}>
                        <Text style={styles.headerTitle}>¿Qué hacemos hoy?</Text>
                        <TouchableOpacity
                            style={styles.locateBtn}
                            onPress={() => mapRef.current?.centerOnUser()}
                        >
                            <Ionicons name="locate" size={20} color="#00D9FF" />
                        </TouchableOpacity>
                    </View>
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
                                onPress={() => setSelectedCategory(cat)}
                            >
                                <Text style={[styles.chipText, isActive && styles.chipTextActive]}>
                                    {cat}
                                </Text>
                            </TouchableOpacity>
                        );
                    })}
                </ScrollView>
            </SafeAreaView>

            {/* Compact Event Card */}
            <Animated.View
                style={[
                    styles.cardContainer,
                    {
                        transform: [{
                            translateY: cardAnim.interpolate({
                                inputRange: [0, 1],
                                outputRange: [200, 0],
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
                            onPress={closeCard}
                        >
                            <Ionicons name="close" size={20} color="#fff" />
                        </TouchableOpacity>

                        {/* Event Image */}
                        <Image
                            source={{ uri: selectedEvent.coverImage }}
                            style={styles.cardImage}
                        />

                        {/* Content */}
                        <View style={styles.cardContent}>
                            <View style={styles.cardInfo}>
                                <Text style={styles.cardTitle} numberOfLines={1}>
                                    {selectedEvent.title}
                                </Text>

                                <View style={styles.cardMeta}>
                                    <Ionicons name="location" size={14} color="#888" />
                                    <Text style={styles.cardLocation} numberOfLines={1}>
                                        {selectedEvent.location?.address || 'Sin dirección'}
                                    </Text>
                                </View>

                                <Text style={styles.cardDate}>
                                    {formatDate(selectedEvent.startDate)}
                                </Text>
                            </View>

                            {/* Actions */}
                            <View style={styles.cardActions}>
                                <TouchableOpacity
                                    style={styles.directionsBtn}
                                    onPress={() => handleGetDirections(selectedEvent)}
                                >
                                    <Ionicons name="navigate-outline" size={16} color="#000" />
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
        zIndex: 10, // Below FocusCard (zIndex implicit via View order or explicit)
    },
    header: {
        marginHorizontal: 20,
        marginTop: Platform.OS === 'android' ? (StatusBar.currentHeight || 0) + 10 : 10,
        backgroundColor: 'rgba(20,20,20,0.9)',
        borderRadius: 16,
        padding: 16,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.1)',
    },
    headerMain: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    headerTitle: {
        color: '#fff',
        fontSize: 20,
        fontWeight: '700',
    },
    locateBtn: {
        width: 40,
        height: 40,
        borderRadius: 12,
        backgroundColor: 'rgba(0,217,255,0.15)',
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: 'rgba(0,217,255,0.3)',
    },

    // Filters
    filtersScroll: {
        marginTop: 12,
    },
    filtersContent: {
        paddingHorizontal: 20,
        gap: 8,
    },
    chip: {
        paddingHorizontal: 16,
        paddingVertical: 10,
        borderRadius: 20,
        backgroundColor: 'rgba(0,0,0,0.8)',
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.2)',
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
        left: 20,
        right: 20,
        zIndex: 20,
    },
    card: {
        backgroundColor: 'rgba(17,17,17,0.98)',
        borderRadius: 20,
        flexDirection: 'row',
        padding: 12,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.1)',
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.4,
        shadowRadius: 16,
        elevation: 10,
    },
    closeBtn: {
        position: 'absolute',
        top: 8,
        right: 8,
        zIndex: 10,
        width: 28,
        height: 28,
        borderRadius: 14,
        backgroundColor: 'rgba(0,0,0,0.6)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    cardImage: {
        width: 90,
        height: 90,
        borderRadius: 14,
    },
    cardContent: {
        flex: 1,
        marginLeft: 14,
        justifyContent: 'space-between',
    },
    cardInfo: {
        gap: 4,
    },
    cardTitle: {
        color: '#fff',
        fontSize: 17,
        fontWeight: '700',
    },
    cardMeta: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
    },
    cardLocation: {
        color: '#888',
        fontSize: 13,
        flex: 1,
    },
    cardDate: {
        color: '#00D9FF',
        fontSize: 13,
        fontWeight: '600',
    },
    cardActions: {
        flexDirection: 'row',
        gap: 8,
        marginTop: 8,
    },
    directionsBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
        backgroundColor: '#fff',
        paddingVertical: 8,
        paddingHorizontal: 12,
        borderRadius: 12,
    },
    directionsBtnText: {
        color: '#000',
        fontSize: 12,
        fontWeight: '600',
    },
    viewBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
        backgroundColor: '#00D9FF',
        paddingVertical: 8,
        paddingHorizontal: 14,
        borderRadius: 12,
    },
    viewBtnText: {
        color: '#000',
        fontSize: 12,
        fontWeight: '700',
    },
});

export default MapScreen;
