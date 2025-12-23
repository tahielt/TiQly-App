"use client";

import { useState, useEffect } from "react";
import dynamic from "next/dynamic";
import Link from "next/link";
import { Event } from "@/types";
import { getAllEvents, EVENT_CATEGORIES } from "@/lib/mock-data";

// Dynamic import of MapComponent to avoid SSR issues with Leaflet
const MapComponent = dynamic(
    () => import("@/components/ui/MapLeaflet"),
    {
        ssr: false,
        loading: () => (
            <div className="w-full h-full bg-black/50 flex items-center justify-center">
                <div className="animate-spin w-8 h-8 border-2 border-[#D4FF00] border-t-transparent rounded-full"></div>
            </div>
        )
    }
);

function formatDate(date: Date): string {
    const d = new Date(date);
    return `${d.getDate()}/${d.getMonth() + 1}`;
}

function formatTime(date: Date): string {
    const d = new Date(date);
    return d.toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' });
}

function formatPrice(price: number): string {
    return new Intl.NumberFormat('es-AR', {
        style: 'currency',
        currency: 'ARS',
        minimumFractionDigits: 0
    }).format(price);
}

// Calculate distance in km between two coordinates (Haversine formula)
function calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
    const R = 6371; // Earth radius in km
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
        Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
}

