import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import Header from "@/components/Header";

const inter = Inter({
    subsets: ["latin"],
    variable: "--font-inter"
});

export const metadata: Metadata = {
    title: "TiQly - Descubre Eventos Increíbles",
    description: "Encuentra los mejores eventos, compra tickets y vive experiencias únicas",
};

export default function RootLayout({
    children,
}: Readonly<{
    children: React.ReactNode;
}>) {
    return (
        <html lang="es" className="dark">
            <body className={`${inter.variable} font-sans antialiased bg-black text-white min-h-screen`}>
                <Header />
                <main className="pt-16">
                    {children}
                </main>
                <footer className="border-t border-white/5 py-12 mt-16 bg-black">
                    <div className="max-w-[1200px] mx-auto px-6">
                        <div className="flex flex-col md:flex-row items-center justify-between gap-6">
                            {/* Logo */}
                            <div className="flex items-center gap-2.5">
                                <div className="w-8 h-8 rounded-lg bg-[#D4FF00] flex items-center justify-center">
                                    <span className="text-black font-black text-lg">T</span>
                                </div>
                                <span className="text-base font-bold">TiQly</span>
                                <span className="text-gray-500 text-sm ml-2">© 2025</span>
                            </div>

                            {/* Links */}
                            <div className="flex items-center gap-8 text-sm text-gray-500">
                                <span>MVP Demo</span>
                                <span className="hidden sm:inline">•</span>
                                <span className="hidden sm:inline">Sin backend real</span>
                            </div>
                        </div>
                    </div>
                </footer>
            </body>
        </html>
    );
}
