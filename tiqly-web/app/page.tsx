"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Event } from "@/types";
import { getAllEvents } from "@/lib/mock-data";

function formatPrice(price: number): string {
    return new Intl.NumberFormat('es-AR', {
        style: 'currency',
        currency: 'ARS',
        minimumFractionDigits: 0
    }).format(price);
}

function formatDateShort(date: Date): string {
    const d = new Date(date);
    return `${d.getDate()}/${d.getMonth() + 1}`;
}

function formatTime(date: Date): string {
    const d = new Date(date);
    return d.toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' });
}

export default function HomePage() {
    const [events, setEvents] = useState<Event[]>([]);
    const [currentSlide, setCurrentSlide] = useState(0);

    useEffect(() => {
        setEvents(getAllEvents());
    }, []);

    const featuredEvents = events.slice(0, 3);
    const electronicEvents = events.filter(e => e.category === 'Fiesta Electrónica');
    const cachengueEvents = events.filter(e => e.category === 'Cachengue');

    // Auto-advance carousel
    useEffect(() => {
        if (featuredEvents.length <= 1) return;
        const timer = setInterval(() => {
            setCurrentSlide((prev) => (prev + 1) % featuredEvents.length);
        }, 5000);
        return () => clearInterval(timer);
    }, [featuredEvents.length]);

    const currentEvent = featuredEvents[currentSlide];

    return (
        <div className="min-h-screen bg-black">
            {/* ============ HERO SECTION ============ */}
            {currentEvent && (
                <section className="relative h-[70vh] min-h-[500px] max-h-[700px] w-full overflow-hidden">
                    {/* Background Image */}
                    <div className="absolute inset-0">
                        <img
                            src={currentEvent.coverImage}
                            alt={currentEvent.title}
                            className="w-full h-full object-cover"
                        />
                        {/* Dark overlay for readability */}
                        <div className="absolute inset-0 bg-gradient-to-t from-black via-black/70 to-black/40" />
                        <div className="absolute inset-0 bg-gradient-to-r from-black/60 via-transparent to-transparent" />
                    </div>

                    {/* Hero Content - Centered Container */}
                    <div className="absolute inset-0 flex items-end">
                        <div className="w-full max-w-[1200px] mx-auto px-6 pb-16">
                            {/* Category Badge */}
                            <span className="inline-block px-4 py-1.5 bg-[#D4FF00] text-black text-xs font-bold rounded-full mb-4">
                                {currentEvent.category}
                            </span>

                            {/* Title */}
                            <h1 className="text-4xl md:text-5xl lg:text-6xl font-black text-white mb-4 leading-tight max-w-3xl">
                                {currentEvent.title}
                            </h1>

                            {/* Description */}
                            <p className="text-gray-300 text-base md:text-lg mb-6 max-w-2xl leading-relaxed">
                                {currentEvent.description}
                            </p>

                            {/* Metadata Row */}
                            <div className="flex flex-wrap items-center gap-6 text-sm text-gray-300 mb-8">
                                <span className="flex items-center gap-2">
                                    <span className="text-[#D4FF00]">📍</span>
                                    {currentEvent.location.address}
                                </span>
                                <span className="flex items-center gap-2">
                                    <span className="text-[#D4FF00]">📅</span>
                                    {formatDateShort(currentEvent.startDate)}
                                </span>
                                <span className="flex items-center gap-2">
                                    <span className="text-[#D4FF00]">🕐</span>
                                    {formatTime(currentEvent.startDate)}
                                </span>
                                <span className="flex items-center gap-2 text-[#D4FF00] font-bold text-lg">
                                    {formatPrice(currentEvent.price)}
                                </span>
                            </div>

                            {/* Buttons */}
                            <div className="flex flex-wrap gap-4 mb-10">
                                <Link
                                    href={`/events/${currentEvent.id}`}
                                    className="px-8 py-3.5 bg-[#D4FF00] text-black font-bold rounded-full hover:bg-[#c4ef00] transition-all text-base"
                                >
                                    Ver Evento
                                </Link>
                                <Link
                                    href={`/events/${currentEvent.id}`}
                                    className="px-8 py-3.5 border-2 border-white/30 text-white font-medium rounded-full hover:bg-white/10 hover:border-white/50 transition-all text-base"
                                >
                                    Más Info
                                </Link>
                            </div>

                            {/* Carousel Dots */}
                            <div className="flex gap-3">
                                {featuredEvents.map((_, idx) => (
                                    <button
                                        key={idx}
                                        onClick={() => setCurrentSlide(idx)}
                                        className={`w-3 h-3 rounded-full transition-all ${idx === currentSlide
                                            ? "bg-[#D4FF00] w-8"
                                            : "bg-white/30 hover:bg-white/50"
                                            }`}
                                    />
                                ))}
                            </div>
                        </div>
                    </div>
                </section>
            )}

            {/* ============ SEARCH BAR ============ */}
            <section className="py-8">
                <div className="max-w-[1200px] mx-auto px-6">
                    <div className="flex gap-3 max-w-2xl">
                        <div className="flex-1 relative">
                            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400">🔍</span>
                            <input
                                type="text"
                                placeholder="Buscar eventos..."
                                className="w-full pl-12 pr-4 py-3.5 bg-white/5 border border-white/10 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-[#D4FF00]/50 focus:bg-white/10 transition-all"
                            />
                        </div>
                        <button className="px-6 py-3.5 bg-[#D4FF00] text-black font-bold rounded-xl hover:bg-[#c4ef00] transition-all">
                            Buscar
                        </button>
                    </div>
                </div>
            </section>

            {/* ============ FIESTA ELECTRÓNICA SECTION ============ */}
            {electronicEvents.length > 0 && (
                <section className="py-12 md:py-16">
                    <div className="max-w-[1200px] mx-auto px-6">
                        {/* Section Header */}
                        <div className="flex items-center justify-between mb-8">
                            <h2 className="text-2xl md:text-3xl font-bold flex items-center gap-3">
                                <span className="w-1 h-8 bg-[#D4FF00] rounded-full"></span>
                                Fiesta Electrónica
                            </h2>
                            <Link href="/?category=Fiesta+Electrónica" className="text-sm text-gray-400 hover:text-[#D4FF00] transition-colors">
                                Ver todos →
                            </Link>
                        </div>

                        {/* Events Grid - 3 columns desktop, 2 tablet, 1 mobile */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                            {electronicEvents.slice(0, 3).map((event) => (
                                <Link key={event.id} href={`/events/${event.id}`} className="group">
                                    <div className="bg-white/5 rounded-2xl overflow-hidden border border-white/10 hover:border-[#D4FF00]/30 transition-all hover:bg-white/10">
                                        {/* Image */}
                                        <div className="aspect-[16/10] overflow-hidden relative">
                                            <img
                                                src={event.coverImage}
                                                alt={event.title}
                                                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                                            />
                                            <div className="absolute top-3 left-3">
                                                <span className="px-3 py-1 bg-[#D4FF00] text-black text-xs font-bold rounded-full">
                                                    {event.category}
                                                </span>
                                            </div>
                                        </div>
                                        {/* Content */}
                                        <div className="p-5">
                                            <h3 className="font-bold text-lg text-white mb-2 group-hover:text-[#D4FF00] transition-colors line-clamp-1">
                                                {event.title}
                                            </h3>
                                            <p className="text-sm text-gray-400 mb-3 line-clamp-1">
                                                📍 {event.location.address}
                                            </p>
                                            <div className="flex items-center justify-between">
                                                <span className="text-sm text-gray-500">
                                                    📅 {formatDateShort(event.startDate)} • {formatTime(event.startDate)}
                                                </span>
                                                <span className="text-[#D4FF00] font-bold">
                                                    {formatPrice(event.price)}
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                </Link>
                            ))}
                        </div>
                    </div>
                </section>
            )}

            {/* ============ CACHENGUE SECTION ============ */}
            {cachengueEvents.length > 0 && (
                <section className="py-12 md:py-16 bg-white/[0.02]">
                    <div className="max-w-[1200px] mx-auto px-6">
                        {/* Section Header */}
                        <div className="flex items-center justify-between mb-8">
                            <h2 className="text-2xl md:text-3xl font-bold flex items-center gap-3">
                                <span className="w-1 h-8 bg-[#D4FF00] rounded-full"></span>
                                Cachengue
                            </h2>
                            <Link href="/?category=Cachengue" className="text-sm text-gray-400 hover:text-[#D4FF00] transition-colors">
                                Ver todos →
                            </Link>
                        </div>

                        {/* Events Grid */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                            {cachengueEvents.slice(0, 3).map((event) => (
                                <Link key={event.id} href={`/events/${event.id}`} className="group">
                                    <div className="bg-white/5 rounded-2xl overflow-hidden border border-white/10 hover:border-[#D4FF00]/30 transition-all hover:bg-white/10">
                                        {/* Image */}
                                        <div className="aspect-[16/10] overflow-hidden relative">
                                            <img
                                                src={event.coverImage}
                                                alt={event.title}
                                                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                                            />
                                            <div className="absolute top-3 left-3">
                                                <span className="px-3 py-1 bg-[#D4FF00] text-black text-xs font-bold rounded-full">
                                                    {event.category}
                                                </span>
                                            </div>
                                        </div>
                                        {/* Content */}
                                        <div className="p-5">
                                            <h3 className="font-bold text-lg text-white mb-2 group-hover:text-[#D4FF00] transition-colors line-clamp-1">
                                                {event.title}
                                            </h3>
                                            <p className="text-sm text-gray-400 mb-3 line-clamp-1">
                                                📍 {event.location.address}
                                            </p>
                                            <div className="flex items-center justify-between">
                                                <span className="text-sm text-gray-500">
                                                    📅 {formatDateShort(event.startDate)} • {formatTime(event.startDate)}
                                                </span>
                                                <span className="text-[#D4FF00] font-bold">
                                                    {formatPrice(event.price)}
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                </Link>
                            ))}
                        </div>
                    </div>
                </section>
            )}

            {/* ============ ALL EVENTS SECTION ============ */}
            <section className="py-12 md:py-16">
                <div className="max-w-[1200px] mx-auto px-6">
                    {/* Section Header */}
                    <div className="flex items-center justify-between mb-8">
                        <h2 className="text-2xl md:text-3xl font-bold flex items-center gap-3">
                            <span className="w-1 h-8 bg-[#D4FF00] rounded-full"></span>
                            Todos los Eventos
                        </h2>
                    </div>

                    {/* Events Grid */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                        {events.map((event) => (
                            <Link key={event.id} href={`/events/${event.id}`} className="group">
                                <div className="bg-white/5 rounded-2xl overflow-hidden border border-white/10 hover:border-[#D4FF00]/30 transition-all hover:bg-white/10">
                                    {/* Image */}
                                    <div className="aspect-[16/10] overflow-hidden relative">
                                        <img
                                            src={event.coverImage}
                                            alt={event.title}
                                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                                        />
                                        <div className="absolute top-3 left-3">
                                            <span className="px-3 py-1 bg-[#D4FF00] text-black text-xs font-bold rounded-full">
                                                {event.category}
                                            </span>
                                        </div>
                                    </div>
                                    {/* Content */}
                                    <div className="p-5">
                                        <h3 className="font-bold text-lg text-white mb-2 group-hover:text-[#D4FF00] transition-colors line-clamp-1">
                                            {event.title}
                                        </h3>
                                        <p className="text-sm text-gray-400 mb-3 line-clamp-1">
                                            📍 {event.location.address}
                                        </p>
                                        <div className="flex items-center justify-between">
                                            <span className="text-sm text-gray-500">
                                                📅 {formatDateShort(event.startDate)} • {formatTime(event.startDate)}
                                            </span>
                                            <span className="text-[#D4FF00] font-bold">
                                                {formatPrice(event.price)}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            </Link>
                        ))}
                    </div>
                </div>
            </section>
        </div>
    );
}
