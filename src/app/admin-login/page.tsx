"use client";

import { useEffect, useState } from "react";
import { useUser } from "@clerk/nextjs";
import { SignIn } from "@clerk/nextjs";
import { useRouter } from "next/navigation";
import { getCurrentRole } from "@/app/actions/roles";
import { Wrench, ShieldCheck, Loader2 } from "lucide-react";
import Link from "next/link";

export default function AdminLoginPage() {
  const { isSignedIn, isLoaded } = useUser();
  const router = useRouter();
  const [checking, setChecking] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Once signed in, verify the user has ADMIN role in DB
  useEffect(() => {
    if (!isSignedIn) return;

    setChecking(true);
    getCurrentRole()
      .then((role) => {
        if (role === "ADMIN") {
          router.replace("/app/admin/talleres");
        } else {
          setError("Tu cuenta no tiene permisos de administrador. Contacta al equipo de MotoJusta.");
          setChecking(false);
        }
      })
      .catch((err) => {
        setError(err.message || "Error al verificar permisos");
        setChecking(false);
      });
  }, [isSignedIn, router]);

  if (!isLoaded) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  // Checking admin role
  if (isSignedIn && checking) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-background gap-4">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
        <p className="text-muted-foreground">Verificando permisos de administrador...</p>
      </div>
    );
  }

  // Error / not authorized
  if (error) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-background gap-4 px-4 text-center">
        <ShieldCheck className="w-12 h-12 text-destructive" />
        <p className="text-destructive font-medium max-w-sm">{error}</p>
        <Link href="/" className="text-primary hover:underline text-sm">← Volver al inicio</Link>
      </div>
    );
  }

  // Not signed in → show sign-in
  return (
    <div className="min-h-screen bg-background">
      <nav className="border-b bg-background/80 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-4 h-16 flex items-center">
          <Link href="/" className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
              <Wrench className="w-5 h-5 text-primary-foreground" />
            </div>
            <span className="font-bold text-xl">Moto<span className="text-primary">Justa</span></span>
          </Link>
        </div>
      </nav>

      <div className="max-w-lg mx-auto px-4 py-12">
        <div className="text-center mb-8">
          <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-4">
            <ShieldCheck className="w-8 h-8 text-primary" />
          </div>
          <h1 className="text-3xl font-bold mb-2">Acceso Administrador</h1>
          <p className="text-muted-foreground">
            Inicia sesión con tu cuenta de administrador.
          </p>
        </div>

        <div className="flex justify-center">
          <SignIn
            forceRedirectUrl="/admin-login"
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
      </div>
    </div>
  );
}
