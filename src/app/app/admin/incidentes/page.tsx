"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { PageHeader } from "@/components/shared/page-header";
import { FeatureBadge } from "@/components/shared/feature-badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import {
  AlertTriangle,
  MessageSquare,
  Clock,
  CheckCircle2,
  XCircle,
  Shield,
  Eye,
  Gavel,
} from "lucide-react";

interface Incident {
  id: string;
  type: string;
  typeLabel: string;
  reporter: string;
  reporterRole: string;
  against: string;
  description: string;
  status: string;
  statusLabel: string;
  createdAt: string;
  orderId: string;
}

const DEMO_INCIDENTS: Incident[] = [
  {
    id: "INC-001",
    type: "COBRO_EXTRA",
    typeLabel: "Cobro extra no autorizado",
    reporter: "Juan Pérez",
    reporterRole: "Motociclista",
    against: "Taller Los Amigos",
    description: "El taller cobró S/ 50 adicionales sin justificación. No hubo solicitud de cambio aprobada.",
    status: "OPEN",
    statusLabel: "Abierto",
    createdAt: "Hace 1 día",
    orderId: "ORD-015",
  },
  {
    id: "INC-002",
    type: "MAL_SERVICIO",
    typeLabel: "Servicio deficiente",
    reporter: "María García",
    reporterRole: "Motociclista",
    against: "MotoTech Express",
    description: "El trabajo realizado no correspondía a lo acordado en la cotización. Se cambiaron repuestos de menor calidad.",
    status: "IN_REVIEW",
    statusLabel: "En revisión",
    createdAt: "Hace 3 días",
    orderId: "ORD-010",
  },
  {
    id: "INC-003",
    type: "INCUMPLIMIENTO",
    typeLabel: "Incumplimiento de plazo",
    reporter: "Carlos López",
    reporterRole: "Motociclista",
    against: "Tu Moto Lima",
    description: "Se acordaron 2 días y lleva más de una semana sin completar el servicio.",
    status: "RESOLVED",
    statusLabel: "Resuelto",
    createdAt: "Hace 1 semana",
    orderId: "ORD-008",
  },
];

const statusColors: Record<string, string> = {
  OPEN: "bg-red-100 text-red-800",
  IN_REVIEW: "bg-yellow-100 text-yellow-800",
  RESOLVED: "bg-green-100 text-green-800",
  DISMISSED: "bg-gray-100 text-gray-800",
};

export default function AdminIncidentesPage() {
  const [tab, setTab] = useState("all");
  const [resolution, setResolution] = useState("");
  const [selectedAction, setSelectedAction] = useState("");

  const filtered = tab === "all" ? DEMO_INCIDENTS : DEMO_INCIDENTS.filter((inc) => inc.status === tab);

  const handleResolve = (incId: string) => {
    if (!resolution || resolution.length < 10) {
      toast.error("La resolución debe tener al menos 10 caracteres");
      return;
    }
    toast.success("Incidente resuelto", { description: `Acción: ${selectedAction || "Ninguna"}` });
    setResolution("");
    setSelectedAction("");
  };

  return (
    <div className="pb-20 lg:pb-0">
      <PageHeader title="Gestión de Incidentes" description="Revisa y resuelve los incidentes reportados" badge="EXTRA">
        <FeatureBadge type="EXTRA" />
      </PageHeader>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3 mb-6">
        <Card>
          <CardContent className="pt-4 text-center">
            <p className="text-2xl font-bold text-red-600">{DEMO_INCIDENTS.filter((i) => i.status === "OPEN").length}</p>
            <p className="text-xs text-muted-foreground">Abiertos</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 text-center">
            <p className="text-2xl font-bold text-yellow-600">{DEMO_INCIDENTS.filter((i) => i.status === "IN_REVIEW").length}</p>
            <p className="text-xs text-muted-foreground">En revisión</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 text-center">
            <p className="text-2xl font-bold text-green-600">{DEMO_INCIDENTS.filter((i) => i.status === "RESOLVED").length}</p>
            <p className="text-xs text-muted-foreground">Resueltos</p>
          </CardContent>
        </Card>
      </div>

      <Tabs value={tab} onValueChange={setTab} className="mb-4">
        <TabsList>
          <TabsTrigger value="all">Todos</TabsTrigger>
          <TabsTrigger value="OPEN">Abiertos</TabsTrigger>
          <TabsTrigger value="IN_REVIEW">En revisión</TabsTrigger>
          <TabsTrigger value="RESOLVED">Resueltos</TabsTrigger>
        </TabsList>
      </Tabs>

      <div className="space-y-3">
        {filtered.map((inc, i) => (
          <motion.div
            key={inc.id}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05 }}
          >
            <Card className={inc.status === "OPEN" ? "border-red-200" : ""}>
              <CardContent className="pt-4">
                <div className="flex items-start gap-3">
                  <div className={`w-10 h-10 rounded-lg flex items-center justify-center shrink-0 ${
                    inc.status === "OPEN" ? "bg-red-100" : inc.status === "IN_REVIEW" ? "bg-yellow-100" : "bg-green-100"
                  }`}>
                    <AlertTriangle className={`w-5 h-5 ${
                      inc.status === "OPEN" ? "text-red-600" : inc.status === "IN_REVIEW" ? "text-yellow-600" : "text-green-600"
                    }`} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1 flex-wrap">
                      <span className="text-xs font-mono text-muted-foreground">{inc.id}</span>
                      <Badge className={`text-[10px] ${statusColors[inc.status]}`}>{inc.statusLabel}</Badge>
                      <Badge variant="outline" className="text-[10px]">{inc.typeLabel}</Badge>
                    </div>
                    <p className="text-sm font-medium">Contra: {inc.against}</p>
                    <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{inc.description}</p>
                    <div className="flex items-center gap-3 mt-2 text-xs text-muted-foreground">
                      <span>Reportado por: {inc.reporter} ({inc.reporterRole})</span>
                      <span className="flex items-center gap-1"><Clock className="w-3 h-3" />{inc.createdAt}</span>
                    </div>
                  </div>
                  {inc.status !== "RESOLVED" && (
                    <Dialog>
                      <DialogTrigger asChild>
                        <Button size="sm" variant="outline" className="shrink-0 gap-1">
                          <Gavel className="w-3 h-3" /> Resolver
                        </Button>
                      </DialogTrigger>
                      <DialogContent>
                        <DialogHeader>
                          <DialogTitle>Resolver incidente {inc.id}</DialogTitle>
                        </DialogHeader>
                        <div className="space-y-4">
                          <div>
                            <Label>Acción</Label>
                            <Select value={selectedAction} onValueChange={setSelectedAction}>
                              <SelectTrigger><SelectValue placeholder="Selecciona acción" /></SelectTrigger>
                              <SelectContent>
                                <SelectItem value="WARNING">Advertencia al taller</SelectItem>
                                <SelectItem value="SUSPEND">Suspender taller</SelectItem>
                                <SelectItem value="REFUND">Reembolso al motociclista</SelectItem>
                                <SelectItem value="DISMISS">Desestimar incidente</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                          <div>
                            <Label>Resolución *</Label>
                            <Textarea
                              value={resolution}
                              onChange={(e) => setResolution(e.target.value)}
                              placeholder="Describe la resolución del incidente..."
                              rows={3}
                            />
                          </div>
                        </div>
                        <DialogFooter>
                          <Button onClick={() => handleResolve(inc.id)}>Confirmar resolución</Button>
                        </DialogFooter>
                      </DialogContent>
                    </Dialog>
                  )}
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
