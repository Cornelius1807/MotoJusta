"use client";

import { SignUp } from "@clerk/nextjs";
import Link from "next/link";
import { Wrench } from "lucide-react";

const clerkKey = process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY;
const isConfigured = clerkKey && !clerkKey.includes("PLACEHOLDER");

export default function SignUpPage() {
  if (!isConfigured) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-background px-4 gap-6">
        <div className="w-12 h-12 rounded-xl bg-primary flex items-center justify-center">
          <Wrench className="w-7 h-7 text-primary-foreground" />
        </div>
        <h1 className="text-2xl font-bold">Registro</h1>
        <p className="text-muted-foreground text-center max-w-sm">
          Clerk no está configurado. Configura las variables de entorno
          <code className="mx-1 px-1.5 py-0.5 bg-secondary rounded text-xs">NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY</code>
          y <code className="mx-1 px-1.5 py-0.5 bg-secondary rounded text-xs">CLERK_SECRET_KEY</code>
          para habilitar la autenticación.
        </p>
        <Link href="/" className="text-primary hover:underline text-sm">← Volver al inicio</Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4">
      <SignUp
        appearance={{
          elements: {
            rootBox: "mx-auto",
            card: "shadow-lg border rounded-2xl",
            headerTitle: "text-2xl font-bold",
            formButtonPrimary: "bg-primary hover:bg-primary/90",
          },
        }}
      />
    </div>
  );
}
