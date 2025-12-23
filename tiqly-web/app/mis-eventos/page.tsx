"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Event } from "@/types/event";
import { getUserFromStorage, getEventsByUser } from "@/lib/mock-data";

function formatDate(date: Date): string {
    return new Intl.DateTimeFormat('es-AR', {
        weekday: 'short',
        day: 'numeric',
        month: 'short',
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

export default function MisEventosPage() {
    const router = useRouter();
    const [events, setEvents] = useState<Event[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [showModal, setShowModal] = useState<{ type: 'tickets' | 'rrpp'; eventId: string } | null>(null);

    useEffect(() => {
        const user = getUserFromStorage();
        if (!user) {
            router.push("/login");
            return;
        }

        const userEvents = getEventsByUser(user.id);
        setEvents(userEvents);
        setIsLoading(false);
    }, [router]);

    // Mock data for modals
    const mockTicketsSold = [
        { id: 1, name: "Juan Pérez", email: "juan@mail.com", date: "20/12/2024", type: "General" },
        { id: 2, name: "María García", email: "maria@mail.com", date: "21/12/2024", type: "VIP" },
        { id: 3, name: "Tu  vieja en 4 ", email: "carlos@mail.com", date: "21/12/2024", type: "General" },
    ];

    const mockRRPP = [
        { id: 1, name: "Pablo RRPP", sales: 15, commission: 7500 },
        { id: 2, name: "Laura Promo", sales: 8, commission: 4000 },
    ];

    if (isLoading) {
        return (
            <div className="min-h-[60vh] flex items-center justify-center">
                <div className="animate-spin w-8 h-8 border-2 border-[#D4FF00] border-t-transparent rounded-full"></div>
            </div>
        );
    }

    return (
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <div className="flex items-center justify-between mb-8">
                <div>
                    <h1 className="text-3xl font-bold mb-2">Mis Eventos</h1>
                    <p className="text-gray-400">Eventos que has creado</p>
                </div>
                <Link href="/crear-evento" className="btn-accent">
                    + Crear Evento
                </Link>
            </div>

            {events.length === 0 ? (
                <div className="text-center py-16 card">
                    <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-white/5 flex items-center justify-center">
                        <svg className="w-8 h-8 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                    </div>
                    <h3 className="text-lg font-medium mb-2">No has creado eventos aún</h3>
                    <p className="text-gray-400 mb-6">Crea tu primer evento y empieza a vender entradas</p>
                    <Link href="/crear-evento" className="btn-accent">
                        Crear mi primer evento
                    </Link>
                </div>
            ) : (
                <div className="grid gap-6">
                    {events.map((event) => (
                        <div key={event.id} className="card overflow-hidden">
                            <div className="flex flex-col lg:flex-row">
                                {/* Event Image */}
                                <div className="lg:w-64 h-48 lg:h-auto flex-shrink-0">
                                    <img
                                        src={event.coverImage || '/placeholder-event.jpg'}
                                        alt={event.title}
                                        className="w-full h-full object-cover"
                                    />
                                </div>

                                {/* Event Info */}
                                <div className="flex-1 p-6">
                                    <div className="flex items-start justify-between mb-4">
                                        <div>
                                            <span className="badge badge-accent mb-2">{event.category}</span>
                                            <h3 className="text-xl font-bold">{event.title}</h3>
                                        </div>
                                        <span className="text-lg font-bold text-[#D4FF00]">
                                            {formatPrice(event.price)}
                                        </span>
                                    </div>

                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm mb-6">
                                        <div className="flex items-center gap-2 text-gray-300">
                                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                            </svg>
                                            <span className="capitalize">{formatDate(event.startDate)}</span>
                                        </div>
                                        <div className="flex items-center gap-2 text-gray-400">
                                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                                            </svg>
                                            <span>{event.location.address}</span>
                                        </div>
                                    </div>

                                    {/* Actions */}
                                    <div className="flex flex-wrap gap-3">
                                        <Link
                                            href={`/events/${event.id}`}
                                            className="px-4 py-2 bg-[#D4FF00] text-black font-medium rounded-lg hover:bg-[#b8dd00] transition-colors"
                                        >
                                            Ver Evento
                                        </Link>
                                        <button
                                            onClick={() => setShowModal({ type: 'tickets', eventId: event.id })}
                                            className="px-4 py-2 bg-white/10 text-white font-medium rounded-lg hover:bg-white/20 transition-colors"
                                        >
                                            📊 Ver Tickets Vendidos
                                        </button>
                                        <button
                                            onClick={() => setShowModal({ type: 'rrpp', eventId: event.id })}
                                            className="px-4 py-2 bg-white/10 text-white font-medium rounded-lg hover:bg-white/20 transition-colors"
                                        >
                                            👥 Ver RRPP
                                        </button>
                                    </div>
                                </div>

                                {/* Stats Sidebar */}
                                <div className="lg:w-48 bg-white/5 p-6 border-t lg:border-t-0 lg:border-l border-white/10">
                                    <div className="space-y-4 text-center">
                                        <div>
                                            <p className="text-2xl font-bold text-[#D4FF00]">23</p>
                                            <p className="text-xs text-gray-400">Tickets vendidos</p>
                                        </div>
                                        <div>
                                            <p className="text-xl font-bold">$575.000</p>
                                            <p className="text-xs text-gray-400">Recaudado</p>
                                        </div>
                                        <div>
                                            <p className="text-lg font-medium text-green-400">Activo</p>
                                            <p className="text-xs text-gray-400">Estado</p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Modal: Tickets Vendidos */}
            {showModal?.type === 'tickets' && (
                <div
                    className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4"
                    onClick={() => setShowModal(null)}
                >
                    <div
                        className="bg-[#111] rounded-2xl p-6 max-w-lg w-full max-h-[80vh] overflow-auto"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div className="flex items-center justify-between mb-6">
                            <h3 className="text-xl font-bold">Tickets Vendidos</h3>
                            <button
                                onClick={() => setShowModal(null)}
                                className="p-2 hover:bg-white/10 rounded-lg transition-colors"
                            >
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                </svg>
                            </button>
                        </div>

                        <div className="space-y-3">
                            {mockTicketsSold.map((ticket) => (
                                <div key={ticket.id} className="p-4 bg-white/5 rounded-lg">
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <p className="font-medium">{ticket.name}</p>
                                            <p className="text-sm text-gray-400">{ticket.email}</p>
                                        </div>
                                        <div className="text-right">
                                            <span className="badge badge-outline text-xs">{ticket.type}</span>
                                            <p className="text-xs text-gray-500 mt-1">{ticket.date}</p>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>

                        <div className="mt-6 p-4 bg-purple-500/10 rounded-lg border border-purple-500/20">
                            <p className="text-sm text-purple-300 text-center">
                                Demo: Datos de ejemplo - En producción se conectaría con el backend
                            </p>
                        </div>
                    </div>
                </div>
            )}

            {/* Modal: RRPP */}
            {showModal?.type === 'rrpp' && (
                <div
                    className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4"
                    onClick={() => setShowModal(null)}
                >
                    <div
                        className="bg-[#111] rounded-2xl p-6 max-w-lg w-full"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div className="flex items-center justify-between mb-6">
                            <h3 className="text-xl font-bold">Mis RRPP</h3>
                            <button
                                onClick={() => setShowModal(null)}
                                className="p-2 hover:bg-white/10 rounded-lg transition-colors"
                            >
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                </svg>
                            </button>
                        </div>

                        <div className="space-y-3">
                            {mockRRPP.map((rrpp) => (
                                <div key={rrpp.id} className="p-4 bg-white/5 rounded-lg flex items-center justify-between">
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center font-bold">
                                            {rrpp.name.charAt(0)}
                                        </div>
                                        <div>
                                            <p className="font-medium">{rrpp.name}</p>
                                            <p className="text-sm text-gray-400">{rrpp.sales} ventas</p>
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <p className="font-bold text-[#D4FF00]">${rrpp.commission.toLocaleString()}</p>
                                        <p className="text-xs text-gray-500">Comisión</p>
                                    </div>
                                </div>
                            ))}
                        </div>

                        <button className="w-full mt-6 py-3 border border-dashed border-white/20 rounded-lg text-gray-400 hover:text-white hover:border-white/40 transition-colors">
                            + Invitar RRPP
                        </button>

                        <div className="mt-4 p-4 bg-purple-500/10 rounded-lg border border-purple-500/20">
                            <p className="text-sm text-purple-300 text-center">
                                Demo: Funcionalidad mock para demostración
                            </p>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
