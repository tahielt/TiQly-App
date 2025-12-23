"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { useState, useEffect } from "react";

export default function Header() {
    const pathname = usePathname();
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const [user, setUser] = useState<{ name: string; email: string } | null>(null);

    useEffect(() => {
        const storedUser = localStorage.getItem("tiqly_user");
        if (storedUser) {
            setUser(JSON.parse(storedUser));
        }
    }, []);

    const navLinks = [
        { href: "/", label: "Eventos" },
        { href: "/mapa", label: "Mapa" },
        { href: "/mis-tickets", label: "Mis Tickets" },
        { href: "/mis-eventos", label: "Mis Eventos" },
    ];

    const isActive = (href: string) => {
        if (href === "/") return pathname === "/";
        return pathname.startsWith(href);
    };

    return (
        <header className="fixed top-0 left-0 right-0 z-50 bg-black/95 backdrop-blur-md border-b border-white/10">
            <div className="w-full max-w-[1200px] mx-auto px-6">
                <div className="flex items-center h-16">
                    {/* Logo - Left */}
                    <Link href="/" className="flex items-center gap-2 mr-auto">
                        <img src="/logo.svg" alt="TiQly" className="h-8" />
                    </Link>

                    {/* Navigation - Center */}
                    <nav className="hidden md:flex items-center gap-1 absolute left-1/2 transform -translate-x-1/2">
                        {navLinks.map((link) => (
                            <Link
                                key={link.href}
                                href={link.href}
                                className={`px-4 py-2 text-sm font-medium rounded-lg transition-all ${isActive(link.href)
                                        ? "text-white bg-white/10"
                                        : "text-gray-400 hover:text-white hover:bg-white/5"
                                    }`}
                            >
                                {link.label}
                            </Link>
                        ))}
                    </nav>

                    {/* Right Actions */}
                    <div className="hidden md:flex items-center gap-3 ml-auto">
                        <Link
                            href="/crear-evento"
                            className="px-5 py-2 text-sm font-bold text-black bg-[#D4FF00] rounded-full hover:bg-[#c4ef00] transition-all"
                        >
                            + Crear Evento
                        </Link>
                        {user ? (
                            <Link href="/perfil" className="flex items-center gap-2">
                                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center font-bold text-sm">
                                    {user.name.charAt(0).toUpperCase()}
                                </div>
                                <span className="text-sm text-gray-300">{user.name.split(" ")[0]}</span>
                            </Link>
                        ) : (
                            <Link href="/login" className="px-4 py-2 text-sm text-gray-300 hover:text-white">
                                Ingresar
                            </Link>
                        )}
                    </div>

                    {/* Mobile Menu Button */}
                    <button
                        onClick={() => setIsMenuOpen(!isMenuOpen)}
                        className="md:hidden p-2 ml-auto"
                    >
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            {isMenuOpen ? (
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            ) : (
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                            )}
                        </svg>
                    </button>
                </div>
            </div>

            {/* Mobile Menu */}
            {isMenuOpen && (
                <div className="md:hidden bg-black border-t border-white/10 px-6 py-4">
                    <nav className="flex flex-col gap-2">
                        {navLinks.map((link) => (
                            <Link
                                key={link.href}
                                href={link.href}
                                onClick={() => setIsMenuOpen(false)}
                                className={`px-4 py-3 rounded-lg ${isActive(link.href) ? "text-white bg-white/10" : "text-gray-400"
                                    }`}
                            >
                                {link.label}
                            </Link>
                        ))}
                        <hr className="border-white/10 my-2" />
                        <Link
                            href="/crear-evento"
                            onClick={() => setIsMenuOpen(false)}
                            className="px-4 py-3 text-[#D4FF00] font-bold"
                        >
                            + Crear Evento
                        </Link>
                        {!user && (
                            <Link href="/login" onClick={() => setIsMenuOpen(false)} className="px-4 py-3 text-gray-400">
                                Ingresar
                            </Link>
                        )}
                    </nav>
                </div>
            )}
        </header>
    );
}
