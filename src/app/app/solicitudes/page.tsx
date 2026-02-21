"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { PageHeader } from "@/components/shared/page-header";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import Link from "next/link";
import { Plus, Clock, MessageSquare, FileText, ChevronRight } from "lucide-react";
import { toast } from "sonner";
import { getServiceRequests } from "@/app/actions/service-requests";

interface ServiceRequest {
  id: string;
  moto: string;
  category: string;
  description: string;
  status: string;
  statusLabel: string;
  quotesCount: number;
  createdAt: string;
  urgency: string;
}

const statusColors: Record<string, string> = {
  BORRADOR: "bg-gray-100 text-gray-800",
  PUBLICADA: "bg-blue-100 text-blue-800",
  EN_COTIZACION: "bg-primary/15 text-primary",
  SELECCIONADA: "bg-green-100 text-green-800",
  EN_SERVICIO: "bg-yellow-100 text-yellow-800",
  CERRADA: "bg-green-100 text-green-800",
  CANCELADA: "bg-red-100 text-red-800",
};

const statusLabels: Record<string, string> = {
  BORRADOR: "Borrador",
  PUBLICADA: "Publicada",
  EN_COTIZACION: "En cotización",
  SELECCIONADA: "Seleccionada",
  EN_SERVICIO: "En servicio",
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

export default function SolicitudesPage() {
  const [tab, setTab] = useState("all");
  const [requests, setRequests] = useState<ServiceRequest[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    setIsLoading(true);
    getServiceRequests()
      .then((data) => {
        setRequests(data.map((r) => ({
          id: r.id,
          moto: `${r.motorcycle.brand} ${r.motorcycle.model}`,
          category: r.category?.name || "Sin categoría",
          description: r.description,
          status: r.status,
          statusLabel: statusLabels[r.status] || r.status,
          quotesCount: r._count.quotes,
          createdAt: formatRelativeTime(r.createdAt),
          urgency: r.urgency || "MEDIA",
        })));
      })
      .catch((err) => {
        console.error("Failed to load requests", err);
      })
      .finally(() => setIsLoading(false));
  }, []);

  const filtered = tab === "all" ? requests : requests.filter((r) => r.status === tab);

  return (
    <div className="pb-20 lg:pb-0">
      <PageHeader title="Mis Solicitudes" description="Gestiona tus solicitudes de servicio" badge="MVP">
        <Link href="/app/solicitudes/nueva">
          <Button className="gap-2">
            <Plus className="w-4 h-4" /> Nueva
          </Button>
        </Link>
      </PageHeader>

      <Tabs value={tab} onValueChange={setTab} className="mb-6">
        <TabsList className="w-full justify-start overflow-x-auto">
          <TabsTrigger value="all">Todas</TabsTrigger>
          <TabsTrigger value="PUBLICADA">Publicadas</TabsTrigger>
          <TabsTrigger value="EN_COTIZACION">Con cotizaciones</TabsTrigger>
          <TabsTrigger value="SELECCIONADA">Seleccionadas</TabsTrigger>
          <TabsTrigger value="EN_SERVICIO">En servicio</TabsTrigger>
          <TabsTrigger value="CERRADA">Cerradas</TabsTrigger>
        </TabsList>
      </Tabs>

      <div className="space-y-3">
        {isLoading ? [1, 2, 3].map((i) => (
          <Card key={i}>
            <CardContent className="pt-4 pb-4">
              <div className="animate-pulse space-y-2">
                <div className="flex items-center gap-2">
                  <div className="h-3 bg-muted rounded w-16" />
                  <div className="h-4 bg-muted rounded w-20" />
                </div>
                <div className="h-4 bg-muted rounded w-3/4" />
                <div className="h-3 bg-muted rounded w-full" />
              </div>
            </CardContent>
          </Card>
        )) : filtered.length === 0 ? (
          <Card>
            <CardContent className="pt-8 pb-8 text-center">
              <FileText className="w-10 h-10 mx-auto text-muted-foreground mb-3" />
              <h3 className="font-medium text-sm mb-1">No tienes solicitudes</h3>
              <p className="text-xs text-muted-foreground mb-4">
                Crea tu primera solicitud de servicio para recibir cotizaciones de talleres.
              </p>
              <Link href="/app/solicitudes/nueva">
                <Button className="gap-2" size="sm">
                  <Plus className="w-4 h-4" /> Nueva solicitud
                </Button>
              </Link>
            </CardContent>
          </Card>
        ) : filtered.map((req, i) => (
          <motion.div
            key={req.id}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05 }}
          >
            <Link href={`/app/solicitudes/${req.id}`}>
              <Card className="hover:shadow-md transition-shadow cursor-pointer">
                <CardContent className="pt-4 pb-4">
                  <div className="flex items-start gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-xs font-mono text-muted-foreground">{req.id}</span>
                        <Badge className={`text-[10px] ${statusColors[req.status] || ""}`}>
                          {req.statusLabel}
                        </Badge>
                        {req.urgency === "ALTA" && (
                          <Badge variant="destructive" className="text-[10px]">Urgente</Badge>
                        )}
                      </div>
                      <h3 className="font-medium text-sm truncate">{req.moto} • {req.category}</h3>
                      <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{req.description}</p>
                      <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <Clock className="w-3 h-3" /> {req.createdAt}
                        </span>
                        <span className="flex items-center gap-1">
                          <FileText className="w-3 h-3" /> {req.quotesCount} cotizaciones
                        </span>
                      </div>
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
