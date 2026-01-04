"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { getUserFromStorage, clearUserFromStorage, getTicketsByUser, getEventsByUser } from "@/lib/mock-data";

export default function PerfilPage() {
    const router = useRouter();
    const [user, setUser] = useState<{ id: string; name: string; email: string; avatar: string } | null>(null);
    const [stats, setStats] = useState({ tickets: 0, events: 0 });

    useEffect(() => {
        const storedUser = getUserFromStorage();
        if (!storedUser) {
            router.push("/login");
            return;
        }
        setUser(storedUser);

        // Get stats
        const tickets = getTicketsByUser(storedUser.id);
        const events = getEventsByUser(storedUser.id);
        setStats({ tickets: tickets.length, events: events.length });
    }, [router]);

    const handleLogout = () => {
        clearUserFromStorage();
        router.push("/");
        router.refresh();
    };

    if (!user) {
        return (
            <div className="min-h-[60vh] flex items-center justify-center">
                <div className="animate-spin w-8 h-8 border-2 border-[#D4FF00] border-t-transparent rounded-full"></div>
            </div>
        );
    }

    return (
        <div className="min-h-[calc(100vh-180px)] flex items-start justify-center px-4 py-8">
            <div className="w-full max-w-md">
                {/* Profile Header */}
                <div className="card p-6 text-center mb-6">
                    <div className="w-24 h-24 mx-auto mb-4 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-4xl font-bold">
                        {user.name.charAt(0).toUpperCase()}
                    </div>
                    <h1 className="text-2xl font-bold mb-1">{user.name}</h1>
                    <p className="text-gray-400">{user.email}</p>
                </div>

                {/* Stats */}
                <div className="grid grid-cols-2 gap-4 mb-6">
                    <div className="card p-6 text-center">
                        <p className="text-3xl font-bold text-[#D4FF00]">{stats.tickets}</p>
                        <p className="text-sm text-gray-400">Tickets comprados</p>
                    </div>
                    <div className="card p-6 text-center">
                        <p className="text-3xl font-bold text-[#D4FF00]">{stats.events}</p>
                        <p className="text-sm text-gray-400">Eventos creados</p>
                    </div>
                </div>

                {/* Quick Links */}
                <div className="card overflow-hidden mb-6">
                    <Link
                        href="/mis-tickets"
                        className="flex items-center justify-between p-4 hover:bg-white/5 transition-colors border-b border-white/10"
                    >
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-lg bg-purple-500/20 flex items-center justify-center">
                                <svg className="w-5 h-5 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 5v2m0 4v2m0 4v2M5 5a2 2 0 00-2 2v3a2 2 0 110 4v3a2 2 0 002 2h14a2 2 0 002-2v-3a2 2 0 110-4V7a2 2 0 00-2-2H5z" />
                                </svg>
                            </div>
                            <span className="font-medium">Mis Tickets</span>
                        </div>
                        <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                        </svg>
                    </Link>

                    <Link
                        href="/mis-eventos"
                        className="flex items-center justify-between p-4 hover:bg-white/5 transition-colors border-b border-white/10"
                    >
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-lg bg-pink-500/20 flex items-center justify-center">
                                <svg className="w-5 h-5 text-pink-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                </svg>
                            </div>
                            <span className="font-medium">Mis Eventos</span>
                        </div>
                        <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                        </svg>
                    </Link>

                    <Link
                        href="/crear-evento"
                        className="flex items-center justify-between p-4 hover:bg-white/5 transition-colors"
                    >
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-lg bg-[#D4FF00]/20 flex items-center justify-center">
                                <svg className="w-5 h-5 text-[#D4FF00]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                                </svg>
                            </div>
                            <span className="font-medium">Crear Evento</span>
                        </div>
                        <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                        </svg>
                    </Link>
                </div>

                {/* Logout */}
                <button
                    onClick={handleLogout}
                    className="w-full py-3 text-red-400 hover:text-red-300 hover:bg-red-500/10 rounded-xl transition-colors"
                >
                    Cerrar Sesión
                </button>

                {/* Demo Note */}
                <div className="mt-6 p-4 rounded-xl bg-purple-500/10 border border-purple-500/20">
                    <p className="text-sm text-purple-300 text-center">
                        <strong>Demo:</strong> Los datos se guardan en localStorage del navegador
                    </p>
                </div>
            </div>
        </div>
    );
}
