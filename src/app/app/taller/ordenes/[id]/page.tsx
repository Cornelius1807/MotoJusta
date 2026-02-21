"use client";

import { useState, useEffect, useRef } from "react";
import { useParams } from "next/navigation";
import { getWorkOrder, startService, completeService } from "@/app/actions/work-orders";
import { createChangeRequest } from "@/app/actions/change-requests";
import { addEvidence } from "@/app/actions/evidence";
import { uploadFile } from "@/app/actions/upload";
import { motion } from "framer-motion";
import { PageHeader } from "@/components/shared/page-header";
import { FeatureBadge } from "@/components/shared/feature-badge";
import { FeatureGate } from "@/components/shared/feature-gate";
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



export default function OrdenDetailPage() {
  const { id } = useParams();
  const [changeReason, setChangeReason] = useState("");
  const [changeAmount, setChangeAmount] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [order, setOrder] = useState<any>(null);
  const [evidence, setEvidence] = useState<any[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const evidenceInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    async function load() {
      try {
        const data = await getWorkOrder(id as string);
        if (data) {
          setOrder({
            id: data.orderNumber || data.id,
            moto: data.request?.motorcycle ? `${data.request.motorcycle.brand} ${data.request.motorcycle.model} (${data.request.motorcycle.year})` : "Moto",
            category: data.request?.category?.name || "Servicio",
            client: data.request?.user?.name || "Cliente",
            total: data.totalFinal ?? data.totalAgreed ?? 0,
            status: data.status,
            progress: data.status === "COMPLETADA" || data.status === "CERRADA" ? 100 : data.status === "EN_SERVICIO" ? 60 : 0,
            parts: data.quote?.parts?.map((p: any) => ({ name: p.name, type: p.partType, price: p.unitPrice, qty: p.quantity })) || [],
            realId: data.id,
          });
          if (data.evidences && data.evidences.length > 0) {
            setEvidence(data.evidences.map((e: any) => ({ id: e.id, stage: e.stage, label: e.description || e.fileName || "Evidencia", type: e.mediaType === "VIDEO" ? "video" : "photo" })));
          }
        }
      } catch (err) {
        console.error("Failed to load order", err);
      } finally {
        setIsLoading(false);
      }
    }
    load();
  }, [id]);

  const handleUploadEvidence = () => {
    evidenceInputRef.current?.click();
  };

  const handleEvidenceFileSelected = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    let url = "";
    let mediaType: "IMAGE" | "VIDEO" = "IMAGE";
    try {
      const fd = new FormData();
      fd.append("file", file);
      const result = await uploadFile(fd, "evidence-media");
      url = result.url;
      mediaType = result.mediaType;
    } catch {
      // Supabase not configured — fallback to local object URL
      url = URL.createObjectURL(file);
      mediaType = file.type.startsWith("video") ? "VIDEO" : "IMAGE";
    }
    try {
      await addEvidence({
        workOrderId: order.realId || (id as string),
        stage: "DURING",
        url,
        mediaType,
        description: "Evidencia del proceso",
      });
      toast.success("Evidencia subida correctamente");
      setEvidence((prev) => [...prev, { id: Date.now().toString(), stage: "DURING", label: file.name, type: mediaType === "VIDEO" ? "video" : "photo" }]);
    } catch (err: any) {
      toast.error("Error al subir evidencia", { description: err.message });
    }
    if (e.target) e.target.value = "";
  };

  const handleRequestChange = async () => {
    if (!changeReason || changeReason.length < 20) {
      toast.error("La justificación debe tener al menos 20 caracteres");
      return;
    }
    setIsSubmitting(true);
    try {
      await createChangeRequest({
        workOrderId: order.realId || (id as string),
        description: changeReason,
        justification: changeReason,
        additionalCost: parseFloat(changeAmount) || 0,
      });
      toast.success("Solicitud de cambio enviada", {
        description: "El motociclista debe aprobar este cambio antes de continuar.",
      });
      setChangeReason("");
      setChangeAmount("");
    } catch (err: any) {
      toast.error("Error al enviar cambio", { description: err.message });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleComplete = async () => {
    try {
      await completeService(order.realId || (id as string));
      toast.success("Orden marcada como completada", {
        description: "Se notificará al motociclista para que recoja su moto.",
      });
      setOrder({ ...order, status: "COMPLETADA", progress: 100 });
    } catch (err: any) {
      toast.error("Error al completar orden", { description: err.message });
    }
  };

  const handleStart = async () => {
    try {
      await startService(order.realId || (id as string));
      toast.success("Servicio iniciado");
      setOrder({ ...order, status: "EN_SERVICIO", progress: 30 });
    } catch (err: any) {
      toast.error("Error al iniciar servicio", { description: err.message });
    }
  };

  if (isLoading || !order) {
    return (
      <div className="pb-20 lg:pb-0">
        <PageHeader title={`Orden ${id}`} description="Cargando..." badge="MVP" />
        <div className="space-y-4">
          {[1, 2, 3].map((i) => <div key={i} className="h-32 rounded-lg bg-secondary animate-pulse" />)}
        </div>
      </div>
    );
  }

  return (
    <div className="pb-20 lg:pb-0">
      <PageHeader title={`Orden ${order.id || id}`} description={`${order.moto} • ${order.category}`} badge="MVP" />

      {/* HU-19 Status timeline */}
      <Card className="mb-6">
        <CardContent className="pt-4">
          <p className="text-sm font-medium mb-3">Progreso de la orden</p>
          <div className="flex items-center gap-1">
            {[
              { label: "Recibida", status: "PENDIENTE" },
              { label: "Diagnóstico / En proceso", status: "EN_SERVICIO" },
              { label: "Lista para entrega", status: "COMPLETADA" },
              { label: "Entregada", status: "CERRADA" },
            ].map((stage) => {
              const statusOrder = ["PENDIENTE", "EN_SERVICIO", "COMPLETADA", "CERRADA"];
              const currentIdx = statusOrder.indexOf(order.status);
              const stageIdx = statusOrder.indexOf(stage.status);
              const isDone = stageIdx <= currentIdx;
              const isCurrent = stageIdx === currentIdx;
              return (
                <div key={stage.status} className="flex-1 flex flex-col items-center">
                  <div className={`w-full h-2 rounded-full mb-2 ${isDone ? "bg-primary" : "bg-secondary"} ${isCurrent ? "ring-2 ring-primary/30" : ""}`} />
                  <span className={`text-[10px] text-center leading-tight ${isDone ? "text-primary font-medium" : "text-muted-foreground"}`}>
                    {stage.label}
                  </span>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Progress */}
      <Card className="mb-6">
        <CardContent className="pt-4">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <Wrench className="w-4 h-4 text-primary" />
              <span className="text-sm font-medium">Progreso del servicio</span>
            </div>
            <span className="text-sm font-bold text-primary">{order.progress}%</span>
          </div>
          <Progress value={order.progress} className="h-2" />
          <div className="flex justify-between mt-3">
            {order.status === "PENDIENTE" && (
              <Button variant="outline" size="sm" onClick={handleStart} className="gap-1">
                <Wrench className="w-3 h-3" /> Iniciar servicio
              </Button>
            )}
            {(order.status === "EN_SERVICIO" || order.status === "EN_PROCESO") && (
              <Button variant="outline" size="sm" onClick={handleComplete} className="gap-1">
                <CheckCircle2 className="w-3 h-3" /> Marcar completada
              </Button>
            )}
            {order.status === "COMPLETADA" && (
              <Badge className="bg-green-100 text-green-800">Completada</Badge>
            )}
            <span className="text-sm font-semibold text-primary">S/ {order.total}</span>
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
          <FeatureGate flag="hu21_evidencia_trabajo" fallback={<Card><CardContent className="pt-6 text-center text-sm text-muted-foreground">Evidencia fotográfica deshabilitada por el administrador.</CardContent></Card>}>
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <CardTitle className="text-base">Evidencia fotográfica</CardTitle>
                  <FeatureBadge type="EXTRA" />
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Upload area */}
              <input
                ref={evidenceInputRef}
                type="file"
                accept="image/jpeg,image/png,image/webp,video/mp4"
                className="hidden"
                onChange={handleEvidenceFileSelected}
              />
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
                {evidence.map((ev) => (
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
          </FeatureGate>
        </TabsContent>

        {/* Change requests tab (HU-22) */}
        <TabsContent value="changes" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <CardTitle className="text-base">Solicitar cambio</CardTitle>
                <FeatureBadge type="MVP" />
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
              <Button onClick={handleRequestChange} disabled={isSubmitting} variant="outline" className="w-full gap-2">
                <AlertTriangle className="w-4 h-4" />
                {isSubmitting ? "Enviando..." : "Enviar solicitud de cambio"}
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
                  <span className="font-medium">{order.client}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Moto</span>
                  <span className="font-medium">{order.moto}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Categoría</span>
                  <span className="font-medium">{order.category}</span>
                </div>
              </div>
              <Separator />
              <div>
                <p className="text-sm font-medium mb-2">Desglose</p>
                {order.parts.map((p: any, i: number) => (
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
                  <span className="text-primary">S/ {order.total}</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
