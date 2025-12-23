"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Ticket } from "@/types";
import { getUserFromStorage, getTicketsByUser } from "@/lib/mock-data";

function formatDate(date: Date): string {
    return new Intl.DateTimeFormat('es-AR', {
        weekday: 'short',
        day: 'numeric',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    }).format(new Date(date));
}

function generateQRDataUrl(code: string): string {
    // Simple SVG QR placeholder
    const svg = `
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" width="150" height="150">
            <rect width="100" height="100" fill="white"/>
            <rect x="10" y="10" width="20" height="20" fill="black"/>
            <rect x="70" y="10" width="20" height="20" fill="black"/>
            <rect x="10" y="70" width="20" height="20" fill="black"/>
            <rect x="35" y="10" width="5" height="5" fill="black"/>
            <rect x="45" y="10" width="5" height="5" fill="black"/>
            <rect x="55" y="10" width="5" height="5" fill="black"/>
            <rect x="35" y="20" width="5" height="5" fill="black"/>
            <rect x="50" y="20" width="5" height="5" fill="black"/>
            <rect x="10" y="35" width="5" height="5" fill="black"/>
            <rect x="20" y="40" width="5" height="5" fill="black"/>
            <rect x="35" y="35" width="30" height="30" fill="black"/>
            <rect x="40" y="40" width="20" height="20" fill="white"/>
            <rect x="45" y="45" width="10" height="10" fill="black"/>
            <rect x="70" y="35" width="5" height="5" fill="black"/>
            <rect x="80" y="45" width="5" height="5" fill="black"/>
            <rect x="35" y="70" width="5" height="5" fill="black"/>
            <rect x="45" y="75" width="5" height="5" fill="black"/>
            <rect x="55" y="70" width="5" height="5" fill="black"/>
            <rect x="70" y="70" width="20" height="20" fill="black"/>
            <rect x="75" y="75" width="10" height="10" fill="white"/>
            <rect x="78" y="78" width="4" height="4" fill="black"/>
            <text x="50" y="98" text-anchor="middle" font-size="5" fill="black">${code.substring(0, 12)}</text>
        </svg>
    `;
    return `data:image/svg+xml;base64,${btoa(svg)}`;
}

export default function MisTicketsPage() {
    const router = useRouter();
    const [tickets, setTickets] = useState<Ticket[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [selectedTicket, setSelectedTicket] = useState<Ticket | null>(null);

    useEffect(() => {
        const user = getUserFromStorage();
        if (!user) {
            router.push("/login");
            return;
        }

        const userTickets = getTicketsByUser(user.id);
        setTickets(userTickets);
        setIsLoading(false);
    }, [router]);

    if (isLoading) {
        return (
            <div className="min-h-[60vh] flex items-center justify-center">
                <div className="animate-spin w-8 h-8 border-2 border-[#D4FF00] border-t-transparent rounded-full"></div>
            </div>
        );
    }

    return (
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <h1 className="text-3xl font-bold mb-2">Mis Tickets</h1>
            <p className="text-gray-400 mb-8">Tus entradas para próximos eventos</p>

            {tickets.length === 0 ? (
                <div className="text-center py-16 card">
                    <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-white/5 flex items-center justify-center">
                        <svg className="w-8 h-8 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 5v2m0 4v2m0 4v2M5 5a2 2 0 00-2 2v3a2 2 0 110 4v3a2 2 0 002 2h14a2 2 0 002-2v-3a2 2 0 110-4V7a2 2 0 00-2-2H5z" />
                        </svg>
                    </div>
                    <h3 className="text-lg font-medium mb-2">No tenés tickets aún</h3>
                    <p className="text-gray-400 mb-6">Explorá eventos y compra tu primera entrada</p>
                    <Link href="/" className="btn-accent">
                        Ver Eventos
                    </Link>
                </div>
            ) : (
                <div className="space-y-4">
                    {tickets.map((ticket) => (
                        <div key={ticket.id} className="card overflow-hidden">
                            <div className="flex flex-col md:flex-row">
                                {/* Left: Ticket Info */}
                                <div className="flex-1 p-6">
                                    <div className="flex items-start justify-between mb-4">
                                        <div>
                                            <span className={`badge ${ticket.status === 'active' ? 'bg-green-500/20 text-green-400' : 'badge-outline'}`}>
                                                {ticket.status === 'active' ? 'Activo' : ticket.status}
                                            </span>
                                        </div>
                                        <span className="text-sm text-gray-500">
                                            #{ticket.id.split('_')[1]}
                                        </span>
                                    </div>

                                    <h3 className="text-xl font-bold mb-2">{ticket.eventTitle}</h3>

                                    <div className="space-y-2 text-sm">
                                        <div className="flex items-center gap-2 text-gray-300">
                                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                            </svg>
                                            <span className="capitalize">{formatDate(ticket.eventDate)}</span>
                                        </div>
                                        <div className="flex items-center gap-2 text-gray-400">
                                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                                            </svg>
                                            <span>{ticket.eventLocation}</span>
                                        </div>
                                        <div className="flex items-center gap-2 text-gray-400">
                                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 5v2m0 4v2m0 4v2M5 5a2 2 0 00-2 2v3a2 2 0 110 4v3a2 2 0 002 2h14a2 2 0 002-2v-3a2 2 0 110-4V7a2 2 0 00-2-2H5z" />
                                            </svg>
                                            <span>{ticket.ticketTypeName}</span>
                                        </div>
                                    </div>
                                </div>

                                {/* Right: QR Code */}
                                <div className="bg-white/5 p-6 flex flex-col items-center justify-center border-t md:border-t-0 md:border-l border-white/10">
                                    <button
                                        onClick={() => setSelectedTicket(ticket)}
                                        className="block hover:scale-105 transition-transform"
                                    >
                                        <img
                                            src={generateQRDataUrl(ticket.qrCode)}
                                            alt="QR Code"
                                            className="w-24 h-24 rounded-lg"
                                        />
                                    </button>
                                    <p className="text-xs text-gray-500 mt-2">Toca para ampliar</p>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* QR Modal */}
            {selectedTicket && (
                <div
                    className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4"
                    onClick={() => setSelectedTicket(null)}
                >
                    <div
                        className="bg-[#111] rounded-2xl p-8 max-w-sm w-full text-center"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <h3 className="text-xl font-bold mb-2">{selectedTicket.eventTitle}</h3>
                        <p className="text-gray-400 text-sm mb-6">{selectedTicket.ticketTypeName}</p>

                        <div className="bg-white p-4 rounded-xl inline-block mb-6">
                            <img
                                src={generateQRDataUrl(selectedTicket.qrCode)}
                                alt="QR Code"
                                className="w-48 h-48"
                            />
                        </div>

                        <p className="text-sm font-mono text-gray-400 mb-6">
                            {selectedTicket.qrCode}
                        </p>

                        <button
                            onClick={() => setSelectedTicket(null)}
                            className="btn-accent w-full"
                        >
                            Cerrar
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}
