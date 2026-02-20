"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { PageHeader } from "@/components/shared/page-header";
import { FeatureBadge } from "@/components/shared/feature-badge";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import { getWorkshops, verifyWorkshop, suspendWorkshop } from "@/app/actions/workshops";
import {
  Search,
  Store,
  CheckCircle2,
  XCircle,
  Clock,
  MapPin,
  Star,
  Shield,
  Eye,
  Loader2,
} from "lucide-react";

interface Workshop {
  id: string;
  name: string;
  district: string;
  status: "PENDING" | "VERIFIED" | "REJECTED" | "SUSPENDED";
  statusLabel: string;
  rating: number;
  reviews: number;
  categories: string[];
  registeredAt: string;
}

const DEMO_WORKSHOPS: Workshop[] = [
  { id: "T-001", name: "MotoFix Pro", district: "San Isidro", status: "VERIFIED", statusLabel: "Verificado", rating: 4.8, reviews: 67, categories: ["Motor", "Frenos"], registeredAt: "Dic 2024" },
  { id: "T-002", name: "Taller MotoSpeed", district: "Miraflores", status: "VERIFIED", statusLabel: "Verificado", rating: 4.5, reviews: 32, categories: ["Frenos", "Suspensión"], registeredAt: "Nov 2024" },
  { id: "T-003", name: "Tu Moto Lima", district: "Lima", status: "PENDING", statusLabel: "Pendiente", rating: 0, reviews: 0, categories: ["Mantenimiento general"], registeredAt: "Ene 2025" },
  { id: "T-004", name: "MotoTech Express", district: "Surco", status: "PENDING", statusLabel: "Pendiente", rating: 0, reviews: 0, categories: ["Eléctrico", "Motor"], registeredAt: "Ene 2025" },
  { id: "T-005", name: "Taller Los Amigos", district: "SJL", status: "SUSPENDED", statusLabel: "Suspendido", rating: 2.1, reviews: 8, categories: ["General"], registeredAt: "Oct 2024" },
];

const statusColors: Record<string, string> = {
  PENDING: "bg-yellow-100 text-yellow-800",
  VERIFIED: "bg-green-100 text-green-800",
  REJECTED: "bg-red-100 text-red-800",
  SUSPENDED: "bg-gray-100 text-gray-800",
};

const statusIcons: Record<string, React.ReactNode> = {
  PENDING: <Clock className="w-4 h-4 text-yellow-600" />,
  VERIFIED: <CheckCircle2 className="w-4 h-4 text-green-600" />,
  REJECTED: <XCircle className="w-4 h-4 text-red-600" />,
  SUSPENDED: <Shield className="w-4 h-4 text-gray-600" />,
};

const STATUS_MAP: Record<string, Workshop["status"]> = {
  PENDIENTE: "PENDING",
  VERIFICADO: "VERIFIED",
  RECHAZADO: "REJECTED",
  SUSPENDIDO: "SUSPENDED",
};

const STATUS_LABEL_MAP: Record<string, string> = {
  PENDIENTE: "Pendiente",
  VERIFICADO: "Verificado",
  RECHAZADO: "Rechazado",
  SUSPENDIDO: "Suspendido",
};

