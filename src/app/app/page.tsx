"use client";

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
} from "lucide-react";

const stats = [
  { label: "Solicitudes activas", value: "3", icon: FileText, color: "text-blue-500" },
  { label: "Cotizaciones recibidas", value: "7", icon: ClipboardList, color: "text-primary" },
  { label: "Órdenes en proceso", value: "1", icon: Clock, color: "text-yellow-500" },
  { label: "Servicios completados", value: "12", icon: CheckCircle2, color: "text-green-500" },
];

const recentActivity = [
  { id: "1", text: "Nueva cotización de Taller MotoSpeed", time: "Hace 2h", type: "quote" },
  { id: "2", text: "Servicio completado - Cambio de aceite", time: "Hace 1d", type: "complete" },
  { id: "3", text: "Solicitud publicada - Frenos", time: "Hace 2d", type: "request" },
  { id: "4", text: "Calificación enviada: ⭐ 4.5", time: "Hace 3d", type: "review" },
];

export default function DashboardPage() {
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
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
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
