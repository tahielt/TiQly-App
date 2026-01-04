"use client";

import dynamic from 'next/dynamic';
import React from 'react';

// Export types from the implementation file
export type { MapItem, Location } from './MapLeaflet';

const Map = dynamic(() => import('./MapLeaflet'), {
    ssr: false,
    loading: () => (
        <div className="w-full h-full bg-white/5 rounded-2xl animate-pulse flex items-center justify-center border border-white/10">
            <span className="text-gray-400 text-sm">Cargando mapa...</span>
        </div>
    )
});

export default Map;
