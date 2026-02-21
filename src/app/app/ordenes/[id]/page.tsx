"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import { getWorkOrder, closeOrder } from "@/app/actions/work-orders";
import { approveChangeRequest, rejectChangeRequest } from "@/app/actions/change-requests";
import { createReview } from "@/app/actions/reviews";
import { generateDiagnosisSummary, generateGlossary } from "@/app/actions/ai";
import { motion } from "framer-motion";
import { PageHeader } from "@/components/shared/page-header";
import { FeatureBadge } from "@/components/shared/feature-badge";
import { FeatureGate } from "@/components/shared/feature-gate";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Progress } from "@/components/ui/progress";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { toast } from "sonner";
import {
  CheckCircle2,
  Clock,
  FileText,
  Star,
  Camera,
  AlertTriangle,
  MessageSquare,
  Download,
  Wrench,
  Bike,
  Store,
  Receipt,
  Sparkles,
} from "lucide-react";



export default function OrdenDetailPage() {
  const { id } = useParams();
  const [rating, setRating] = useState<number>(0);
  const [reviewComment, setReviewComment] = useState("");
  const [reviewSubmitted, setReviewSubmitted] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [order, setOrder] = useState<any>(null);
  const [isAiLoading, setIsAiLoading] = useState(false);
  const [aiDiagnosis, setAiDiagnosis] = useState<any>(null);

  useEffect(() => {
    async function load() {
      try {
        const data = await getWorkOrder(id as string);
        if (data) {
          setOrder({
            id: data.orderNumber || data.id,
            status: data.status,
            moto: data.request?.motorcycle ? `${data.request.motorcycle.brand} ${data.request.motorcycle.model} (${data.request.motorcycle.year})` : "Moto",
            category: data.request?.category?.name || "Servicio",
            workshop: data.workshop?.name || "Taller",
            workshopRating: data.workshop?.rating || 0,
            district: data.workshop?.district || "",
            total: data.totalFinal ?? data.totalAgreed ?? 0,
            startDate: data.startedAt ? new Date(data.startedAt).toLocaleDateString("es-PE", { day: "numeric", month: "short", year: "numeric" }) : "",
            endDate: data.completedAt ? new Date(data.completedAt).toLocaleDateString("es-PE", { day: "numeric", month: "short", year: "numeric" }) : "",
            parts: data.quote?.parts?.map((p: any) => ({ name: p.name, type: p.partType, price: p.unitPrice, qty: p.quantity })) || [],
            evidence: data.evidences?.map((e: any) => ({ stage: e.stage, label: e.description || e.fileName || "Evidencia" })) || [],
            changeRequests: data.changeRequests?.map((cr: any) => ({ id: cr.id, reason: cr.description, amount: cr.additionalCost, status: cr.status, approvedAt: cr.decidedAt ? new Date(cr.decidedAt).toLocaleDateString("es-PE") : "" })) || [],
            quoteId: data.quoteId,
            realId: data.id,
          });
          if (data.review) setReviewSubmitted(true);
        }
      } catch (err) {
        console.error("Failed to load order", err);
      } finally {
        setIsLoading(false);
      }
    }
    load();
  }, [id]);

  const handleDownloadReceipt = () => {
    const partsDetail = order.parts
      .map((p: any) => `${p.qty > 1 ? p.qty + 'x ' : ''}${p.name} (${p.type}) ... S/ ${p.price * p.qty}`)
      .join('\n');
    const receiptContent = `
RECIBO DE SERVICIO - MotoJusta
================================
Orden: ${order.id}
Moto: ${order.moto}
Taller: ${order.workshop}
Distrito: ${order.district}
Fecha: ${new Date().toLocaleDateString('es-PE')}
--------------------------------
${partsDetail}
--------------------------------
Total: S/ ${order.total}
Estado: ${order.status}
================================
Gracias por confiar en MotoJusta.
`.trim();
    const blob = new Blob([receiptContent], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `recibo-${order.id}.txt`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success("Recibo descargado");
  };

  const handleSubmitReview = async () => {
    if (rating === 0) {
      toast.error("Selecciona una calificación");
      return;
    }
    if (rating <= 2 && reviewComment.length < 20) {
      toast.error("Calificaciones de 2 o menos requieren un comentario de al menos 20 caracteres");
      return;
    }
    try {
      await createReview({ workOrderId: order.realId || (id as string), rating, comment: reviewComment || undefined });
      setReviewSubmitted(true);
      toast.success("Reseña enviada exitosamente", { description: `Calificación: ${rating}/5` });
    } catch (err: any) {
      toast.error("Error al enviar reseña", { description: err.message });
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
      <PageHeader title={`Orden ${id}`} description={`${order.moto} • ${order.category}`} badge="MVP" />

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
            ].map((stage, i, arr) => {
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

      {/* Status */}
      <Card className="mb-6 border-green-200 bg-green-50/30">
        <CardContent className="pt-4 flex items-center gap-3">
          <CheckCircle2 className="w-6 h-6 text-green-600" />
          <div>
            <p className="font-semibold text-green-800">{order.status === "COMPLETADA" ? "Servicio completado" : order.status === "CERRADA" ? "Orden cerrada" : "En proceso"}</p>
            <p className="text-xs text-green-600">{order.startDate} → {order.endDate}</p>
          </div>
          <div className="ml-auto text-right">
            <p className="text-lg font-bold text-primary">S/ {order.total}</p>
            {order.status === "COMPLETADA" && (
              <Button
                size="sm"
                variant="outline"
                className="mt-1"
                onClick={async () => {
                  try {
                    await closeOrder(order.realId || (id as string));
                    toast.success("Orden cerrada exitosamente");
                    setOrder({ ...order, status: "CERRADA" });
                  } catch (err: any) {
                    toast.error("Error al cerrar orden", { description: err.message });
                  }
                }}
              >
                Cerrar orden
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      <Tabs defaultValue="detail" className="space-y-4">
        <TabsList className="w-full justify-start overflow-x-auto">
          <TabsTrigger value="detail" className="gap-1">
            <FileText className="w-3 h-3" /> Detalle
          </TabsTrigger>
          <TabsTrigger value="evidence" className="gap-1">
            <Camera className="w-3 h-3" /> Evidencias
          </TabsTrigger>
          <TabsTrigger value="changes" className="gap-1">
            <AlertTriangle className="w-3 h-3" /> Cambios
          </TabsTrigger>
          <TabsTrigger value="review" className="gap-1">
            <Star className="w-3 h-3" /> Reseña
          </TabsTrigger>
        </TabsList>

        {/* Detail tab */}
        <TabsContent value="detail" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Información de la orden</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center gap-3">
                <Bike className="w-4 h-4 text-muted-foreground" />
                <span className="text-sm">{order.moto}</span>
              </div>
              <div className="flex items-center gap-3">
                <Store className="w-4 h-4 text-muted-foreground" />
                <span className="text-sm">{order.workshop}</span>
                <div className="flex items-center gap-1 text-xs">
                  <Star className="w-3 h-3 text-yellow-500 fill-yellow-500" />{order.workshopRating}
                </div>
              </div>
              <div className="flex items-center gap-3">
                <Wrench className="w-4 h-4 text-muted-foreground" />
                <span className="text-sm">{order.category}</span>
              </div>
              <Separator />
              <div>
                <p className="text-sm font-medium mb-2">Desglose de costos</p>
                {order.parts.map((p: any, i: number) => (
                  <div key={i} className="flex justify-between text-sm py-1.5 border-b last:border-0">
                    <span className="text-muted-foreground">
                      {p.qty > 1 ? `${p.qty}x ` : ""}{p.name}
                      {p.type !== "LABOR" && (
                        <Badge variant="outline" className="ml-1 text-[9px] py-0 px-1">{p.type}</Badge>
                      )}
                    </span>
                    <span className="font-medium">S/ {p.price * p.qty}</span>
                  </div>
                ))}
                <Separator className="my-2" />
                <div className="flex justify-between text-sm font-bold">
                  <span>Total</span>
                  <span className="text-primary">S/ {order.total}</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Receipt (HU-25) */}
          <FeatureGate flag="hu23_cierre_servicio">
          <Card>
            <CardContent className="pt-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Receipt className="w-4 h-4 text-primary" />
                  <span className="text-sm font-medium">Recibo digital</span>
                  <FeatureBadge type="EXTRA" />
                </div>
                <Button variant="outline" size="sm" className="gap-1" onClick={handleDownloadReceipt}>
                  <Download className="w-3 h-3" /> Descargar PDF
                </Button>
              </div>
            </CardContent>
          </Card>
          </FeatureGate>
        </TabsContent>

        {/* Evidence tab (HU-21) */}
        <TabsContent value="evidence">
          <FeatureGate flag="hu21_evidencia_trabajo" fallback={<Card><CardContent className="pt-6 text-center text-sm text-muted-foreground">Evidencia fotográfica deshabilitada por el administrador.</CardContent></Card>}>
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <CardTitle className="text-base">Evidencia fotográfica</CardTitle>
                <FeatureBadge type="EXTRA" />
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              {order.evidence.map((ev: any, i: number) => (
                <div key={i} className="flex items-center gap-3 p-3 rounded-lg bg-secondary/50">
                  <div className="w-16 h-16 rounded-lg bg-secondary flex items-center justify-center">
                    <Camera className="w-6 h-6 text-muted-foreground" />
                  </div>
                  <div>
                    <p className="text-sm font-medium">{ev.label}</p>
                    <Badge variant="outline" className="text-[10px] mt-1">
                      {ev.stage === "BEFORE" ? "📸 Antes" : ev.stage === "DURING" ? "🔧 Durante" : "✅ Después"}
                    </Badge>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
          </FeatureGate>
        </TabsContent>

        {/* Change requests tab (HU-22) */}
        <TabsContent value="changes">
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <CardTitle className="text-base">Solicitudes de cambio</CardTitle>
                <FeatureBadge type="MVP" />
              </div>
              <p className="text-xs text-muted-foreground">
                Cualquier cambio en el servicio debe ser aprobado por ti antes de ejecutarse.
              </p>
            </CardHeader>
            <CardContent className="space-y-3">
              <FeatureGate flag="hu33_ia_resumen_diagnostico">
              {order.quoteId && (
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full gap-1 mb-3"
                  disabled={isAiLoading}
                  onClick={async () => {
                    setIsAiLoading(true);
                    try {
                      const summary = await generateDiagnosisSummary(order.quoteId);
                      setAiDiagnosis(summary);
                      toast.success("Diagnóstico IA generado");
                    } catch (err: any) {
                      toast.error("Error", { description: err.message });
                    } finally {
                      setIsAiLoading(false);
                    }
                  }}
                >
                  <Sparkles className="w-3 h-3" /> {isAiLoading ? "Generando..." : "Diagnóstico IA"}
                </Button>
              )}
              {aiDiagnosis && (
                <div className="p-3 rounded-lg bg-primary/5 border border-primary/20 mb-3">
                  <p className="text-xs font-medium text-primary mb-1">Diagnóstico simplificado</p>
                  <p className="text-sm">{aiDiagnosis.diagnosisSimple || JSON.stringify(aiDiagnosis)}</p>
                </div>
              )}
              </FeatureGate>
              {order.changeRequests.map((cr: any, i: number) => (
                <div key={i} className="p-3 rounded-lg border">
                  <div className="flex items-center gap-2 mb-2">
                    <Badge className={`text-[10px] ${cr.status === "APPROVED" || cr.status === "APROBADO" ? "bg-green-100 text-green-800" : cr.status === "PENDIENTE" ? "bg-yellow-100 text-yellow-800" : "bg-red-100 text-red-800"}`}>
                      <CheckCircle2 className="w-3 h-3 mr-1" /> {cr.status === "APPROVED" || cr.status === "APROBADO" ? "Aprobado" : cr.status === "PENDIENTE" ? "Pendiente" : "Rechazado"}
                    </Badge>
                    {cr.approvedAt && <span className="text-xs text-muted-foreground">{cr.approvedAt}</span>}
                  </div>
                  <p className="text-sm">{cr.reason}</p>
                  {cr.amount > 0 && (
                    <p className="text-sm font-medium text-primary mt-1">+S/ {cr.amount}</p>
                  )}
                  {cr.status === "PENDIENTE" && cr.id && (
                    <div className="flex gap-2 mt-2">
                      <Button size="sm" onClick={async () => {
                        try { await approveChangeRequest(cr.id); toast.success("Cambio aprobado"); } catch (err: any) { toast.error(err.message); }
                      }}>Aprobar</Button>
                      <Button size="sm" variant="outline" onClick={async () => {
                        try { await rejectChangeRequest(cr.id); toast.success("Cambio rechazado"); } catch (err: any) { toast.error(err.message); }
                      }}>Rechazar</Button>
                    </div>
                  )}
                </div>
              ))}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Review tab (HU-24) */}
        <TabsContent value="review">
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <CardTitle className="text-base">Calificar servicio</CardTitle>
                <FeatureBadge type="MVP" />
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {reviewSubmitted ? (
                <div className="text-center py-8">
                  <CheckCircle2 className="w-12 h-12 text-green-500 mx-auto mb-3" />
                  <p className="font-semibold">¡Gracias por tu reseña!</p>
                  <p className="text-sm text-muted-foreground">Tu calificación ayuda a otros motociclistas</p>
                </div>
              ) : (
                <>
                  <div>
                    <Label className="text-sm mb-3 block">¿Cómo calificarías el servicio?</Label>
                    <div className="flex gap-2 justify-center">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <button
                          key={star}
                          onClick={() => setRating(star)}
                          className="transition-transform hover:scale-110"
                        >
                          <Star
                            className={`w-10 h-10 ${
                              star <= rating ? "text-yellow-500 fill-yellow-500" : "text-gray-300"
                            }`}
                          />
                        </button>
                      ))}
                    </div>
                    {rating > 0 && (
                      <p className="text-center text-sm mt-2 text-muted-foreground">
                        {rating === 1 ? "Muy malo" : rating === 2 ? "Malo" : rating === 3 ? "Regular" : rating === 4 ? "Bueno" : "Excelente"}
                      </p>
                    )}
                  </div>

                  <div>
                    <Label>Comentario {rating <= 2 ? "* (obligatorio para calificación ≤ 2)" : "(opcional)"}</Label>
                    <Textarea
                      value={reviewComment}
                      onChange={(e) => setReviewComment(e.target.value)}
                      placeholder="Describe tu experiencia con el servicio..."
                      rows={3}
                    />
                    {rating <= 2 && rating > 0 && reviewComment.length < 20 && (
                      <p className="text-xs text-destructive mt-1">{reviewComment.length}/20 caracteres mínimo</p>
                    )}
                  </div>

                  <Button onClick={handleSubmitReview} className="w-full gap-2">
                    <Star className="w-4 h-4" /> Enviar reseña
                  </Button>
                </>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
