"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { PageHeader } from "@/components/shared/page-header";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import {
  getNotifications,
  markAllNotificationsRead,
  deleteNotification as deleteNotificationAction,
} from "@/app/actions/notifications";
import {
  Bell,
  FileText,
  MessageSquare,
  Star,
  AlertTriangle,
  CheckCircle2,
  Clock,
  Trash2,
} from "lucide-react";

interface Notification {
  id: string;
  title: string;
  description: string;
  type: string;
  read: boolean;
  createdAt: string;
}

const iconMap: Record<string, React.ReactNode> = {
  quote: <FileText className="w-4 h-4 text-primary" />,
  message: <MessageSquare className="w-4 h-4 text-blue-500" />,
  review: <Star className="w-4 h-4 text-yellow-500" />,
  alert: <AlertTriangle className="w-4 h-4 text-red-500" />,
  complete: <CheckCircle2 className="w-4 h-4 text-green-500" />,
};

const DEMO_NOTIFICATIONS: Notification[] = [
  { id: "1", title: "Nueva cotización recibida", description: "MotoFix Pro envió una cotización para tu solicitud de frenos", type: "quote", read: false, createdAt: "Hace 30 min" },
  { id: "2", title: "Nuevo mensaje", description: "MotoFix Pro te envió un mensaje sobre la solicitud SOL-001", type: "message", read: false, createdAt: "Hace 2 horas" },
  { id: "3", title: "Servicio completado", description: "La orden ORD-002 ha sido marcada como completada", type: "complete", read: true, createdAt: "Hace 1 día" },
  { id: "4", title: "Solicitud de cambio", description: "Taller MotoSpeed solicita un cambio en la orden ORD-001", type: "alert", read: true, createdAt: "Hace 2 días" },
  { id: "5", title: "Califica tu servicio", description: "¿Cómo fue tu experiencia con MotoFix Pro?", type: "review", read: true, createdAt: "Hace 3 días" },
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

export default function NotificacionesPage() {
  const [notifications, setNotifications] = useState(DEMO_NOTIFICATIONS);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    setIsLoading(true);
    getNotifications()
      .then((data) => {
        if (data.length > 0) {
          setNotifications(data.map((n) => ({
            id: n.id,
            title: n.title,
            description: n.body,
            type: "quote",
            read: n.isRead,
            createdAt: formatRelativeTime(n.createdAt),
          })));
        }
      })
      .catch(() => {
        setNotifications(DEMO_NOTIFICATIONS);
      })
      .finally(() => setIsLoading(false));
  }, []);

  const unread = notifications.filter((n) => !n.read).length;

  const markAllRead = async () => {
    try {
      await markAllNotificationsRead();
      setNotifications(notifications.map((n) => ({ ...n, read: true })));
      toast.success("Todas las notificaciones marcadas como leídas");
    } catch {
      setNotifications(notifications.map((n) => ({ ...n, read: true })));
      toast.error("Error al marcar como leídas en el servidor");
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteNotificationAction(id);
      setNotifications(notifications.filter((n) => n.id !== id));
    } catch {
      setNotifications(notifications.filter((n) => n.id !== id));
      toast.error("Error al eliminar en el servidor");
    }
  };

  return (
    <div className="pb-20 lg:pb-0 max-w-2xl">
      <PageHeader title="Notificaciones" description={`${unread} sin leer`} badge="MVP">
        {unread > 0 && (
          <Button variant="outline" size="sm" onClick={markAllRead}>
            Marcar todas como leídas
          </Button>
        )}
      </PageHeader>

      <div className="space-y-2">
        {isLoading ? [1, 2, 3].map((i) => (
          <Card key={i}>
            <CardContent className="pt-3 pb-3">
              <div className="animate-pulse flex items-start gap-3">
                <div className="w-4 h-4 bg-muted rounded mt-0.5" />
                <div className="flex-1 space-y-2">
                  <div className="h-4 bg-muted rounded w-1/2" />
                  <div className="h-3 bg-muted rounded w-3/4" />
                  <div className="h-3 bg-muted rounded w-20" />
                </div>
              </div>
            </CardContent>
          </Card>
        )) : notifications.map((notif, i) => (
          <motion.div
            key={notif.id}
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: i * 0.03 }}
          >
            <Card className={`transition-colors ${!notif.read ? "border-primary/30 bg-primary/5" : ""}`}>
              <CardContent className="pt-3 pb-3">
                <div className="flex items-start gap-3">
                  <div className="mt-0.5">{iconMap[notif.type]}</div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className={`text-sm ${!notif.read ? "font-semibold" : "font-medium"}`}>{notif.title}</p>
                      {!notif.read && <div className="w-2 h-2 rounded-full bg-primary" />}
                    </div>
                    <p className="text-xs text-muted-foreground mt-0.5">{notif.description}</p>
                    <span className="text-[10px] text-muted-foreground flex items-center gap-1 mt-1">
                      <Clock className="w-3 h-3" /> {notif.createdAt}
                    </span>
                  </div>
                  <Button variant="ghost" size="sm" className="h-6 w-6 p-0 text-muted-foreground hover:text-destructive" onClick={() => handleDelete(notif.id)}>
                    <Trash2 className="w-3 h-3" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
