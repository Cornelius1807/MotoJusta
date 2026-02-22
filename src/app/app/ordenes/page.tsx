"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { PageHeader } from "@/components/shared/page-header";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import Link from "next/link";
import { Clock, FileText, ChevronRight, Wrench, Star, Loader2 } from "lucide-react";
import { getUserOrders } from "@/app/actions/work-orders";

interface WorkOrder {
  id: string;
  orderNumber: string;
  moto: string;
  category: string;
  workshop: string;
  district: string;
  total: number;
  status: string;
  statusLabel: string;
  rating: number | null;
  createdAt: string;
}

const statusColors: Record<string, string> = {
  PENDIENTE: "bg-blue-100 text-blue-800",
  EN_SERVICIO: "bg-yellow-100 text-yellow-800",
  COMPLETADA: "bg-green-100 text-green-800",
  CERRADA: "bg-green-100 text-green-800",
  CANCELADA: "bg-red-100 text-red-800",
};

const statusLabels: Record<string, string> = {
  PENDIENTE: "Pendiente",
  EN_SERVICIO: "En servicio",
  COMPLETADA: "Completada",
  CERRADA: "Cerrada",
  CANCELADA: "Cancelada",
};

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

export default function OrdenesPage() {
  const [tab, setTab] = useState("all");
  const [orders, setOrders] = useState<WorkOrder[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    getUserOrders()
      .then((data) => {
        setOrders(
          data.map((o) => ({
            id: o.id,
            orderNumber: o.orderNumber,
            moto: `${o.request.motorcycle.brand} ${o.request.motorcycle.model}${o.request.motorcycle.year ? ` (${o.request.motorcycle.year})` : ""}`,
            category: o.request.category?.name || "Sin categoría",
            workshop: o.workshop.name,
            district: o.workshop.district || "",
            total: o.totalAgreed,
            status: o.status,
            statusLabel: statusLabels[o.status] || o.status,
            rating: o.review?.rating || null,
            createdAt: formatRelativeTime(o.createdAt),
          }))
        );
      })
      .catch((err) => console.error("Failed to load orders", err))
      .finally(() => setIsLoading(false));
  }, []);

  const filtered = tab === "all" ? orders : orders.filter((o) => o.status === tab);

  return (
    <div className="pb-20 lg:pb-0">
      <PageHeader title="Mis Órdenes" description="Seguimiento de tus órdenes de trabajo" badge="MVP" />

      <Tabs value={tab} onValueChange={setTab} className="mb-6">
        <TabsList className="w-full justify-start overflow-x-auto">
          <TabsTrigger value="all">Todas</TabsTrigger>
          <TabsTrigger value="PENDIENTE">Pendientes</TabsTrigger>
          <TabsTrigger value="EN_SERVICIO">En servicio</TabsTrigger>
          <TabsTrigger value="COMPLETADA">Completadas</TabsTrigger>
          <TabsTrigger value="CERRADA">Cerradas</TabsTrigger>
        </TabsList>
      </Tabs>

      <div className="space-y-3">
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
          </div>
        ) : filtered.length === 0 ? (
          <Card>
            <CardContent className="pt-8 pb-8 text-center">
              <Wrench className="w-10 h-10 mx-auto text-muted-foreground mb-3" />
              <h3 className="font-medium text-sm mb-1">No tienes órdenes</h3>
              <p className="text-xs text-muted-foreground">
                Las órdenes se crean automáticamente al aceptar una cotización.
              </p>
            </CardContent>
          </Card>
        ) : (
          filtered.map((order, i) => (
            <motion.div
              key={order.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
            >
              <Link href={`/app/ordenes/${order.id}`}>
                <Card className="hover:shadow-md transition-shadow cursor-pointer">
                  <CardContent className="pt-4 pb-4">
                    <div className="flex items-start gap-3">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1 flex-wrap">
                          <span className="text-xs font-mono text-muted-foreground">{order.orderNumber}</span>
                          <Badge className={`text-[10px] ${statusColors[order.status] || ""}`}>
                            {order.statusLabel}
                          </Badge>
                          {order.rating && (
                            <Badge variant="outline" className="text-[10px] gap-0.5">
                              <Star className="w-2.5 h-2.5 text-yellow-500 fill-yellow-500" />
                              {order.rating}
                            </Badge>
                          )}
                        </div>
                        <h3 className="font-medium text-sm truncate">{order.moto} • {order.category}</h3>
                        <p className="text-xs text-muted-foreground mt-1">
                          <Wrench className="w-3 h-3 inline mr-1" />
                          {order.workshop}{order.district ? ` • ${order.district}` : ""}
                        </p>
                        <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
                          <span className="flex items-center gap-1">
                            <Clock className="w-3 h-3" /> {order.createdAt}
                          </span>
                          <span className="font-semibold text-primary">S/ {order.total}</span>
                        </div>
                      </div>
                      <ChevronRight className="w-5 h-5 text-muted-foreground shrink-0 mt-2" />
                    </div>
                  </CardContent>
                </Card>
              </Link>
            </motion.div>
          ))
        )}
      </div>
    </div>
  );
}
