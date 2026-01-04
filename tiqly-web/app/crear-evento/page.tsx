"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Event } from "@/types";
import {
    getUserFromStorage,
    saveEventToStorage,
    generateEventId,
    EVENT_CATEGORIES
} from "@/lib/mock-data";

// Placeholder images for events
const PLACEHOLDER_IMAGES = [
    "https://images.unsplash.com/photo-1470229722913-7c0e2dbbafd3?w=800",
    "https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=800",
    "https://images.unsplash.com/photo-1492684223066-81342ee5ff30?w=800",
    "https://images.unsplash.com/photo-1506157786151-b8491531f063?w=800",
    "https://images.unsplash.com/photo-1533174072545-7a4b6ad7a6c3?w=800",
];

export default function CrearEventoPage() {
    const router = useRouter();
    const [isLoading, setIsLoading] = useState(false);
    const [selectedImage, setSelectedImage] = useState(PLACEHOLDER_IMAGES[0]);

    const [formData, setFormData] = useState({
        title: "",
        description: "",
        category: "Fiesta Electrónica",
        startDate: "",
        startTime: "22:00",
        endDate: "",
        endTime: "06:00",
        price: "",
        address: "",
        city: "Bariloche",
        latitude: "-41.133",
        longitude: "-71.310"
    });

    const [errors, setErrors] = useState<{ [key: string]: string }>({});

    useEffect(() => {
        const user = getUserFromStorage();
        if (!user) {
            router.push("/login");
        }
    }, [router]);

    const validate = (): boolean => {
        const newErrors: { [key: string]: string } = {};

        if (!formData.title.trim()) newErrors.title = "El título es requerido";
        if (!formData.description.trim()) newErrors.description = "La descripción es requerida";
        if (!formData.startDate) newErrors.startDate = "La fecha de inicio es requerida";
        if (!formData.price || Number(formData.price) <= 0) newErrors.price = "El precio debe ser mayor a 0";
        if (!formData.address.trim()) newErrors.address = "La dirección es requerida";

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!validate()) return;

        const user = getUserFromStorage();
        if (!user) {
            router.push("/login");
            return;
        }

        setIsLoading(true);

        // Simulate network delay
        await new Promise(resolve => setTimeout(resolve, 1000));

        const eventId = generateEventId();

        const startDateTime = new Date(`${formData.startDate}T${formData.startTime}:00`);
        const endDateTime = formData.endDate
            ? new Date(`${formData.endDate}T${formData.endTime}:00`)
            : new Date(startDateTime.getTime() + 8 * 60 * 60 * 1000); // Default 8 hours later

        const newEvent: Event = {
            id: eventId,
            title: formData.title,
            description: formData.description,
            organizerId: user.id,
            organizerName: user.name,
            createdByUserId: user.id,
            type: 'public',
            status: 'published',
            location: {
                address: formData.address,
                city: formData.city,
                name: formData.address,
                coordinates: {
                    latitude: parseFloat(formData.latitude),
                    longitude: parseFloat(formData.longitude)
                }
            },
            startDate: startDateTime,
            endDate: endDateTime,
            price: Number(formData.price),
            coverImage: selectedImage,
            category: formData.category,
            tags: formData.category.toLowerCase().split(" "),
            createdAt: new Date(),
            updatedAt: new Date(),
            gallery: []
        };

        saveEventToStorage(newEvent);

        router.push(`/events/${eventId}`);
    };

    const categories = EVENT_CATEGORIES.filter(c => c !== 'Todos');

    return (
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <div className="mb-8">
                <h1 className="text-3xl font-bold mb-2">Crear Evento</h1>
                <p className="text-gray-400">Publica tu evento y empieza a vender entradas</p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-8">
                {/* Cover Image Selection */}
                <div className="card p-6">
                    <h2 className="font-bold text-lg mb-4">Imagen del Evento</h2>
                    <p className="text-sm text-gray-400 mb-4">Selecciona una imagen para tu evento (demo: imágenes de ejemplo)</p>

                    <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
                        {PLACEHOLDER_IMAGES.map((img, idx) => (
                            <button
                                key={idx}
                                type="button"
                                onClick={() => setSelectedImage(img)}
                                className={`aspect-video rounded-lg overflow-hidden border-2 transition-all ${selectedImage === img
                                    ? 'border-[#D4FF00] ring-2 ring-[#D4FF00]/30'
                                    : 'border-transparent hover:border-white/30'
                                    }`}
                            >
                                <img src={img} alt={`Option ${idx + 1}`} className="w-full h-full object-cover" />
                            </button>
                        ))}
                    </div>

                    {/* Preview */}
                    <div className="mt-4">
                        <p className="text-xs text-gray-500 mb-2">Vista previa:</p>
                        <div className="aspect-video max-w-md rounded-xl overflow-hidden">
                            <img src={selectedImage} alt="Selected" className="w-full h-full object-cover" />
                        </div>
                    </div>
                </div>

                {/* Basic Info */}
                <div className="card p-6">
                    <h2 className="font-bold text-lg mb-4">Información Básica</h2>

                    <div className="space-y-4">
                        <div>
                            <label className="label">Título del Evento *</label>
                            <input
                                type="text"
                                value={formData.title}
                                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                                placeholder="Ej: Fiesta de Fin de Año 2025"
                                className={`input ${errors.title ? 'border-red-500' : ''}`}
                            />
                            {errors.title && <p className="text-red-400 text-sm mt-1">{errors.title}</p>}
                        </div>

                        <div>
                            <label className="label">Descripción *</label>
                            <textarea
                                value={formData.description}
                                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                placeholder="Describe tu evento..."
                                rows={4}
                                className={`input resize-none ${errors.description ? 'border-red-500' : ''}`}
                            />
                            {errors.description && <p className="text-red-400 text-sm mt-1">{errors.description}</p>}
                        </div>

                        <div>
                            <label className="label">Categoría</label>
                            <select
                                value={formData.category}
                                onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                                className="input"
                            >
                                {categories.map((cat) => (
                                    <option key={cat} value={cat}>{cat}</option>
                                ))}
                            </select>
                        </div>
                    </div>
                </div>

                {/* Date & Time */}
                <div className="card p-6">
                    <h2 className="font-bold text-lg mb-4">Fecha y Hora</h2>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                            <label className="label">Fecha de Inicio *</label>
                            <input
                                type="date"
                                value={formData.startDate}
                                onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                                className={`input ${errors.startDate ? 'border-red-500' : ''}`}
                            />
                            {errors.startDate && <p className="text-red-400 text-sm mt-1">{errors.startDate}</p>}
                        </div>
                        <div>
                            <label className="label">Hora de Inicio</label>
                            <input
                                type="time"
                                value={formData.startTime}
                                onChange={(e) => setFormData({ ...formData, startTime: e.target.value })}
                                className="input"
                            />
                        </div>
                        <div>
                            <label className="label">Fecha de Fin (opcional)</label>
                            <input
                                type="date"
                                value={formData.endDate}
                                onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                                className="input"
                            />
                        </div>
                        <div>
                            <label className="label">Hora de Fin</label>
                            <input
                                type="time"
                                value={formData.endTime}
                                onChange={(e) => setFormData({ ...formData, endTime: e.target.value })}
                                className="input"
                            />
                        </div>
                    </div>
                </div>

                {/* Location */}
                <div className="card p-6">
                    <h2 className="font-bold text-lg mb-4">Ubicación</h2>

                    <div className="space-y-4">
                        <div>
                            <label className="label">Dirección / Nombre del lugar *</label>
                            <input
                                type="text"
                                value={formData.address}
                                onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                                placeholder="Ej: Club del Lago"
                                className={`input ${errors.address ? 'border-red-500' : ''}`}
                            />
                            {errors.address && <p className="text-red-400 text-sm mt-1">{errors.address}</p>}
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                            <div>
                                <label className="label">Ciudad</label>
                                <input
                                    type="text"
                                    value={formData.city}
                                    onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                                    className="input"
                                />
                            </div>
                            <div>
                                <label className="label">Latitud</label>
                                <input
                                    type="text"
                                    value={formData.latitude}
                                    onChange={(e) => setFormData({ ...formData, latitude: e.target.value })}
                                    className="input"
                                    placeholder="-41.133"
                                />
                            </div>
                            <div>
                                <label className="label">Longitud</label>
                                <input
                                    type="text"
                                    value={formData.longitude}
                                    onChange={(e) => setFormData({ ...formData, longitude: e.target.value })}
                                    className="input"
                                    placeholder="-71.310"
                                />
                            </div>
                        </div>

                        <p className="text-xs text-gray-500">
                            💡 Demo: Las coordenadas por defecto son de Bariloche. El evento aparecerá en el mapa.
                        </p>
                    </div>
                </div>

                {/* Pricing */}
                <div className="card p-6">
                    <h2 className="font-bold text-lg mb-4">Precio</h2>

                    <div className="max-w-xs">
                        <label className="label">Precio de la entrada (ARS) *</label>
                        <div className="relative">
                            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400">$</span>
                            <input
                                type="number"
                                value={formData.price}
                                onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                                placeholder="15000"
                                className={`input pl-8 ${errors.price ? 'border-red-500' : ''}`}
                            />
                        </div>
                        {errors.price && <p className="text-red-400 text-sm mt-1">{errors.price}</p>}
                    </div>

                    {formData.price && Number(formData.price) > 0 && (
                        <div className="mt-4 p-4 bg-white/5 rounded-lg">
                            <p className="text-sm text-gray-400 mb-2">💰 Modelo de comisiones TiQly:</p>
                            <div className="space-y-2 text-sm">
                                <div className="flex justify-between">
                                    <span>Precio que definís</span>
                                    <span className="font-bold text-[#D4FF00]">${Number(formData.price).toLocaleString()}</span>
                                </div>
                                <div className="flex justify-between text-gray-400">
                                    <span>+ Cargo al comprador (15%)</span>
                                    <span className="text-gray-300">+${Math.round(Number(formData.price) * 0.15).toLocaleString()}</span>
                                </div>
                                <hr className="border-white/10 my-2" />
                                <div className="flex justify-between">
                                    <span className="text-gray-400">El comprador paga</span>
                                    <span className="text-white">${Math.round(Number(formData.price) * 1.15).toLocaleString()}</span>
                                </div>
                                <div className="p-3 mt-3 bg-[#D4FF00]/10 rounded-lg border border-[#D4FF00]/30">
                                    <div className="flex justify-between font-bold">
                                        <span className="text-[#D4FF00]">Vos recibís por entrada</span>
                                        <span className="text-[#D4FF00]">${Number(formData.price).toLocaleString()}</span>
                                    </div>
                                    <p className="text-xs text-gray-400 mt-1">¡El 100% del precio que definiste!</p>
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                {/* Payment Method Mock */}
                <div className="card p-6">
                    <h2 className="font-bold text-lg mb-4">💳 Medio de Pago</h2>
                    <p className="text-sm text-gray-400 mb-4">
                        Configurá dónde recibir el dinero de tus ventas
                    </p>

                    <div className="p-4 bg-green-500/10 border border-green-500/30 rounded-xl flex items-center gap-4">
                        <div className="w-12 h-12 rounded-xl bg-green-500/20 flex items-center justify-center">
                            <svg className="w-6 h-6 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                            </svg>
                        </div>
                        <div className="flex-1">
                            <p className="font-medium text-green-400">Mercado Pago conectado</p>
                            <p className="text-sm text-gray-400">demo@tiqly.com</p>
                        </div>
                        <span className="px-3 py-1 bg-green-500/20 text-green-400 text-xs font-bold rounded-full">
                            DEMO
                        </span>
                    </div>

                    <p className="text-xs text-gray-500 mt-3">
                        💡 Demo: En producción se conectará con Mercado Pago/Stripe para recibir pagos automáticamente.
                    </p>
                </div>

                {/* Submit */}
                <div className="flex flex-col sm:flex-row gap-4">
                    <button
                        type="submit"
                        disabled={isLoading}
                        className="flex-1 btn-accent py-4 text-lg disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {isLoading ? (
                            <span className="flex items-center justify-center gap-2">
                                <svg className="animate-spin w-5 h-5" fill="none" viewBox="0 0 24 24">
                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                </svg>
                                Creando evento...
                            </span>
                        ) : (
                            "Publicar Evento"
                        )}
                    </button>
                    <button
                        type="button"
                        onClick={() => router.back()}
                        className="px-8 py-4 text-gray-400 hover:text-white transition-colors"
                    >
                        Cancelar
                    </button>
                </div>

                {/* Demo Note */}
                <div className="p-4 rounded-xl bg-purple-500/10 border border-purple-500/20">
                    <p className="text-sm text-purple-300 text-center">
                        <strong>Demo:</strong> El evento se guardará en localStorage y aparecerá en Home, Mapa y Mis Eventos
                    </p>
                </div>
            </form>
        </div>
    );
}
