import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Image, TouchableOpacity, ScrollView, Dimensions, SafeAreaView, StatusBar, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { getEvents, EVENT_CATEGORIES } from '../../lib/mock-data';
import { useNavigation, useIsFocused } from '@react-navigation/native';
import MapView from '../../components/MapView';

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
            setSelectedEvent(event);
            setRouteTo(null); // Reset route when picking new event
        }
    };

    const handleCardPress = (event: any) => {
        setSelectedEvent(event);
        setRouteTo(null);
    };

    const navigateToDetail = (event: any) => {
        navigation.navigate('AttEventoDetalle', { eventId: event.id });
    };

    const handleGetDirections = (event: any) => {
        if (event.location && event.location.coordinates) {
            setRouteTo(event.location.coordinates);
            Alert.alert("Ruta Trazada", "Se ha marcado el camino hacia " + event.title);
        } else {
            Alert.alert("Error", "Este evento no tiene ubicación válida");
        }
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

            {/* Header Overlay */}
            <SafeAreaView style={styles.headerContainer} pointerEvents="box-none">
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

            {/* Bottom Sheet / Event List */}
            <View style={styles.bottomSheet}>
                {selectedEvent ? (
                    <View style={styles.selectedEventCard}>
                        <TouchableOpacity style={styles.closeButton} onPress={() => { setSelectedEvent(null); setRouteTo(null); }}>
                            <Ionicons name="close" size={20} color="#fff" />
                        </TouchableOpacity>
                        <Image source={{ uri: selectedEvent.coverImage }} style={styles.selectedImage} />
                        <View style={styles.selectedContent}>
                            <View style={{ flex: 1 }}>
                                <Text style={styles.selectedTitle} numberOfLines={1}>{selectedEvent.title}</Text>
                                <Text style={styles.selectedLocation} numberOfLines={1}>
                                    <Ionicons name="location" size={12} color="#888" /> {selectedEvent.location?.address || 'Sin dirección'}
                                </Text>
                                <Text style={styles.selectedDate}>
                                    {new Date(selectedEvent.startDate).toLocaleDateString('es-AR', { weekday: 'short', day: 'numeric', month: 'short' })}
                                </Text>
                            </View>
                            <View style={styles.actionButtons}>
                                <TouchableOpacity style={styles.routeButton} onPress={() => handleGetDirections(selectedEvent)}>
                                    <Ionicons name="navigate-outline" size={16} color="#000" />
                                    <Text style={styles.routeButtonText}>Cómo llegar</Text>
                                </TouchableOpacity>

                                <TouchableOpacity style={styles.viewEventButton} onPress={() => navigateToDetail(selectedEvent)}>
                                    <Text style={styles.viewEventText}>Ver Evento</Text>
                                    <Ionicons name="arrow-forward" size={16} color="#000" />
                                </TouchableOpacity>
                            </View>
                        </View>
                    </View>
                ) : (
                    <>
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
                    </>
                )}
            </View>
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
    headerContainer: {
        paddingTop: 10,
        paddingHorizontal: 20,
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        zIndex: 10,
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
        backgroundColor: '#D4FF00',
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
        backgroundColor: '#D4FF00',
        borderColor: '#D4FF00',
    },
    chipText: {
        color: '#fff',
        fontSize: 12,
        fontWeight: '600',
    },
    chipTextActive: {
        color: '#000',
    },
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
        backgroundColor: '#D4FF00',
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
    selectedEventCard: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
    },
    closeButton: {
        position: 'absolute',
        top: -10,
        right: -10,
        padding: 5,
        zIndex: 10,
    },
    selectedImage: {
        width: 80,
        height: 80,
        borderRadius: 12,
    },
    selectedContent: {
        flex: 1,
        height: 80,
        justifyContent: 'space-between',
    },
    selectedTitle: {
        color: '#fff',
        fontSize: 16,
        fontWeight: 'bold',
    },
    selectedLocation: {
        color: '#aaa',
        fontSize: 12,
        marginTop: 2,
    },
    selectedDate: {
        color: '#D4FF00',
        fontSize: 12,
        fontWeight: 'bold',
        marginTop: 2,
    },
    actionButtons: {
        flexDirection: 'row',
        gap: 8,
        marginTop: 4,
    },
    viewEventButton: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#D4FF00',
        paddingVertical: 6,
        paddingHorizontal: 12,
        borderRadius: 20,
        gap: 4,
    },
    viewEventText: {
        color: '#000',
        fontSize: 10,
        fontWeight: 'bold',
    },
    routeButton: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#fff',
        paddingVertical: 6,
        paddingHorizontal: 12,
        borderRadius: 20,
        gap: 4,
    },
    routeButtonText: {
        color: '#000',
        fontSize: 10,
        fontWeight: 'bold',
    }
});

export default MapScreen;
