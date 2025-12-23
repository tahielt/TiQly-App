"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Event } from "@/types";

interface FeaturedCarouselProps {
    events: Event[];
}

export default function FeaturedCarousel({ events }: FeaturedCarouselProps) {
    const [currentIndex, setCurrentIndex] = useState(0);

    // Auto-advance
    useEffect(() => {
        if (events.length <= 1) return;

        const timer = setInterval(() => {
            setCurrentIndex((prev) => (prev + 1) % events.length);
        }, 5000);

        return () => clearInterval(timer);
    }, [events.length]);

    if (!events || events.length === 0) return null;

    const currentEvent = events[currentIndex];

    return (
        <div className="relative w-full h-[500px] md:h-[600px] rounded-3xl overflow-hidden shadow-2xl shadow-[#D4FF00]/10 mb-12 group">
            {/* Background Image with Gradient Overlay */}
            <div className="absolute inset-0">
                <img
                    src={currentEvent.coverImage || '/placeholder-event.jpg'}
                    alt={currentEvent.title}
                    className="w-full h-full object-cover transition-transform duration-700 ease-out scale-105 group-hover:scale-110"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black via-black/50 to-transparent" />
                <div className="absolute inset-0 bg-black/20" />
            </div>

            {/* Content */}
            <div className="absolute bottom-0 left-0 w-full p-8 md:p-12 z-10 flex flex-col items-start gap-4">
                <span className="px-4 py-1.5 bg-[#D4FF00] text-black font-bold uppercase tracking-wider text-xs rounded-full">
                    {currentEvent.category}
                </span>

                <h2 className="text-4xl md:text-6xl font-black text-white leading-tight max-w-4xl drop-shadow-lg">
                    {currentEvent.title}
                </h2>

                <p className="text-gray-200 text-lg max-w-2xl line-clamp-2 mb-4 drop-shadow-md">
                    {currentEvent.description}
                </p>

                <div className="flex gap-4">
                    <Link
                        href={`/events/${currentEvent.id}`}
                        className="px-8 py-3.5 bg-[#D4FF00] hover:bg-[#b8dd00] text-black font-bold rounded-xl transition-all transform hover:scale-105 shadow-[0_0_20px_rgba(212,255,0,0.3)]"
                    >
                        Ver Evento
                    </Link>
                    <Link
                        href={`/events/${currentEvent.id}`}
                        className="px-8 py-3.5 bg-white/10 hover:bg-white/20 backdrop-blur-md text-white border border-white/20 font-bold rounded-xl transition-all"
                    >
                        Más Info
                    </Link>
                </div>
            </div>

            {/* Indicators */}
            <div className="absolute bottom-8 right-8 z-20 flex gap-2">
                {events.map((_, idx) => (
                    <button
                        key={idx}
                        onClick={() => setCurrentIndex(idx)}
                        className={`h-1.5 rounded-full transition-all duration-300 ${idx === currentIndex ? "w-8 bg-[#D4FF00]" : "w-2 bg-white/50 hover:bg-white"
                            }`}
                        aria-label={`Go to slide ${idx + 1}`}
                    />
                ))}
            </div>
        </div>
    );
}
