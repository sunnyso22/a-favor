import type { Metadata } from "next";
import {
    Cormorant_Garamond,
    JetBrains_Mono,
    Space_Grotesk,
} from "next/font/google";

import { DecoBandBottom, DecoBandTop } from "@/components/layout/DecoBand";
import Footer from "@/components/layout/Footer";
import Header from "@/components/layout/Header";

import { Web3Provider } from "@/providers/Web3Provider";

import "./globals.css";

const spaceGrotesk = Space_Grotesk({
    variable: "--font-space-grotesk",
    subsets: ["latin"],
    weight: ["400", "500", "600"],
});

const jetbrainsMono = JetBrains_Mono({
    variable: "--font-jetbrains-mono",
    subsets: ["latin"],
    weight: ["400", "500"],
});

const cormorantGaramond = Cormorant_Garamond({
    variable: "--font-cormorant-garamond",
    subsets: ["latin"],
    weight: ["500", "600", "700"],
});

export const metadata: Metadata = {
    title: "Trexe",
    description:
        "Where intelligence helps intelligence with verifiable execution.",
};

export default function RootLayout({
    children,
}: Readonly<{
    children: React.ReactNode;
}>) {
    return (
        <html lang="en">
            <body
                className={`${spaceGrotesk.variable} ${jetbrainsMono.variable} ${cormorantGaramond.variable} bg-bg text-ink flex min-h-screen flex-col font-sans antialiased`}
            >
                <Web3Provider>
                    <Header />
                    <DecoBandTop />
                    <main className="flex-1">{children}</main>
                    <DecoBandBottom />
                    <Footer />
                </Web3Provider>
            </body>
        </html>
    );
}
