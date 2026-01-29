import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Image, TouchableOpacity, ScrollView, Dimensions, SafeAreaView, StatusBar, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { getEvents, EVENT_CATEGORIES } from '../../lib/mock-data';
import { useNavigation, useIsFocused } from '@react-navigation/native';
import MapView from '../../components/MapView';
import { BlurView } from 'expo-blur';
import * as Haptics from 'expo-haptics';
import FocusModeCard from '../../components/FocusModeCard';

const MapScreen = () => {
    const navigation = useNavigation<any>();
    const isFocused = useIsFocused();
    const [events, setEvents] = useState<any[]>([]);
    const [selectedCategory, setSelectedCategory] = useState("Todos");
    const [filteredEvents, setFilteredEvents] = useState<any[]>([]);
    const [selectedEvent, setSelectedEvent] = useState<any | null>(null);
    const [routeTo, setRouteTo] = useState<{ latitude: number; longitude: number } | null>(null);

    useEffect(() => {
        if (isFocused) {
            loadEvents();
        }
    }, [isFocused, selectedCategory]);

    const loadEvents = async () => {
        const data = await getEvents();
        setEvents(data);

        let filtered = data;
        if (selectedCategory !== "Todos") {
            filtered = data.filter(e => e.category === selectedCategory);
        }
        setFilteredEvents(filtered);

        // Reset selection if filter hides it
        if (selectedEvent && selectedCategory !== "Todos" && selectedEvent.category !== selectedCategory) {
            setSelectedEvent(null);
            setRouteTo(null);
        }
    };

    const handleEventPress = (eventId: string) => {
        const event = events.find(e => e.id === eventId);
        if (event) {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
            setSelectedEvent(event);
            setRouteTo(null); // Reset route when picking new event
        }
    };

    const handleCardPress = (event: any) => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        setSelectedEvent(event);
        setRouteTo(null);
    };

    const navigateToDetail = (event: any) => {
        navigation.navigate('AttEventoDetalle', { eventId: event.id });
    };

    return (
        <View style={styles.container}>
            <StatusBar barStyle="light-content" />

            {/* Reusable Map Component with Routing */}
            <MapView
                style={styles.map}
                events={filteredEvents}
                onMarkerPress={handleEventPress}
                initialLocation={{
                    latitude: -41.133472,
                    longitude: -71.310278,
                    zoom: 12
                }}
                routeTo={routeTo}
            />

            {/* Focus Mode Blur Overlay */}
            {selectedEvent && (
                <BlurView
                    style={StyleSheet.absoluteFill}
                    intensity={80}
                    tint="dark"
                    experimentalBlurMethod='dimezisBlurView' // Better performance
                />
            )}

            {/* Header Overlay - Hide in Focus Mode or Keep? User said "El mapa no desaparece, se oscurece". Header should probably stay but dimmed? Or just keep it. */}
            <SafeAreaView style={[styles.headerContainer, { opacity: selectedEvent ? 0.3 : 1 }]} pointerEvents={selectedEvent ? "none" : "auto"}>
                <View style={styles.headerGlass}>
                    <Text style={styles.headerTitle}>Mapa de Eventos</Text>
                    <TouchableOpacity style={styles.filterButton}>
                        <Ionicons name="filter" size={20} color="#000" />
                    </TouchableOpacity>
                </View>

                {/* Category Chips */}
                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chipsScroll} contentContainerStyle={styles.chipsContent}>
                    {EVENT_CATEGORIES.map((cat) => (
                        <TouchableOpacity
                            key={cat}
                            style={[styles.chip, selectedCategory === cat && styles.chipActive]}
                            onPress={() => setSelectedCategory(cat)}
                        >
                            <Text style={[styles.chipText, selectedCategory === cat && styles.chipTextActive]}>{cat}</Text>
                        </TouchableOpacity>
                    ))}
                </ScrollView>
            </SafeAreaView>

            {/* Focus Mode Card Centered */}
            {selectedEvent && (
                <View style={styles.focusModeContainer}>
                    <FocusModeCard
                        event={selectedEvent}
                        onPress={() => navigateToDetail(selectedEvent)}
                        onClose={() => setSelectedEvent(null)}
                    />
                </View>
            )}

            {/* Bottom Sheet List (Only when NO event is selected) */}
            {!selectedEvent && (
                <View style={styles.bottomSheet}>
                    <View style={styles.bottomHeader}>
                        <Text style={styles.bottomSheetTitle}>Eventos Cercanos</Text>
                        <Text style={styles.eventCount}>{filteredEvents.length} eventos</Text>
                    </View>
                    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 15, paddingRight: 20 }}>
                        {filteredEvents.map((event) => (
                            <TouchableOpacity key={event.id} style={styles.eventCard} onPress={() => handleCardPress(event)}>
                                <Image source={{ uri: event.coverImage }} style={styles.eventImage} />
                                <View style={styles.eventInfo}>
                                    <View style={styles.priceTag}>
                                        <Text style={styles.priceText}>${event.price}</Text>
                                    </View>
                                    <Text style={styles.eventTitle} numberOfLines={1}>{event.title}</Text>
                                    <Text style={styles.eventLocation} numberOfLines={1}>{event.location?.address || 'Sin dirección'}</Text>
                                </View>
                            </TouchableOpacity>
                        ))}
                    </ScrollView>
                </View>
            )}
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#000000',
    },
    map: {
        flex: 1,
    },
    headerContainer: {
        paddingTop: 10,
        paddingHorizontal: 20,
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        zIndex: 10, // Below FocusCard (zIndex implicit via View order or explicit)
    },
    headerGlass: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        backgroundColor: 'rgba(20,20,20,0.8)',
        padding: 15,
        borderRadius: 16,
        marginBottom: 10,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.1)',
    },
    headerTitle: {
        color: '#fff',
        fontSize: 18,
        fontWeight: 'bold',
    },
    filterButton: {
        backgroundColor: '#00D9FF',
        padding: 8,
        borderRadius: 10,
    },
    chipsScroll: {
        maxHeight: 50,
    },
    chipsContent: {
        paddingBottom: 10,
        gap: 8,
    },
    chip: {
        paddingHorizontal: 16,
        paddingVertical: 8,
        borderRadius: 20,
        backgroundColor: 'rgba(0,0,0,0.6)',
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.2)',
    },
    chipActive: {
        backgroundColor: '#00D9FF',
        borderColor: '#00D9FF',
    },
    chipText: {
        color: '#fff',
        fontSize: 12,
        fontWeight: '600',
    },
    chipTextActive: {
        color: '#000',
    },
    // Focus Mode
    focusModeContainer: {
        ...StyleSheet.absoluteFillObject,
        justifyContent: 'center',
        alignItems: 'center',
        zIndex: 20,
        paddingTop: 40, // Offset for status bar visually
    },
    // Bottom Sheet
    bottomSheet: {
        position: 'absolute',
        bottom: 20,
        left: 20,
        right: 20,
        backgroundColor: 'rgba(17,17,17,0.95)',
        borderRadius: 24,
        padding: 15,
        paddingBottom: 25,
        borderWidth: 1,
        borderColor: '#333',
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.5,
        shadowRadius: 20,
        elevation: 10,
    },
    bottomHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 15,
        paddingHorizontal: 5,
    },
    bottomSheetTitle: {
        color: '#fff',
        fontSize: 16,
        fontWeight: 'bold',
    },
    eventCount: {
        color: '#666',
        fontSize: 12,
    },
    eventCard: {
        width: 160,
        backgroundColor: '#222',
        borderRadius: 16,
        overflow: 'hidden',
    },
    eventImage: {
        width: '100%',
        height: 100,
    },
    eventInfo: {
        padding: 10,
    },
    priceTag: {
        position: 'absolute',
        top: -10,
        right: 10,
        backgroundColor: '#00D9FF',
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 8,
    },
    priceText: {
        color: '#000',
        fontSize: 12,
        fontWeight: 'bold',
    },
    eventTitle: {
        color: '#fff',
        fontSize: 14,
        fontWeight: 'bold',
        marginBottom: 4,
        marginTop: 4,
    },
    eventLocation: {
        color: '#888',
        fontSize: 12,
    },
});

export default MapScreen;
