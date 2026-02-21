"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { PageHeader } from "@/components/shared/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";
import {
  Bike,
  FileText,
  ClipboardList,
  TrendingUp,
  Clock,
  CheckCircle2,
  AlertCircle,
  Plus,
  Bell,
  X,
  Loader2,
} from "lucide-react";
import { toast } from "sonner";
import { getServiceRequests } from "@/app/actions/service-requests";
import { getUserOrders } from "@/app/actions/work-orders";
import { getNotifications } from "@/app/actions/notifications";
import { getReminders, dismissReminder } from "@/app/actions/reminders";
import { getCurrentRole } from "@/app/actions/roles";
import type { Reminder } from "@/app/actions/reminders";

const DEFAULT_STATS = [
  { label: "Solicitudes activas", value: "3", icon: FileText, color: "text-blue-500" },
  { label: "Cotizaciones recibidas", value: "7", icon: ClipboardList, color: "text-primary" },
  { label: "Órdenes en proceso", value: "1", icon: Clock, color: "text-yellow-500" },
  { label: "Servicios completados", value: "12", icon: CheckCircle2, color: "text-green-500" },
];

const DEFAULT_ACTIVITY = [
  { id: "1", text: "Nueva cotización de Taller MotoSpeed", time: "Hace 2h", type: "quote" },
  { id: "2", text: "Servicio completado - Cambio de aceite", time: "Hace 1d", type: "complete" },
  { id: "3", text: "Solicitud publicada - Frenos", time: "Hace 2d", type: "request" },
  { id: "4", text: "Calificación enviada: ⭐ 4.5", time: "Hace 3d", type: "review" },
];

function formatRelativeTime(date: Date | string): string {
  const now = new Date();
  const d = new Date(date);
  const diffMs = now.getTime() - d.getTime();
  const hours = Math.floor(diffMs / 3600000);
  if (hours < 1) return "Hace menos de 1 hora";
  if (hours < 24) return `Hace ${hours}h`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `Hace ${days}d`;
  const weeks = Math.floor(days / 7);
  return `Hace ${weeks} semana${weeks > 1 ? "s" : ""}`;
}

