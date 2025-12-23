"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { MOCK_USER, saveUserToStorage } from "@/lib/mock-data";

export default function LoginPage() {
    const router = useRouter();
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState("");

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        setError("");

        // Simulate network delay
        await new Promise(resolve => setTimeout(resolve, 800));

        // Mock login - accept any credentials
        if (email && password) {
            const user = {
                ...MOCK_USER,
                email: email,
                name: email.split("@")[0].replace(/[._]/g, " ").split(" ").map(
                    word => word.charAt(0).toUpperCase() + word.slice(1)
                ).join(" ")
            };
            saveUserToStorage(user);
            router.push("/");
            router.refresh();
        } else {
            setError("Por favor completa todos los campos");
        }

        setIsLoading(false);
    };

    const handleDemoLogin = async () => {
        setIsLoading(true);
        await new Promise(resolve => setTimeout(resolve, 500));
        saveUserToStorage(MOCK_USER);
        router.push("/");
        router.refresh();
    };

    return (
        <div className="min-h-[calc(100vh-180px)] flex items-center justify-center px-4">
            <div className="w-full max-w-md">
                {/* Logo */}
                <div className="text-center mb-8">
                    <div className="w-16 h-16 rounded-2xl bg-[#D4FF00] flex items-center justify-center mx-auto mb-4">
                        <span className="text-black font-black text-3xl">T</span>
                    </div>
                    <h1 className="text-2xl font-bold">Bienvenido a TiQly</h1>
                    <p className="text-gray-400 mt-2">Ingresa a tu cuenta para continuar</p>
                </div>

                {/* Login Form */}
                <div className="card p-6">
                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div>
                            <label className="label">Email</label>
                            <input
                                type="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                placeholder="tu@email.com"
                                className="input"
                            />
                        </div>

                        <div>
                            <label className="label">Contraseña</label>
                            <input
                                type="password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                placeholder="••••••••"
                                className="input"
                            />
                        </div>

                        {error && (
                            <p className="text-red-400 text-sm">{error}</p>
                        )}

                        <button
                            type="submit"
                            disabled={isLoading}
                            className="w-full btn-accent disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {isLoading ? "Ingresando..." : "Ingresar"}
                        </button>
                    </form>

                    <div className="relative my-6">
                        <div className="absolute inset-0 flex items-center">
                            <div className="w-full border-t border-white/10"></div>
                        </div>
                        <div className="relative flex justify-center text-sm">
                            <span className="px-4 bg-[#0a0a0a] text-gray-400">o</span>
                        </div>
                    </div>

                    {/* Demo Login Button */}
                    <button
                        onClick={handleDemoLogin}
                        disabled={isLoading}
                        className="w-full py-3 px-4 border border-[#D4FF00]/30 text-[#D4FF00] font-medium rounded-xl hover:bg-[#D4FF00]/10 transition-all disabled:opacity-50"
                    >
                        🎫 Ingresar como Demo User
                    </button>

                    <p className="text-center text-sm text-gray-400 mt-6">
                        ¿No tenés cuenta?{" "}
                        <Link href="/registro" className="text-[#D4FF00] hover:underline">
                            Registrate
                        </Link>
                    </p>
                </div>

                {/* Demo Note */}
                <div className="mt-6 p-4 rounded-xl bg-purple-500/10 border border-purple-500/20">
                    <p className="text-sm text-purple-300 text-center">
                        <strong>Demo Mode:</strong> Cualquier email/pass funciona, o usá el botón de Demo User
                    </p>
                </div>
            </div>
        </div>
    );
}