// Convert km to walking time (avg 5 km/h walking speed)
function getWalkingTime(distanceKm: number): string {
    const minutes = Math.round(distanceKm * 12); // ~5km/h = 12 min per km
    if (minutes < 60) return `${minutes} min`;
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${hours}h ${mins}min`;
}

export default function MapaPage() {
    const [events, setEvents] = useState<Event[]>([]);
    const [selectedCategory, setSelectedCategory] = useState("Todos");
    const [selectedEvent, setSelectedEvent] = useState<Event | null>(null);
    const [showFilters, setShowFilters] = useState(false);
    const [userLocation, setUserLocation] = useState<{ lat: number, lng: number } | null>(null);

    // Get user location
    useEffect(() => {
        if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition(
                (position) => {
                    setUserLocation({
                        lat: position.coords.latitude,
                        lng: position.coords.longitude
                    });
                },
                () => {
                    // Default to Bariloche if location denied
                    setUserLocation({ lat: -41.133, lng: -71.31 });
                }
            );
        } else {
            setUserLocation({ lat: -41.133, lng: -71.31 });
        }
    }, []);

    useEffect(() => {
        setEvents(getAllEvents());
    }, []);

    const filteredEvents = events.filter(event => {
        if (selectedCategory === "Todos") return true;
        return event.category === selectedCategory;
    });

    // Convert events to map items format
    const mapItems = filteredEvents
        .filter(e => e.location.coordinates)
        .map(event => ({
            id: event.id,
            lat: event.location.coordinates!.latitude,
            lng: event.location.coordinates!.longitude,
            title: event.title,
            description: event.location.address
        }));

    const handleEventSelect = (eventId: string) => {
        const event = events.find(e => e.id === eventId);
        setSelectedEvent(event || null);
    };

    return (
        <div className="relative h-[calc(100vh-64px)]">
            {/* Map */}
            <div className="absolute inset-0">
                <MapComponent
                    center={{ lat: -41.133, lng: -71.31 }}
                    zoom={13}
                    height="h-full"
                    items={mapItems}
                />
            </div>

            {/* Header Overlay */}
            <div className="absolute top-0 left-0 right-0 z-10 p-4">
                <div className="max-w-7xl mx-auto flex items-center justify-between">
                    {/* Title */}
                    <div className="glass px-4 py-2 rounded-xl">
                        <h1 className="text-lg font-bold">Mapa de Eventos</h1>
                        <p className="text-xs text-gray-400">{filteredEvents.length} eventos encontrados</p>
                    </div>

                    {/* Filter Toggle */}
                    <button
                        onClick={() => setShowFilters(!showFilters)}
                        className="glass px-4 py-2 rounded-xl flex items-center gap-2 hover:bg-white/10 transition-colors"
                    >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
                        </svg>
                        Filtrar
                    </button>
                </div>
            </div>

            {/* Filters Panel */}
            {showFilters && (
                <div className="absolute top-20 right-4 z-20 glass p-4 rounded-xl w-64">
                    <div className="flex items-center justify-between mb-4">
                        <h3 className="font-bold">Categorías</h3>
                        <button
                            onClick={() => setShowFilters(false)}
                            className="p-1 hover:bg-white/10 rounded-lg"
                        >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        </button>
                    </div>
                    <div className="space-y-2">
                        {EVENT_CATEGORIES.map((category) => (
                            <button
                                key={category}
                                onClick={() => {
                                    setSelectedCategory(category);
                                    setShowFilters(false);
                                }}
                                className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-all ${selectedCategory === category
                                    ? "bg-[#D4FF00] text-black font-medium"
                                    : "hover:bg-white/10"
                                    }`}
                            >
                                {category}
                            </button>
                        ))}
                    </div>
                </div>
            )}

            {/* Category Pills (mobile friendly) */}
            <div className="absolute bottom-24 left-0 right-0 z-10 px-4 overflow-x-auto">
                <div className="flex gap-2 justify-center pb-2">
                    {EVENT_CATEGORIES.slice(0, 5).map((category) => (
                        <button
                            key={category}
                            onClick={() => setSelectedCategory(category)}
                            className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-all ${selectedCategory === category
                                ? "bg-[#D4FF00] text-black"
                                : "glass hover:bg-white/20"
                                }`}
                        >
                            {category}
                        </button>
                    ))}
                </div>
            </div>

            {/* Events List (side panel) */}
            <div className="absolute bottom-4 left-4 right-4 z-10 lg:left-auto lg:right-4 lg:top-20 lg:bottom-4 lg:w-80">
                <div className="glass rounded-xl max-h-64 lg:max-h-full overflow-hidden flex flex-col">
                    <div className="p-3 border-b border-white/10">
                        <h3 className="font-bold text-sm">Eventos Cercanos</h3>
                    </div>
                    <div className="overflow-y-auto flex-1">
                        {filteredEvents.length === 0 ? (
                            <div className="p-4 text-center text-gray-400 text-sm">
                                No hay eventos en esta categoría
                            </div>
                        ) : (
                            <div className="divide-y divide-white/5">
                                {filteredEvents.slice(0, 6).map((event) => (
                                    <Link
                                        key={event.id}
                                        href={`/events/${event.id}`}
                                        className="flex gap-3 p-3 hover:bg-white/5 transition-colors"
                                    >
                                        <div className="w-16 h-16 rounded-lg overflow-hidden flex-shrink-0">
                                            <img
                                                src={event.coverImage || '/placeholder.jpg'}
                                                alt={event.title}
                                                className="w-full h-full object-cover"
                                            />
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <h4 className="font-medium text-sm line-clamp-1">{event.title}</h4>
                                            <div className="flex items-center gap-2 text-xs text-gray-400 mt-1">
                                                <span>📅 {formatDate(event.startDate)}</span>
                                                <span>🕐 {formatTime(event.startDate)}</span>
                                            </div>
                                            <div className="flex items-center justify-between mt-1">
                                                <span className="text-xs font-bold text-[#D4FF00]">
                                                    {formatPrice(event.price)}
                                                </span>
                                                {userLocation && event.location.coordinates && (
                                                    <span className="text-xs text-purple-400">
                                                        🚶 {getWalkingTime(calculateDistance(
                                                            userLocation.lat,
                                                            userLocation.lng,
                                                            event.location.coordinates.latitude,
                                                            event.location.coordinates.longitude
                                                        ))}
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                    </Link>
                                ))}
                            </div>
                        )}
                    </div>
                    {filteredEvents.length > 6 && (
                        <div className="p-3 border-t border-white/10 text-center">
                            <Link href="/" className="text-sm text-[#D4FF00] hover:underline">
                                Ver todos los eventos →
                            </Link>
                        </div>
                    )}
                </div>
            </div>

            {/* Selected Event Detail Modal */}
            {selectedEvent && (
                <div
                    className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-sm"
                    onClick={() => setSelectedEvent(null)}
                >
                    <div
                        className="bg-[#111] rounded-t-2xl sm:rounded-2xl w-full sm:max-w-md max-h-[80vh] overflow-auto"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div className="aspect-video relative">
                            <img
                                src={selectedEvent.coverImage || '/placeholder.jpg'}
                                alt={selectedEvent.title}
                                className="w-full h-full object-cover"
                            />
                            <button
                                onClick={() => setSelectedEvent(null)}
                                className="absolute top-3 right-3 p-2 bg-black/50 rounded-full hover:bg-black/70"
                            >
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                </svg>
                            </button>
                            <div className="absolute bottom-3 left-3">
                                <span className="badge badge-accent">{selectedEvent.category}</span>
                            </div>
                        </div>
                        <div className="p-6">
                            <h2 className="text-xl font-bold mb-2">{selectedEvent.title}</h2>
                            <p className="text-gray-400 text-sm mb-4 line-clamp-2">{selectedEvent.description}</p>

                            <div className="space-y-2 mb-6">
                                <div className="flex items-center gap-2 text-sm text-gray-300">
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                    </svg>
                                    <span className="capitalize">{formatDate(selectedEvent.startDate)}</span>
                                </div>
                                <div className="flex items-center gap-2 text-sm text-gray-400">
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                                    </svg>
                                    <span>{selectedEvent.location.address}</span>
                                </div>
                            </div>

                            <div className="flex items-center justify-between">
                                <span className="text-2xl font-bold text-[#D4FF00]">
                                    {formatPrice(selectedEvent.price)}
                                </span>
                                <Link
                                    href={`/events/${selectedEvent.id}`}
                                    className="btn-accent"
                                >
                                    Ver Evento
                                </Link>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