export default function AdminTalleresPage() {
  const [search, setSearch] = useState("");
  const [tab, setTab] = useState("all");
  const [workshops, setWorkshops] = useState<Workshop[]>(DEMO_WORKSHOPS);
  const [isLoading, setIsLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  useEffect(() => {
    loadWorkshops();
  }, []);

  async function loadWorkshops() {
    try {
      setIsLoading(true);
      const data = await getWorkshops();
      const mapped: Workshop[] = data.map((w) => ({
        id: w.id,
        name: w.name,
        district: w.district,
        status: STATUS_MAP[w.status] || "PENDING",
        statusLabel: STATUS_LABEL_MAP[w.status] || w.status,
        rating: w.rating,
        reviews: w._count.reviews,
        categories: w.categories.map((c) => c.category.name),
        registeredAt: new Date(w.createdAt).toLocaleDateString("es-PE", { month: "short", year: "numeric" }),
      }));
      setWorkshops(mapped.length > 0 ? mapped : DEMO_WORKSHOPS);
    } catch (error) {
      toast.error("Error al cargar talleres");
      setWorkshops(DEMO_WORKSHOPS);
    } finally {
      setIsLoading(false);
    }
  }

  const filtered = workshops.filter((w) => {
    if (search && !w.name.toLowerCase().includes(search.toLowerCase())) return false;
    if (tab !== "all" && w.status !== tab) return false;
    return true;
  });

  const handleVerify = async (id: string) => {
    try {
      setActionLoading(id);
      await verifyWorkshop(id);
      toast.success("Taller verificado correctamente");
      await loadWorkshops();
    } catch (error) {
      toast.error("Error al verificar taller");
    } finally {
      setActionLoading(null);
    }
  };

  const handleReject = (id: string) => {
    toast.error("Taller rechazado");
  };

  const handleSuspend = async (id: string) => {
    try {
      setActionLoading(id);
      await suspendWorkshop(id, "Suspendido por administrador");
      toast("Taller suspendido", { description: "El taller no podrá recibir nuevas solicitudes" });
      await loadWorkshops();
    } catch (error) {
      toast.error("Error al suspender taller");
    } finally {
      setActionLoading(null);
    }
  };

  return (
    <div className="pb-20 lg:pb-0">
      <PageHeader title="Gestión de Talleres" description="Verifica y administra los talleres registrados" badge="MVP" />

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
        {[
          { label: "Verificados", value: workshops.filter((w) => w.status === "VERIFIED").length, color: "text-green-600" },
          { label: "Pendientes", value: workshops.filter((w) => w.status === "PENDING").length, color: "text-yellow-600" },
          { label: "Suspendidos", value: workshops.filter((w) => w.status === "SUSPENDED").length, color: "text-gray-600" },
          { label: "Total", value: workshops.length, color: "text-primary" },
        ].map((s) => (
          <Card key={s.label}>
            <CardContent className="pt-4 text-center">
              <p className={`text-2xl font-bold ${s.color}`}>{s.value}</p>
              <p className="text-xs text-muted-foreground">{s.label}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Filters */}
      <div className="flex gap-3 mb-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input placeholder="Buscar taller..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" />
        </div>
      </div>

      <Tabs value={tab} onValueChange={setTab} className="mb-4">
        <TabsList>
          <TabsTrigger value="all">Todos</TabsTrigger>
          <TabsTrigger value="PENDING">Pendientes</TabsTrigger>
          <TabsTrigger value="VERIFIED">Verificados</TabsTrigger>
          <TabsTrigger value="SUSPENDED">Suspendidos</TabsTrigger>
        </TabsList>
      </Tabs>

      {/* Workshop list */}
      {isLoading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((n) => (
            <Card key={n}><CardContent className="pt-4"><div className="flex items-start gap-3"><Skeleton className="w-10 h-10 rounded-lg" /><div className="flex-1 space-y-2"><Skeleton className="h-4 w-40" /><Skeleton className="h-3 w-60" /><Skeleton className="h-3 w-32" /></div></div></CardContent></Card>
          ))}
        </div>
      ) : (
      <div className="space-y-3">
        {filtered.map((w, i) => (
          <motion.div
            key={w.id}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05 }}
          >
            <Card>
              <CardContent className="pt-4">
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-lg bg-secondary flex items-center justify-center shrink-0">
                    {statusIcons[w.status]}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1 flex-wrap">
                      <h3 className="font-semibold text-sm">{w.name}</h3>
                      <Badge className={`text-[10px] ${statusColors[w.status]}`}>{w.statusLabel}</Badge>
                    </div>
                    <div className="flex items-center gap-3 text-xs text-muted-foreground">
                      <span className="flex items-center gap-1"><MapPin className="w-3 h-3" />{w.district}</span>
                      {w.rating > 0 && (
                        <span className="flex items-center gap-1"><Star className="w-3 h-3 text-yellow-500" />{w.rating} ({w.reviews})</span>
                      )}
                      <span>{w.registeredAt}</span>
                    </div>
                    <div className="flex flex-wrap gap-1 mt-2">
                      {w.categories.map((c) => (
                        <Badge key={c} variant="outline" className="text-[10px]">{c}</Badge>
                      ))}
                    </div>
                  </div>
                  <div className="flex gap-1 shrink-0">
                    {w.status === "PENDING" && (
                      <>
                        <Button size="sm" variant="default" className="h-8 text-xs" onClick={() => handleVerify(w.id)} disabled={actionLoading === w.id}>
                          {actionLoading === w.id ? <Loader2 className="w-3 h-3 mr-1 animate-spin" /> : <CheckCircle2 className="w-3 h-3 mr-1" />} Verificar
                        </Button>
                        <Button size="sm" variant="ghost" className="h-8 text-xs text-destructive" onClick={() => handleReject(w.id)} disabled={actionLoading === w.id}>
                          <XCircle className="w-3 h-3" />
                        </Button>
                      </>
                    )}
                    {w.status === "VERIFIED" && (
                      <Button size="sm" variant="ghost" className="h-8 text-xs" onClick={() => handleSuspend(w.id)} disabled={actionLoading === w.id}>
                        {actionLoading === w.id ? <Loader2 className="w-3 h-3 mr-1 animate-spin" /> : null} Suspender
                      </Button>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>      )}    </div>
  );
}
