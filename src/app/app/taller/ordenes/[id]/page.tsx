"use client";

import { useState, useEffect, useRef } from "react";
import { useParams } from "next/navigation";
import { getWorkshopOrders } from "@/app/actions/work-orders";
import { completeService } from "@/app/actions/work-orders";
import { addEvidence } from "@/app/actions/evidence";
import { createChangeRequest } from "@/app/actions/change-requests";
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
import { Skeleton } from "@/components/ui/skeleton";
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
  const [order, setOrder] = useState<any>(null);
  const [evidence, setEvidence] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const evidenceInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    async function load() {
      try {
        const orders = await getWorkshopOrders();
        const found = orders?.find((o: any) => o.id === id);
        if (found) {
          setOrder({
            id: found.id,
            moto: `${found.request?.motorcycle?.brand || "Moto"} ${found.request?.motorcycle?.model || ""}${found.request?.motorcycle?.year ? ` (${found.request.motorcycle.year})` : ""}`,
            category: found.request?.category?.name || "Servicio",
            client: found.request?.user?.name || "Cliente",
            total: found.totalFinal ?? found.totalAgreed ?? 0,
            status: found.status,
            progress: found.status === "COMPLETADA" ? 100 : found.status === "EN_SERVICIO" || found.status === "EN_PROCESO" ? 60 : 0,
            parts: found.quote?.parts?.map((p: any) => ({ name: p.name, type: p.partType, price: p.unitPrice, qty: p.quantity })) || [],
          });
          if (found.evidence && found.evidence.length > 0) {
            setEvidence(found.evidence.map((e: any) => ({ id: e.id, stage: e.stage, label: e.description || e.stage, type: e.mediaType === "VIDEO" ? "video" : "photo" })));
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

  const handleUploadEvidence = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const mediaType = file.type.startsWith("video") ? "VIDEO" : "PHOTO";
    try {
      // In production, upload to storage first
      await addEvidence({ workOrderId: id as string, stage: "DURING", mediaType, url: URL.createObjectURL(file), description: file.name });
      setEvidence((prev: any[]) => [...prev, { id: Date.now().toString(), stage: "DURING", label: file.name, type: mediaType === "VIDEO" ? "video" : "photo" }]);
      toast.success("Evidencia subida correctamente");
    } catch (err: any) {
      toast.error("Error al subir evidencia", { description: err.message });
    }
  };

  const handleRequestChange = async () => {
    if (!changeReason || changeReason.length < 20) {
      toast.error("La justificación debe tener al menos 20 caracteres");
      return;
    }
    try {
      await createChangeRequest({
        workOrderId: id as string,
        description: changeReason,
        justification: changeReason,
        additionalCost: changeAmount ? parseFloat(changeAmount) : 0,
      });
      toast.success("Solicitud de cambio enviada", {
        description: "El motociclista recibirá una notificación para aprobar el cambio.",
      });
      setChangeReason("");
      setChangeAmount("");
    } catch (err: any) {
      toast.error("Error al solicitar cambio", { description: err.message });
    }
  };

  const handleComplete = async () => {
    try {
      await completeService(id as string);
      toast.success("Orden completada", { description: "Se notificará al motociclista." });
      if (order) setOrder({ ...order, status: "COMPLETADA", progress: 100 });
    } catch (err: any) {
      toast.error("Error al completar", { description: err.message });
    }
  };

  if (isLoading || !order) {
    return (
      <div className="pb-20 lg:pb-0">
        <PageHeader title={`Orden ${id}`} description="Cargando..." badge="MVP" />
        <div className="space-y-4">
          {[1, 2, 3].map((i) => <Skeleton key={i} className="h-40 w-full rounded-lg" />)}
        </div>
      </div>
    );
  }

  return (
    <div className="pb-20 lg:pb-0">
      <PageHeader title={`Orden ${id}`} description={`${order.moto} • ${order.category}`} badge="MVP" />

      {/* Progress */}
      <Card className="mb-4">
        <CardContent className="pt-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium">Progreso</span>
            <span className="text-sm text-muted-foreground">{order.progress}%</span>
          </div>
          <Progress value={order.progress} className="h-2" />
          <div className="flex items-center justify-between mt-3 text-xs text-muted-foreground">
            <span>Cliente: {order.client}</span>
            <span>Total: S/ {order.total}</span>
          </div>
        </CardContent>
      </Card>

      <Tabs defaultValue="detail" className="space-y-4">
        <TabsList className="w-full justify-start overflow-x-auto">
          <TabsTrigger value="detail" className="gap-1">
            <FileText className="w-3 h-3" /> Detalle
          </TabsTrigger>
          <TabsTrigger value="evidence" className="gap-1">
            <Camera className="w-3 h-3" /> Evidencia
          </TabsTrigger>
          <TabsTrigger value="changes" className="gap-1">
            <AlertTriangle className="w-3 h-3" /> Cambios
          </TabsTrigger>
        </TabsList>

        {/* Detail tab */}
        <TabsContent value="detail" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Repuestos y costos</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-1">
                {order.parts.map((p: any, i: number) => (
                  <div key={i} className="flex justify-between text-sm">
                    <span className="text-muted-foreground">
                      {p.name}
                      {p.type && p.type !== "LABOR" && (
                        <Badge variant="outline" className="ml-1 text-[9px] py-0 px-1">{p.type}</Badge>
                      )}
                    </span>
                    <span>S/ {p.price}</span>
                  </div>
                ))}
                <Separator className="my-2" />
                <div className="flex justify-between font-semibold">
                  <span>Total</span>
                  <span className="text-primary">S/ {order.total}</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {order.status !== "COMPLETADA" && order.status !== "CERRADA" && (
            <Button className="w-full" onClick={handleComplete}>
              <CheckCircle2 className="w-4 h-4 mr-2" /> Marcar como completada
            </Button>
          )}
        </TabsContent>

        {/* Evidence tab (HU-21) */}
        <TabsContent value="evidence" className="space-y-4">
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
                accept="image/*,video/*"
                className="hidden"
                onChange={handleUploadEvidence}
              />
              <Button variant="outline" className="w-full gap-2" onClick={() => evidenceInputRef.current?.click()}>
                <Upload className="w-4 h-4" /> Subir evidencia
              </Button>

              {evidence.length === 0 ? (
                <div className="text-center py-6">
                  <Camera className="w-8 h-8 mx-auto text-muted-foreground mb-2" />
                  <p className="text-sm text-muted-foreground">No hay evidencia aún</p>
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-3">
                  {evidence.map((ev: any) => (
                    <div key={ev.id} className="border rounded-lg p-2">
                      <div className="flex items-center gap-1 mb-1">
                        <Badge variant="outline" className="text-[10px]">{ev.stage}</Badge>
                        <Badge variant="secondary" className="text-[10px]">{ev.type}</Badge>
                      </div>
                      <div className="h-24 bg-secondary rounded flex items-center justify-center">
                        <Camera className="w-5 h-5 text-muted-foreground" />
                      </div>
                      <p className="text-[10px] text-muted-foreground mt-1 truncate">{ev.label}</p>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
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
                  onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setChangeReason(e.target.value)}
                  placeholder="Explica por qué se necesita el cambio..."
                  rows={3}
                />
                {changeReason.length > 0 && changeReason.length < 20 && (
                  <p className="text-xs text-destructive mt-1">{20 - changeReason.length} caracteres más requeridos</p>
                )}
              </div>
              <div>
                <Label>Nuevo monto (opcional)</Label>
                <Input
                  type="number"
                  value={changeAmount}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setChangeAmount(e.target.value)}
                  placeholder="S/ 0.00"
                />
              </div>
              <Button className="w-full" onClick={handleRequestChange} disabled={changeReason.length < 20}>
                <AlertTriangle className="w-4 h-4 mr-2" /> Solicitar cambio
              </Button>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
