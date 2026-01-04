"use client";

import React, { useEffect, useRef, useState } from "react";
import {
    MapContainer,
    Marker,
    TileLayer,
    useMapEvents,
    useMap,
    Popup
} from "react-leaflet";
import type { LatLngLiteral } from "leaflet";
import "leaflet/dist/leaflet.css";
import L from "leaflet";

// Fix for Leaflet icons in Next.js
const createDefaultIcon = () => {
    return L.icon({
        iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
        iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
        shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
        iconSize: [25, 41],
        iconAnchor: [12, 41],
        popupAnchor: [1, -34],
        shadowSize: [41, 41],
    });
};

export type Location = {
    lat: number;
    lng: number;
};

// Map items/markers to display
export type MapItem = {
    id: string;
    lat: number;
    lng: number;
    title?: string;
    description?: string;
};

type MapProps = {
    center?: Location;
    zoom?: number;
    height?: string;
    interactive?: boolean;
    onChange?: (loc: Location) => void;
    markerPosition?: Location;
    items?: MapItem[]; // List of items to display
};

// Component to handle clicks
function ClickHandler({ onSelect }: { onSelect: (c: LatLngLiteral) => void }) {
    useMapEvents({
        click(e) {
            onSelect(e.latlng);
        },
    });
    return null;
}

// Component to update map center
function MapUpdater({ center }: { center: LatLngLiteral }) {
    const map = useMap();
    useEffect(() => {
        map.setView(center, map.getZoom());
    }, [center.lat, center.lng, map]);
    return null;
}

const MapComponent = ({
    center = { lat: -41.13, lng: -71.31 }, // Bariloche default
    zoom = 13,
    height = "h-96",
    interactive = false,
    onChange,
    markerPosition,
    items = []
}: MapProps) => {
    const [marker, setMarker] = useState<LatLngLiteral | null>(null);
    const defaultIcon = useRef<L.Icon | null>(null);

    useEffect(() => {
        // Client-side only
        defaultIcon.current = createDefaultIcon();
    }, []);

    const handleSelect = (coords: LatLngLiteral) => {
        if (!interactive) return;
        setMarker(coords);
        onChange?.({ lat: coords.lat, lng: coords.lng });
    };

    const markerPos = markerPosition
        ? { lat: markerPosition.lat, lng: markerPosition.lng }
        : marker;

    const effectiveCenter = markerPosition
        ? { lat: markerPosition.lat, lng: markerPosition.lng }
        : { lat: center.lat, lng: center.lng };

    if (!defaultIcon.current) return null; // Wait for icon to initiate

    return (
        <div className={`w-full relative z-0 ${height}`}>
            <style jsx global>{`
                .leaflet-popup-content-wrapper {
                    background: #1E1E1E;
                    color: white;
                    border: 1px solid rgba(255, 255, 255, 0.1);
                    border-radius: 12px;
                }
                .leaflet-popup-tip {
                    background: #1E1E1E;
                    border: 1px solid rgba(255, 255, 255, 0.1);
                    border-top: none;
                    border-left: none;
                }
                .leaflet-container {
                    background: #000;
                }
            `}</style>
            <MapContainer
                center={effectiveCenter}
                zoom={zoom}
                className={`w-full h-full rounded-md border shadow-sm`}
                scrollWheelZoom={true}
            >
                {/* Dark Theme Tiles */}
                <TileLayer
                    attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
                    url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
                />

                {markerPosition && <MapUpdater center={effectiveCenter} />}
                {interactive && <ClickHandler onSelect={handleSelect} />}

                {/* Single Marker Mode */}
                {markerPos && (
                    <Marker position={markerPos} icon={defaultIcon.current} />
                )}

                {/* Multiple Items Mode */}
                {items.map((item) => (
                    <Marker
                        key={item.id}
                        position={{ lat: item.lat, lng: item.lng }}
                        icon={defaultIcon.current!}
                    >
                        <Popup>
                            <div className="p-2 min-w-[200px]">
                                <div className="flex items-center justify-between mb-2">
                                    <span className="text-[10px] font-bold bg-[#D4FF00] text-black px-2 py-0.5 rounded-full uppercase">
                                        Evento
                                    </span>
                                </div>
                                <h3 className="font-bold text-base text-white mb-1">{item.title}</h3>
                                {item.description && (
                                    <div className="flex items-start gap-1 text-xs text-gray-400 mb-2">
                                        <span>📍</span>
                                        <span>{item.description}</span>
                                    </div>
                                )}
                                <a
                                    href={`/events/${item.id}`}
                                    className="block w-full bg-[#D4FF00] hover:bg-[#b8dd00] text-black text-xs font-bold py-1.5 rounded-lg transition-colors text-center"
                                >
                                    Ver Evento
                                </a>
                            </div>
                        </Popup>
                    </Marker>
                ))}
            </MapContainer>
        </div>
    );
};

export default MapComponent;
