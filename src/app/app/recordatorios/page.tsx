"use client";

import { useState, useEffect } from "react";
import { getReminders, dismissReminder } from "@/app/actions/reminders";
import { motion } from "framer-motion";
import { PageHeader } from "@/components/shared/page-header";
import { FeatureBadge } from "@/components/shared/feature-badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import {
  Bell,
  Bike,
  Droplets,
  Wrench,
  CheckCircle2,
  X,
  AlertTriangle,
} from "lucide-react";

interface Reminder {
  id: string;
  motoLabel: string;
  motorcycleId: string;
  type: string;
  message: string;
  dueInfo: string;
  dismissed: boolean;
}

const typeIcons: Record<string, typeof Droplets> = {
  "Cambio de aceite": Droplets,
  "Revisión general": Wrench,
  "Primera revisión": CheckCircle2,
};

export default function RecordatoriosPage() {
  const [reminders, setReminders] = useState<Reminder[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const data = await getReminders();
        setReminders(data);
      } catch (err) {
        console.error("Failed to load reminders", err);
      } finally {
        setIsLoading(false);
      }
    }
    load();
  }, []);

  const handleDismiss = async (id: string) => {
    try {
      await dismissReminder(id);
      setReminders((prev) => prev.filter((r) => r.id !== id));
      toast.success("Recordatorio descartado");
    } catch (err: any) {
      toast.error("Error al descartar", { description: err.message });
    }
  };

  return (
    <div className="pb-20 lg:pb-0 max-w-2xl">
      <PageHeader
        title="Recordatorios"
        description="Recordatorios de mantenimiento para tus motos"
        badge="EXTRA"
      />

      {isLoading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-28 rounded-lg bg-secondary animate-pulse" />
          ))}
        </div>
      ) : reminders.length === 0 ? (
        <Card>
          <CardContent className="pt-8 pb-8 text-center">
            <Bell className="w-10 h-10 mx-auto text-muted-foreground mb-3" />
            <h3 className="font-medium text-sm mb-1">Sin recordatorios pendientes</h3>
            <p className="text-xs text-muted-foreground">
              Cuando tus motos necesiten mantenimiento, te lo recordaremos aquí.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {reminders.map((reminder, i) => {
            const Icon = typeIcons[reminder.type] || AlertTriangle;
            return (
              <motion.div
                key={reminder.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
              >
                <Card className="border-yellow-200 bg-yellow-50/30 dark:bg-yellow-950/10">
                  <CardContent className="pt-4 pb-4">
                    <div className="flex items-start gap-3">
                      <div className="w-10 h-10 rounded-lg bg-yellow-100 dark:bg-yellow-900/30 flex items-center justify-center shrink-0">
                        <Icon className="w-5 h-5 text-yellow-700 dark:text-yellow-400" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="font-medium text-sm">{reminder.type}</h3>
                          <Badge variant="outline" className="text-[10px]">
                            <Bike className="w-3 h-3 mr-1" />
                            {reminder.motoLabel}
                          </Badge>
                        </div>
                        <p className="text-xs text-muted-foreground">{reminder.message}</p>
                        <p className="text-[10px] text-muted-foreground mt-1">{reminder.dueInfo}</p>
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="shrink-0 h-8 w-8"
                        onClick={() => handleDismiss(reminder.id)}
                      >
                        <X className="w-4 h-4" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            );
          })}
        </div>
      )}
    </div>
  );
}
