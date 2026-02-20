"use client";

import { usePathname } from "next/navigation";
import Link from "next/link";
import { UserButton } from "@clerk/nextjs";
import { motion, AnimatePresence } from "framer-motion";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { useFeatureFlags } from "@/stores/feature-flags-store";
import {
  Wrench,
  Home,
  Bike,
  FileText,
  ClipboardList,
  History,
  Store,
  ShieldCheck,
  AlertTriangle,
  BarChart3,
  Settings,
  Menu,
  Bell,
  FlaskConical,
} from "lucide-react";
import { useState } from "react";

const motocyclistLinks = [
  { href: "/app", label: "Inicio", icon: Home },
  { href: "/app/motos", label: "Mis Motos", icon: Bike },
  { href: "/app/solicitudes/nueva", label: "Nueva Solicitud", icon: FileText },
  { href: "/app/historial", label: "Historial", icon: History },
];

const workshopLinks = [
  { href: "/app", label: "Inicio", icon: Home },
  { href: "/app/taller/solicitudes", label: "Solicitudes", icon: ClipboardList },
];

const adminLinks = [
  { href: "/app", label: "Inicio", icon: Home },
  { href: "/app/admin/talleres", label: "Talleres", icon: Store },
  { href: "/app/admin/incidentes", label: "Incidentes", icon: AlertTriangle },
  { href: "/app/admin/metricas", label: "Métricas", icon: BarChart3 },
  { href: "/app/admin/config", label: "Configuración", icon: Settings },
];

function NavLinks({ links, pathname }: { links: typeof motocyclistLinks; pathname: string }) {
  return (
    <nav className="flex flex-col gap-1">
      {links.map((link) => {
        const isActive = pathname === link.href || (link.href !== "/app" && pathname.startsWith(link.href));
        return (
          <Link
            key={link.href}
            href={link.href}
            className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors ${
              isActive
                ? "bg-primary/10 text-primary"
                : "text-muted-foreground hover:bg-secondary hover:text-foreground"
            }`}
          >
            <link.icon className="w-5 h-5" />
            {link.label}
          </Link>
        );
      })}
    </nav>
  );
}

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { mvpMode } = useFeatureFlags();
  const [mobileOpen, setMobileOpen] = useState(false);

  // Determine role-based navigation (simplified - in production would check DB)
  const isAdmin = pathname.startsWith("/app/admin");
  const isWorkshop = pathname.startsWith("/app/taller");
  const links = isAdmin ? adminLinks : isWorkshop ? workshopLinks : motocyclistLinks;

  const SidebarContent = () => (
    <div className="flex flex-col h-full">
      {/* Logo */}
      <div className="p-4 border-b">
        <Link href="/app" className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
            <Wrench className="w-5 h-5 text-primary-foreground" />
          </div>
          <span className="font-bold text-lg tracking-tight">
            Moto<span className="text-primary">Justa</span>
          </span>
        </Link>
        <div className="mt-3 flex items-center gap-2">
          <Badge variant={mvpMode ? "default" : "secondary"} className="text-[10px]">
            {mvpMode ? "MVP" : "COMPLETO"}
          </Badge>
          {!mvpMode && (
            <Badge variant="outline" className="text-[10px] border-purple-400 text-purple-600">
              <FlaskConical className="w-3 h-3 mr-1" />
              Labs
            </Badge>
          )}
        </div>
      </div>

      {/* Navigation */}
      <div className="flex-1 overflow-y-auto p-4">
        <NavLinks links={links} pathname={pathname} />

        {/* Role switcher for demo */}
        <div className="mt-8 pt-4 border-t">
          <p className="text-xs text-muted-foreground mb-2 font-medium">Demo - Cambiar vista</p>
          <div className="flex flex-col gap-1">
            <Link href="/app" className="text-xs px-3 py-1.5 rounded-lg hover:bg-secondary text-muted-foreground">
              🏍️ Motociclista
            </Link>
            <Link href="/app/taller/solicitudes" className="text-xs px-3 py-1.5 rounded-lg hover:bg-secondary text-muted-foreground">
              🔧 Taller
            </Link>
            <Link href="/app/admin/talleres" className="text-xs px-3 py-1.5 rounded-lg hover:bg-secondary text-muted-foreground">
              👨‍💼 Admin
            </Link>
          </div>
        </div>
      </div>

      {/* User */}
      <div className="p-4 border-t">
        <div className="flex items-center gap-3">
          <UserButton afterSignOutUrl="/" />
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium truncate">Mi cuenta</p>
            <p className="text-xs text-muted-foreground">Configuración</p>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-background">
      {/* Desktop sidebar */}
      <aside className="hidden lg:fixed lg:inset-y-0 lg:flex lg:w-64 lg:flex-col border-r bg-card">
        <SidebarContent />
      </aside>

      {/* Main content */}
      <div className="lg:pl-64">
        {/* Top bar */}
        <header className="sticky top-0 z-40 bg-background/80 backdrop-blur-md border-b">
          <div className="flex h-14 items-center gap-4 px-4">
            {/* Mobile menu */}
            <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
              <SheetTrigger asChild className="lg:hidden">
                <Button variant="ghost" size="icon">
                  <Menu className="w-5 h-5" />
                </Button>
              </SheetTrigger>
              <SheetContent side="left" className="w-64 p-0">
                <SidebarContent />
              </SheetContent>
            </Sheet>

            <div className="flex-1" />

            {/* Notifications */}
            <Button variant="ghost" size="icon" className="relative">
              <Bell className="w-5 h-5" />
              <span className="absolute -top-0.5 -right-0.5 w-4 h-4 bg-destructive text-destructive-foreground text-[10px] font-bold rounded-full flex items-center justify-center">
                3
              </span>
            </Button>

            <UserButton afterSignOutUrl="/" />
          </div>
        </header>

        {/* Page content with animation */}
        <main className="p-4 sm:p-6 lg:p-8">
          <AnimatePresence mode="wait">
            <motion.div
              key={pathname}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.2 }}
            >
              {children}
            </motion.div>
          </AnimatePresence>
        </main>
      </div>

      {/* Mobile bottom nav */}
      <nav className="lg:hidden fixed bottom-0 w-full bg-background/95 backdrop-blur-md border-t z-50">
        <div className="flex items-center justify-around h-16 px-2">
          {(isAdmin ? adminLinks.slice(0, 4) : isWorkshop ? workshopLinks : motocyclistLinks.slice(0, 4)).map((link) => {
            const isActive = pathname === link.href || (link.href !== "/app" && pathname.startsWith(link.href));
            return (
              <Link
                key={link.href}
                href={link.href}
                className={`flex flex-col items-center gap-1 px-3 py-1 rounded-lg transition-colors ${
                  isActive ? "text-primary" : "text-muted-foreground"
                }`}
              >
                <link.icon className="w-5 h-5" />
                <span className="text-[10px] font-medium">{link.label}</span>
              </Link>
            );
          })}
        </div>
      </nav>
    </div>
  );
}
