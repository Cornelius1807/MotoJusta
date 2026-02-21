"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { PageHeader } from "@/components/shared/page-header";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { getAvailableRequests } from "@/app/actions/service-requests";
import { getWorkshopProfile } from "@/app/actions/workshops";
import Link from "next/link";
import { Search, MapPin, Clock, Bike, ChevronRight, Filter, ShieldCheck, AlertTriangle } from "lucide-react";

interface AvailableRequest {
  id: string;
  moto: string;
  category: string;
  description: string;
  district: string;
  urgency: string;
  createdAt: string;
  hasPhotos: boolean;
}

const urgencyColors: Record<string, string> = {
  BAJA: "bg-green-100 text-green-800",
  MEDIA: "bg-yellow-100 text-yellow-800",
  ALTA: "bg-red-100 text-red-800",
};

export default function TallerSolicitudesPage() {
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [requests, setRequests] = useState<AvailableRequest[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [workshopStatus, setWorkshopStatus] = useState<string | null>(null);

  useEffect(() => {
    async function load() {
      try {
        // Load workshop status and requests in parallel
        const [workshopData, data] = await Promise.all([
          getWorkshopProfile().catch(() => null),
          getAvailableRequests().catch(() => []),
        ]);

        if (workshopData) {
          setWorkshopStatus(workshopData.status);
        }

        if (data && data.length > 0) {
          setRequests(data.map((r: any) => ({
            id: r.id,
            moto: r.motorcycle ? `${r.motorcycle.brand} ${r.motorcycle.model} (${r.motorcycle.year})` : "Moto",
            category: r.category?.name || "General",
            description: r.description,
            district: r.user?.district || "",
            urgency: r.urgency,
            createdAt: new Date(r.createdAt).toLocaleDateString("es-PE"),
            hasPhotos: (r._count?.media || 0) > 0,
          })));
        }
      } catch (err) {
        console.error("Failed to load requests", err);
      } finally {
        setIsLoading(false);
      }
    }
    load();
  }, []);

  const filtered = requests.filter((r) => {
    if (search && !r.description.toLowerCase().includes(search.toLowerCase()) && !r.moto.toLowerCase().includes(search.toLowerCase())) return false;
    if (categoryFilter !== "all" && r.category !== categoryFilter) return false;
    return true;
  });

  return (
    <div className="pb-20 lg:pb-0">
      <PageHeader
        title="Solicitudes disponibles"
        description="Encuentra solicitudes de servicio para cotizar"
        badge="MVP"
      />

      {/* Workshop verification status banner */}
      {workshopStatus === "PENDIENTE" && (
        <div className="mb-6 bg-yellow-50 dark:bg-yellow-950/30 border border-yellow-200 dark:border-yellow-800 rounded-xl p-4">
          <div className="flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-yellow-600 shrink-0 mt-0.5" />
            <div>
              <p className="font-medium text-yellow-900 dark:text-yellow-100 text-sm">
                Tu taller está pendiente de verificación
              </p>
              <p className="text-xs text-yellow-800 dark:text-yellow-200 mt-1">
                Nuestro equipo está revisando los datos de tu taller. Una vez verificado, podrás ver y cotizar solicitudes de servicio.
                Te notificaremos cuando tu taller sea aprobado.
              </p>
            </div>
          </div>
        </div>
      )}

      {workshopStatus === "SUSPENDIDO" && (
        <div className="mb-6 bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800 rounded-xl p-4">
          <div className="flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
            <div>
              <p className="font-medium text-red-900 dark:text-red-100 text-sm">
                Tu taller ha sido suspendido
              </p>
              <p className="text-xs text-red-800 dark:text-red-200 mt-1">
                Tu taller fue suspendido por el equipo de administración. Contacta a soporte para más información.
              </p>
            </div>
          </div>
        </div>
      )}

      {workshopStatus === "VERIFICADO" && requests.length === 0 && !isLoading && (
        <div className="mb-6 bg-green-50 dark:bg-green-950/30 border border-green-200 dark:border-green-800 rounded-xl p-4">
          <div className="flex items-start gap-3">
            <ShieldCheck className="w-5 h-5 text-green-600 shrink-0 mt-0.5" />
            <div>
              <p className="font-medium text-green-900 dark:text-green-100 text-sm">
                ¡Tu taller está verificado!
              </p>
              <p className="text-xs text-green-800 dark:text-green-200 mt-1">
                Ya puedes recibir y cotizar solicitudes. Cuando los motociclistas publiquen solicitudes, aparecerán aquí.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Buscar por moto o descripción..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        <Select value={categoryFilter} onValueChange={setCategoryFilter}>
          <SelectTrigger className="w-full sm:w-[180px]">
            <Filter className="w-4 h-4 mr-2" />
            <SelectValue placeholder="Categoría" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todas</SelectItem>
            <SelectItem value="Motor">Motor</SelectItem>
            <SelectItem value="Frenos">Frenos</SelectItem>
            <SelectItem value="Suspensión">Suspensión</SelectItem>
            <SelectItem value="Mantenimiento general">Mantenimiento</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Results count */}
      <p className="text-sm text-muted-foreground mb-4">
        {isLoading ? "Cargando..." : `${filtered.length} solicitudes disponibles`}
      </p>

      {/* Request cards */}
      <div className="space-y-3">
        {isLoading ? (
          [1, 2, 3].map((i) => <div key={i} className="h-28 rounded-lg bg-secondary animate-pulse" />)
        ) : filtered.length === 0 ? (
          <Card>
            <CardContent className="pt-8 pb-8 text-center">
              <Bike className="w-10 h-10 mx-auto text-muted-foreground mb-3" />
              <h3 className="font-medium text-sm mb-1">No hay solicitudes disponibles</h3>
              <p className="text-xs text-muted-foreground">
                Cuando los motociclistas publiquen solicitudes de servicio, aparecerán aquí para que puedas cotizar.
              </p>
            </CardContent>
          </Card>
        ) : filtered.map((req, i) => (
          <motion.div
            key={req.id}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05 }}
          >
            <Link href={`/app/taller/solicitudes/${req.id}/cotizar`}>
              <Card className="hover:shadow-md hover:border-primary/30 transition-all cursor-pointer">
                <CardContent className="pt-4 pb-4">
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                      <Bike className="w-5 h-5 text-primary" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1 flex-wrap">
                        <span className="text-xs font-mono text-muted-foreground">{req.id}</span>
                        <Badge className={`text-[10px] ${urgencyColors[req.urgency]}`}>
                          {req.urgency === "BAJA" ? "Baja" : req.urgency === "MEDIA" ? "Media" : "Urgente"}
                        </Badge>
                        {req.hasPhotos && <Badge variant="outline" className="text-[10px]">📷 Fotos</Badge>}
                      </div>
                      <h3 className="font-medium text-sm">{req.moto} • {req.category}</h3>
                      <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{req.description}</p>
                      <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <MapPin className="w-3 h-3" /> {req.district}
                        </span>
                        <span className="flex items-center gap-1">
                          <Clock className="w-3 h-3" /> {req.createdAt}
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