export default function DashboardPage() {
  const router = useRouter();
  const [stats, setStats] = useState(DEFAULT_STATS);
  const [recentActivity, setRecentActivity] = useState(DEFAULT_ACTIVITY);
  const [isLoading, setIsLoading] = useState(true);
  const [reminders, setReminders] = useState<Reminder[]>([]);
  const [roleChecked, setRoleChecked] = useState(false);

  // Redirect non-motociclista users to their proper dashboard
  useEffect(() => {
    getCurrentRole().then((role) => {
      if (role === "TALLER") {
        router.replace("/app/taller/solicitudes");
        return;
      }
      if (role === "ADMIN") {
        router.replace("/app/admin/talleres");
        return;
      }
      setRoleChecked(true);
    }).catch(() => setRoleChecked(true));
  }, [router]);

  useEffect(() => {
    if (!roleChecked) return;
    setIsLoading(true);
    Promise.allSettled([getServiceRequests(), getUserOrders(), getNotifications()])
      .then(([reqResult, ordResult, notifResult]) => {
        const requests = reqResult.status === "fulfilled" ? reqResult.value : [];
        const orders = ordResult.status === "fulfilled" ? ordResult.value : [];
        const notifications = notifResult.status === "fulfilled" ? notifResult.value : [];

        const activeRequests = requests.filter((r) => !["COMPLETADA", "CANCELADA", "CERRADA"].includes(r.status));
        const totalQuotes = requests.reduce((sum, r) => sum + (r._count?.quotes || 0), 0);
        const inProcess = orders.filter((o) => o.status === "EN_SERVICIO" || o.status === "PENDIENTE");
        const completed = orders.filter((o) => o.status === "COMPLETADA" || o.status === "CERRADA");

        if (requests.length > 0 || orders.length > 0) {
          setStats([
            { label: "Solicitudes activas", value: String(activeRequests.length), icon: FileText, color: "text-blue-500" },
            { label: "Cotizaciones recibidas", value: String(totalQuotes), icon: ClipboardList, color: "text-primary" },
            { label: "Órdenes en proceso", value: String(inProcess.length), icon: Clock, color: "text-yellow-500" },
            { label: "Servicios completados", value: String(completed.length), icon: CheckCircle2, color: "text-green-500" },
          ]);
        }

        if (notifications.length > 0) {
          setRecentActivity(notifications.slice(0, 4).map((n) => ({
            id: n.id,
            text: n.title,
            time: formatRelativeTime(n.createdAt),
            type: n.link?.includes("cotizacion") ? "quote" : n.title.toLowerCase().includes("completad") ? "complete" : "request",
          })));
        }
      })
      .catch(() => {
        // Keep default demo data
      })
      .finally(() => setIsLoading(false));

    // Load maintenance reminders
    getReminders()
      .then((data) => setReminders(data))
      .catch(() => {});
  }, [roleChecked]);

  if (!roleChecked) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="pb-20 lg:pb-0">
      <PageHeader
        title="Dashboard"
        description="Bienvenido a MotoJusta. Aquí tienes un resumen de tu actividad."
        badge="MVP"
      />

      {/* Quick actions */}
      <div className="flex flex-wrap gap-3 mb-8">
        <Link href="/app/solicitudes/nueva">
          <Button className="gap-2">
            <Plus className="w-4 h-4" />
            Nueva solicitud
          </Button>
        </Link>
        <Link href="/app/motos">
          <Button variant="outline" className="gap-2">
            <Bike className="w-4 h-4" />
            Mis motos
          </Button>
        </Link>
      </div>

      {/* Stats grid */}
      <div className={`grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8 ${isLoading ? "animate-pulse" : ""}`}>
        {stats.map((stat, i) => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
          >
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center gap-3">
                  <div className={`p-2 rounded-lg bg-secondary ${stat.color}`}>
                    <stat.icon className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold">{stat.value}</p>
                    <p className="text-xs text-muted-foreground">{stat.label}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      {/* FIX 10: Maintenance reminders */}
      {reminders.length > 0 && (
        <Card className="mb-8 border-yellow-200 bg-yellow-50/30">
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              <Bell className="w-5 h-5 text-yellow-600" />
              Recordatorios de mantenimiento
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {reminders.map((reminder) => (
                <motion.div
                  key={reminder.id}
                  className="flex items-start gap-3 p-3 rounded-lg bg-white border border-yellow-200"
                  initial={{ opacity: 0, y: 5 }}
                  animate={{ opacity: 1, y: 0 }}
                >
                  <AlertCircle className="w-5 h-5 text-yellow-600 shrink-0 mt-0.5" />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <Badge variant="outline" className="text-[10px]">{reminder.type}</Badge>
                      <span className="text-xs text-muted-foreground">{reminder.motoLabel}</span>
                    </div>
                    <p className="text-sm">{reminder.message}</p>
                    <p className="text-xs text-muted-foreground mt-1">{reminder.dueInfo}</p>
                  </div>
                  <div className="flex gap-1 shrink-0">
                    <Link href="/app/solicitudes/nueva">
                      <Button size="sm" variant="outline" className="text-xs h-7 px-2">
                        Solicitar
                      </Button>
                    </Link>
                    <Button
                      size="sm"
                      variant="ghost"
                      className="h-7 w-7 p-0"
                      onClick={async () => {
                        try {
                          await dismissReminder(reminder.id);
                          setReminders(reminders.filter((r) => r.id !== reminder.id));
                        } catch {}
                      }}
                    >
                      <X className="w-3 h-3" />
                    </Button>
                  </div>
                </motion.div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Recent activity */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-primary" />
            Actividad reciente
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {recentActivity.map((item) => (
              <motion.div
                key={item.id}
                className="flex items-center gap-3 p-3 rounded-lg hover:bg-secondary/50 transition-colors"
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
              >
                <div className="w-2 h-2 rounded-full bg-primary" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{item.text}</p>
                  <p className="text-xs text-muted-foreground">{item.time}</p>
                </div>
                <Badge variant="outline" className="text-[10px] shrink-0">
                  {item.type === "quote" ? "Cotización" :
                   item.type === "complete" ? "Completado" :
                   item.type === "request" ? "Solicitud" : "Reseña"}
                </Badge>
              </motion.div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
