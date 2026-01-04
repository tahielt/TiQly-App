"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { saveUserToStorage } from "@/lib/mock-data";

export default function RegistroPage() {
    const router = useRouter();
    const [formData, setFormData] = useState({
        name: "",
        email: "",
        password: "",
        confirmPassword: ""
    });
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState("");

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        setError("");

        if (!formData.name || !formData.email || !formData.password) {
            setError("Por favor completa todos los campos");
            setIsLoading(false);
            return;
        }

        if (formData.password !== formData.confirmPassword) {
            setError("Las contraseñas no coinciden");
            setIsLoading(false);
            return;
        }

        // Simulate network delay
        await new Promise(resolve => setTimeout(resolve, 800));

        // Mock registration
        const user = {
            id: 'user_demo',
            name: formData.name,
            email: formData.email,
            avatar: `https://ui-avatars.com/api/?name=${encodeURIComponent(formData.name)}&background=D4FF00&color=000`
        };

        saveUserToStorage(user);
        router.push("/");
        router.refresh();
    };

    return (
        <div className="min-h-[calc(100vh-180px)] flex items-center justify-center px-4 py-8">
            <div className="w-full max-w-md">
                {/* Logo */}
                <div className="text-center mb-8">
                    <div className="w-16 h-16 rounded-2xl bg-[#D4FF00] flex items-center justify-center mx-auto mb-4">
                        <span className="text-black font-black text-3xl">T</span>
                    </div>
                    <h1 className="text-2xl font-bold">Crear Cuenta</h1>
                    <p className="text-gray-400 mt-2">Regístrate para acceder a todos los eventos</p>
                </div>

                {/* Registration Form */}
                <div className="card p-6">
                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div>
                            <label className="label">Nombre completo</label>
                            <input
                                type="text"
                                value={formData.name}
                                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                placeholder="Tu nombre"
                                className="input"
                            />
                        </div>

                        <div>
                            <label className="label">Email</label>
                            <input
                                type="email"
                                value={formData.email}
                                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                placeholder="tu@email.com"
                                className="input"
                            />
                        </div>

                        <div>
                            <label className="label">Contraseña</label>
                            <input
                                type="password"
                                value={formData.password}
                                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                                placeholder="••••••••"
                                className="input"
                            />
                        </div>

                        <div>
                            <label className="label">Confirmar contraseña</label>
                            <input
                                type="password"
                                value={formData.confirmPassword}
                                onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
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
                            {isLoading ? "Creando cuenta..." : "Crear Cuenta"}
                        </button>
                    </form>

                    <p className="text-center text-sm text-gray-400 mt-6">
                        ¿Ya tenés cuenta?{" "}
                        <Link href="/login" className="text-[#D4FF00] hover:underline">
                            Iniciar sesión
                        </Link>
                    </p>
                </div>
            </div>
        </div>
    );
}
