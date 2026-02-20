import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { ClerkWrapper } from "@/components/providers/clerk-wrapper";
import { ClerkErrorBoundary } from "@/components/providers/clerk-error-boundary";
import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "MotoJusta — Mantenimiento transparente para tu moto",
  description:
    "Cotizaciones estructuradas, control de cambios y reputación verificada para servicios de motocicletas.",
  keywords: ["motocicleta", "mantenimiento", "cotización", "taller", "moto", "reparación"],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <ClerkWrapper>
      <html lang="es" suppressHydrationWarning>
        <body
          className={`${geistSans.variable} ${geistMono.variable} antialiased`}
        >
          <ClerkErrorBoundary>
            <TooltipProvider>
              {children}
            </TooltipProvider>
          </ClerkErrorBoundary>
          <Toaster richColors position="top-right" />
        </body>
      </html>
    </ClerkWrapper>
  );
}
