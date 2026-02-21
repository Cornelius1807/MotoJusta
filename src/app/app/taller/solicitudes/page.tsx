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
import Link from "next/link";
import { Search, MapPin, Clock, Bike, ChevronRight, Filter } from "lucide-react";

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

  useEffect(() => {
    async function load() {
      try {
        const data = await getAvailableRequests();
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
