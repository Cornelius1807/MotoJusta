"use client";

import { useState } from "react";
import { useParams } from "next/navigation";
import { motion } from "framer-motion";
import { PageHeader } from "@/components/shared/page-header";
import { FeatureBadge } from "@/components/shared/feature-badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";
import {
  Wrench,
  Camera,
  Upload,
  FileText,
  AlertTriangle,
  CheckCircle2,
  Clock,
  MessageSquare,
  Plus,
} from "lucide-react";

const orderData = {
  id: "ORD-001",
  moto: "Honda CB 190R (2023)",
  category: "Frenos",
  client: "Juan Pérez",
  total: 155,
  status: "EN_PROCESO",
  progress: 60,
  parts: [
    { name: "Pastillas genéricas premium", type: "AFTERMARKET", price: 85, qty: 1 },
    { name: "Mano de obra", type: "LABOR", price: 70, qty: 1 },
  ],
};

const evidenceItems = [
  { id: "1", stage: "BEFORE", label: "Estado inicial - pastillas desgastadas", type: "photo" },
  { id: "2", stage: "DURING", label: "Proceso de desmontaje del caliper", type: "photo" },
];

export default function OrdenDetailPage() {
  const { id } = useParams();
  const [changeReason, setChangeReason] = useState("");
  const [changeAmount, setChangeAmount] = useState("");

  const handleUploadEvidence = () => {
    toast.success("Evidencia subida correctamente");
  };

  const handleRequestChange = () => {
    if (!changeReason || changeReason.length < 20) {
      toast.error("La justificación debe tener al menos 20 caracteres");
      return;
    }
    toast.success("Solicitud de cambio enviada", {
      description: "El motociclista debe aprobar este cambio antes de continuar.",
    });
    setChangeReason("");
    setChangeAmount("");
  };

  const handleComplete = () => {
    toast.success("Orden marcada como completada", {
      description: "Se notificará al motociclista para que recoja su moto.",
    });
  };

  return (
    <div className="pb-20 lg:pb-0">
      <PageHeader title={`Orden ${id}`} description={`${orderData.moto} • ${orderData.category}`} badge="MVP" />

      {/* Progress */}
      <Card className="mb-6">
        <CardContent className="pt-4">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <Wrench className="w-4 h-4 text-primary" />
              <span className="text-sm font-medium">Progreso del servicio</span>
            </div>
            <span className="text-sm font-bold text-primary">{orderData.progress}%</span>
          </div>
          <Progress value={orderData.progress} className="h-2" />
          <div className="flex justify-between mt-3">
            <Button variant="outline" size="sm" onClick={handleComplete} className="gap-1">
              <CheckCircle2 className="w-3 h-3" /> Marcar completada
            </Button>
            <span className="text-sm font-semibold text-primary">S/ {orderData.total}</span>
          </div>
        </CardContent>
      </Card>

      <Tabs defaultValue="evidence" className="space-y-4">
        <TabsList className="w-full justify-start overflow-x-auto">
          <TabsTrigger value="evidence" className="gap-1">
            <Camera className="w-3 h-3" /> Evidencias
          </TabsTrigger>
          <TabsTrigger value="changes" className="gap-1">
            <AlertTriangle className="w-3 h-3" /> Cambios
          </TabsTrigger>
          <TabsTrigger value="details" className="gap-1">
            <FileText className="w-3 h-3" /> Detalle
          </TabsTrigger>
        </TabsList>

        {/* Evidence tab (HU-21) */}
        <TabsContent value="evidence" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <CardTitle className="text-base">Evidencia fotográfica</CardTitle>
                  <FeatureBadge badge="EXTRA" />
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Upload area */}
              <div
                className="border-2 border-dashed border-border rounded-xl p-6 text-center hover:border-primary/50 transition-colors cursor-pointer"
                onClick={handleUploadEvidence}
              >
                <Upload className="w-8 h-8 mx-auto text-muted-foreground mb-2" />
                <p className="text-sm text-muted-foreground">Subir evidencia (antes, durante o después)</p>
                <p className="text-xs text-muted-foreground mt-1">Fotos o videos del proceso</p>
              </div>

              {/* Existing evidence */}
              <div className="space-y-2">
                {evidenceItems.map((ev) => (
                  <div key={ev.id} className="flex items-center gap-3 p-3 rounded-lg bg-secondary/50">
                    <div className="w-12 h-12 rounded-lg bg-secondary flex items-center justify-center">
                      <Camera className="w-5 h-5 text-muted-foreground" />
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-medium">{ev.label}</p>
                      <Badge variant="outline" className="text-[10px] mt-1">
                        {ev.stage === "BEFORE" ? "Antes" : ev.stage === "DURING" ? "Durante" : "Después"}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Change requests tab (HU-22) */}
        <TabsContent value="changes" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <CardTitle className="text-base">Solicitar cambio</CardTitle>
                <FeatureBadge badge="MVP" />
              </div>
              <p className="text-xs text-muted-foreground">
                Cualquier cambio en repuestos o costos debe ser aprobado por el motociclista (bloqueante).
              </p>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label>Justificación del cambio * (mín. 20 caracteres)</Label>
                <Textarea
                  value={changeReason}
                  onChange={(e) => setChangeReason(e.target.value)}
                  placeholder="Explica por qué necesitas hacer este cambio..."
                  rows={3}
                />
                <p className={`text-xs mt-1 ${changeReason.length < 20 ? "text-destructive" : "text-muted-foreground"}`}>
                  {changeReason.length}/20 caracteres mínimo
                </p>
              </div>
              <div>
                <Label>Diferencia de costo (S/)</Label>
                <Input
                  type="number"
                  value={changeAmount}
                  onChange={(e) => setChangeAmount(e.target.value)}
                  placeholder="25"
                />
              </div>
              <Button onClick={handleRequestChange} variant="outline" className="w-full gap-2">
                <AlertTriangle className="w-4 h-4" />
                Enviar solicitud de cambio
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Details tab */}
        <TabsContent value="details">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Detalle de la orden</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Cliente</span>
                  <span className="font-medium">{orderData.client}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Moto</span>
                  <span className="font-medium">{orderData.moto}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Categoría</span>
                  <span className="font-medium">{orderData.category}</span>
                </div>
              </div>
              <Separator />
              <div>
                <p className="text-sm font-medium mb-2">Desglose</p>
                {orderData.parts.map((p, i) => (
                  <div key={i} className="flex justify-between text-sm py-1">
                    <span className="text-muted-foreground">
                      {p.name}
                      {p.type !== "LABOR" && (
                        <Badge variant="outline" className="ml-1 text-[9px] py-0 px-1">{p.type}</Badge>
                      )}
                    </span>
                    <span>S/ {p.price * p.qty}</span>
                  </div>
                ))}
                <Separator className="my-2" />
                <div className="flex justify-between text-sm font-semibold">
                  <span>Total</span>
                  <span className="text-primary">S/ {orderData.total}</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
