"use client";

import { motion } from "framer-motion";
import { PageHeader } from "@/components/shared/page-header";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { Wrench, Clock, CheckCircle2, ChevronRight, Camera } from "lucide-react";

const demoOrders = [
  {
    id: "ORD-001",
    moto: "Honda CB 190R",
    category: "Frenos",
    client: "Juan P.",
    status: "EN_PROCESO",
    statusLabel: "En proceso",
    total: 155,
    startDate: "17 ene 2025",
    progress: 60,
  },
  {
    id: "ORD-002",
    moto: "Yamaha FZ 250",
    category: "Motor",
    client: "María G.",
    status: "COMPLETADA",
    statusLabel: "Completada",
    total: 320,
    startDate: "10 ene 2025",
    progress: 100,
  },
];

const statusColors: Record<string, string> = {
  EN_PROCESO: "bg-yellow-100 text-yellow-800",
  COMPLETADA: "bg-green-100 text-green-800",
  PENDIENTE: "bg-blue-100 text-blue-800",
};

export default function TallerOrdenesPage() {
  return (
    <div className="pb-20 lg:pb-0">
      <PageHeader
        title="Órdenes de trabajo"
        description="Gestiona tus órdenes activas y completadas"
        badge="MVP"
      />

      <div className="space-y-3">
        {demoOrders.map((order, i) => (
          <motion.div
            key={order.id}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05 }}
          >
            <Link href={`/app/taller/ordenes/${order.id}`}>
              <Card className="hover:shadow-md transition-shadow cursor-pointer">
                <CardContent className="pt-4 pb-4">
                  <div className="flex items-start gap-3">
                    <div className={`w-10 h-10 rounded-lg flex items-center justify-center shrink-0 ${
                      order.status === "COMPLETADA" ? "bg-green-100" : "bg-primary/10"
                    }`}>
                      {order.status === "COMPLETADA" ? (
                        <CheckCircle2 className="w-5 h-5 text-green-600" />
                      ) : (
                        <Wrench className="w-5 h-5 text-primary" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-xs font-mono text-muted-foreground">{order.id}</span>
                        <Badge className={`text-[10px] ${statusColors[order.status]}`}>
                          {order.statusLabel}
                        </Badge>
                      </div>
                      <h3 className="font-medium text-sm">{order.moto} • {order.category}</h3>
                      <p className="text-xs text-muted-foreground mt-1">Cliente: {order.client}</p>
                      <div className="flex items-center justify-between mt-2">
                        <span className="text-xs text-muted-foreground flex items-center gap-1">
                          <Clock className="w-3 h-3" /> {order.startDate}
                        </span>
                        <span className="text-sm font-semibold text-primary">S/ {order.total}</span>
                      </div>
                      {order.status === "EN_PROCESO" && (
                        <div className="mt-2 w-full bg-secondary rounded-full h-1.5">
                          <div className="bg-primary h-1.5 rounded-full transition-all" style={{ width: `${order.progress}%` }} />
                        </div>
                      )}
                    </div>
                    <ChevronRight className="w-5 h-5 text-muted-foreground shrink-0 mt-2" />
                  </div>
                </CardContent>
              </Card>
            </Link>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
