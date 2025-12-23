"use client";

import { useState, useEffect, use } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Event } from "@/types";
import { getEventById, getUserFromStorage, purchaseTicket } from "@/lib/mock-data";

function formatDate(date: Date): string {
    return new Intl.DateTimeFormat('es-AR', {
        weekday: 'long',
        day: 'numeric',
        month: 'long',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    }).format(new Date(date));
}

function formatPrice(price: number): string {
    return new Intl.NumberFormat('es-AR', {
        style: 'currency',
        currency: 'ARS',
        minimumFractionDigits: 0
    }).format(price);
}

export default function EventDetailPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = use(params);
    const router = useRouter();
    const [event, setEvent] = useState<Event | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isPurchasing, setIsPurchasing] = useState(false);
    const [showSuccess, setShowSuccess] = useState(false);

    useEffect(() => {
        const eventData = getEventById(id);
        setEvent(eventData || null);
        setIsLoading(false);
    }, [id]);

    const handlePurchase = async () => {
        const user = getUserFromStorage();
        if (!user) {
            router.push("/login");
            return;
        }

        setIsPurchasing(true);

        // Simulate payment processing
        await new Promise(resolve => setTimeout(resolve, 1500));

        const result = purchaseTicket(id, user.id, user.name, user.email);

        if (result.success) {
            setShowSuccess(true);
            setTimeout(() => {
                router.push("/mis-tickets");
            }, 2000);
        } else {
            alert(result.message);
        }

        setIsPurchasing(false);
    };

    if (isLoading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="animate-spin w-8 h-8 border-2 border-[#D4FF00] border-t-transparent rounded-full"></div>
            </div>
        );
    }

    if (!event) {
        return (
            <div className="min-h-[60vh] flex items-center justify-center">
                <div className="text-center max-w-md mx-auto px-4">
                    <h1 className="text-2xl font-bold mb-4">Evento no encontrado</h1>
                    <p className="text-gray-400 mb-8">El evento que buscas no existe o fue eliminado.</p>
                    <Link href="/" className="btn-accent">
                        Volver al inicio
                    </Link>
                </div>
            </div>
        );
    }

    if (showSuccess) {
        return (
            <div className="min-h-[60vh] flex items-center justify-center">
                <div className="text-center">
                    <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-green-500/20 flex items-center justify-center">
                        <svg className="w-10 h-10 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                    </div>
                    <h1 className="text-3xl font-bold mb-2">¡Compra Exitosa!</h1>
                    <p className="text-gray-400 mb-4">Tu entrada fue generada correctamente</p>
                    <p className="text-sm text-gray-500">Redirigiendo a Mis Tickets...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen">
            {/* Hero Image */}
            <div className="relative h-[40vh] md:h-[50vh] w-full">
                <img
                    src={event.coverImage || '/placeholder-event.jpg'}
                    alt={event.title}
                    className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black via-black/50 to-transparent" />

                {/* Back Button */}
                <div className="absolute top-4 left-4 z-10">
                    <Link
                        href="/"
                        className="inline-flex items-center gap-2 px-4 py-2 bg-black/50 backdrop-blur-sm rounded-full text-white hover:bg-black/70 transition-colors"
                    >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                        </svg>
                        Volver
                    </Link>
                </div>

                {/* Category Badge */}
                <div className="absolute top-4 right-4">
                    <span className="badge badge-accent">{event.category}</span>
                </div>
            </div>

            {/* Content */}
            <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 -mt-20 relative z-10 pb-16">
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* Event Info - Left Column */}
                    <div className="lg:col-span-2 space-y-6">
                        {/* Title Card */}
                        <div className="card p-6 md:p-8">
                            <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold mb-4">{event.title}</h1>
                            <p className="text-gray-300 text-base md:text-lg leading-relaxed">{event.description}</p>
                        </div>

                        {/* Event Details Card */}
                        <div className="card p-6 md:p-8">
                            <h3 className="font-bold text-lg mb-6">Detalles del Evento</h3>

                            <div className="space-y-5">
                                <div className="flex items-start gap-4">
                                    <div className="w-12 h-12 rounded-xl bg-[#D4FF00]/10 flex items-center justify-center flex-shrink-0">
                                        <svg className="w-6 h-6 text-[#D4FF00]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                        </svg>
                                    </div>
                                    <div>
                                        <p className="font-semibold text-white">Fecha y Hora</p>
                                        <p className="text-gray-400 capitalize">{formatDate(event.startDate)}</p>
                                    </div>
                                </div>

                                <div className="flex items-start gap-4">
                                    <div className="w-12 h-12 rounded-xl bg-[#D4FF00]/10 flex items-center justify-center flex-shrink-0">
                                        <svg className="w-6 h-6 text-[#D4FF00]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                                        </svg>
                                    </div>
                                    <div>
                                        <p className="font-semibold text-white">Ubicación</p>
                                        <p className="text-gray-400">{event.location.address}, {event.location.city}</p>
                                    </div>
                                </div>

                                <div className="flex items-start gap-4">
                                    <div className="w-12 h-12 rounded-xl bg-[#D4FF00]/10 flex items-center justify-center flex-shrink-0">
                                        <svg className="w-6 h-6 text-[#D4FF00]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                                        </svg>
                                    </div>
                                    <div>
                                        <p className="font-semibold text-white">Organizador</p>
                                        <p className="text-gray-400">{event.organizerName}</p>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Tags */}
                        {event.tags && event.tags.length > 0 && (
                            <div className="flex flex-wrap gap-2">
                                {event.tags.map((tag) => (
                                    <span key={tag} className="badge badge-outline">
                                        #{tag}
                                    </span>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Purchase Card - Right Column */}
                    <div className="lg:col-span-1">
                        <div className="card p-6 md:p-8 sticky top-24">
                            <div className="text-center mb-6">
                                <p className="text-sm text-gray-400 mb-2">Precio por entrada</p>
                                <p className="text-4xl md:text-5xl font-black text-[#D4FF00]">{formatPrice(event.price)}</p>
                            </div>

                            <div className="space-y-3 mb-6 text-sm">
                                <div className="flex justify-between">
                                    <span className="text-gray-400">Entrada General</span>
                                    <span className="text-white">{formatPrice(event.price)}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-gray-400">Cargo por servicio</span>
                                    <span className="text-white">{formatPrice(Math.round(event.price * 0.15))}</span>
                                </div>
                                <hr className="border-white/10" />
                                <div className="flex justify-between font-bold text-base">
                                    <span>Total</span>
                                    <span>{formatPrice(Math.round(event.price * 1.15))}</span>
                                </div>
                            </div>

                            <button
                                onClick={handlePurchase}
                                disabled={isPurchasing}
                                className="w-full btn-accent py-4 text-lg disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {isPurchasing ? (
                                    <span className="flex items-center justify-center gap-2">
                                        <svg className="animate-spin w-5 h-5" fill="none" viewBox="0 0 24 24">
                                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                        </svg>
                                        Procesando...
                                    </span>
                                ) : (
                                    "Comprar Entrada"
                                )}
                            </button>

                            <p className="text-center text-xs text-gray-500 mt-4">
                                Al comprar aceptas los términos y condiciones
                            </p>

                            {/* Demo Note */}
                            <div className="mt-4 p-3 rounded-lg bg-purple-500/10 border border-purple-500/20">
                                <p className="text-xs text-purple-300 text-center">
                                    Demo: La compra se guarda en localStorage
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
