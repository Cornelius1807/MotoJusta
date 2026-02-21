"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import { getUserOrders } from "@/app/actions/work-orders";
import { createReview } from "@/app/actions/reviews";
import { motion } from "framer-motion";
import { PageHeader } from "@/components/shared/page-header";
import { FeatureBadge } from "@/components/shared/feature-badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Progress } from "@/components/ui/progress";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Skeleton } from "@/components/ui/skeleton";
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
} from "lucide-react";

export default function OrdenDetailPage() {
  const { id } = useParams();
  const [rating, setRating] = useState<number>(0);
  const [reviewComment, setReviewComment] = useState("");
  const [reviewSubmitted, setReviewSubmitted] = useState(false);
  const [order, setOrder] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const orders = await getUserOrders();
        const found = orders?.find((o: any) => o.id === id);
        if (found) {
          setOrder({
            id: found.id,
            status: found.status,
            moto: `${found.request?.motorcycle?.brand || "Moto"} ${found.request?.motorcycle?.model || ""}${found.request?.motorcycle?.year ? ` (${found.request.motorcycle.year})` : ""}`,
            category: found.request?.category?.name || "Servicio",
            workshop: found.workshop?.name || "Taller",
            workshopRating: found.workshop?.rating || 0,
            district: found.workshop?.district || "",
            total: found.totalFinal ?? found.totalAgreed ?? 0,
            startDate: found.startedAt ? new Date(found.startedAt).toLocaleDateString("es-PE", { day: "numeric", month: "short", year: "numeric" }) : "",
            endDate: found.completedAt ? new Date(found.completedAt).toLocaleDateString("es-PE", { day: "numeric", month: "short", year: "numeric" }) : "",
            parts: found.quote?.parts?.map((p: any) => ({ name: p.name, type: p.partType, price: p.unitPrice, qty: p.quantity })) || [],
            evidence: found.evidence?.map((e: any) => ({ stage: e.stage, label: e.description || e.stage })) || [],
            changeRequests: found.changeRequests?.map((cr: any) => ({ reason: cr.reason, amount: cr.newAmount, status: cr.status, approvedAt: cr.resolvedAt ? new Date(cr.resolvedAt).toLocaleDateString("es-PE") : "" })) || [],
            review: found.review || null,
          });
          if (found.review) setReviewSubmitted(true);
        }
      } catch (err) {
        console.error("Failed to load order", err);
      } finally {
        setIsLoading(false);
      }
    }
    load();
  }, [id]);

  const handleSubmitReview = async () => {
    if (rating === 0 || !reviewComment.trim()) {
      toast.error("Completa la calificación y el comentario");
      return;
    }
    try {
      await createReview({ workOrderId: id as string, rating, comment: reviewComment });
      setReviewSubmitted(true);
      toast.success("Reseña enviada", { description: "Gracias por tu evaluación." });
    } catch (err: any) {
      toast.error("Error al enviar reseña", { description: err.message });
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

      {/* Status & progress */}
      <div className="flex flex-wrap gap-2 mb-4">
        <Badge className={order.status === "COMPLETADA" ? "bg-green-100 text-green-800" : "bg-yellow-100 text-yellow-800"}>
          {order.status === "COMPLETADA" ? "Completada" : order.status === "EN_PROCESO" || order.status === "EN_SERVICIO" ? "En proceso" : order.status}
        </Badge>
      </div>

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
          <TabsTrigger value="review" className="gap-1">
            <Star className="w-3 h-3" /> Reseña
          </TabsTrigger>
        </TabsList>

        {/* Detail tab */}
        <TabsContent value="detail" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Información del servicio</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center gap-2 text-sm">
                <Bike className="w-4 h-4 text-muted-foreground" />
                <span>{order.moto}</span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <Wrench className="w-4 h-4 text-muted-foreground" />
                <span>{order.category}</span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <Store className="w-4 h-4 text-muted-foreground" />
                <span>{order.workshop} • ⭐ {order.workshopRating}</span>
              </div>
              <Separator />
              <div>
                <p className="text-sm font-medium mb-2">Desglose de costos</p>
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
              </div>
              {order.startDate && (
                <div className="flex items-center gap-2 text-xs text-muted-foreground mt-2">
                  <Clock className="w-3 h-3" />
                  {order.startDate}{order.endDate ? ` - ${order.endDate}` : " - En curso"}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Evidence tab (HU-21) */}
        <TabsContent value="evidence">
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <CardTitle className="text-base">Evidencia fotográfica</CardTitle>
                <FeatureBadge type="EXTRA" />
              </div>
            </CardHeader>
            <CardContent>
              {order.evidence.length === 0 ? (
                <div className="text-center py-8">
                  <Camera className="w-8 h-8 mx-auto text-muted-foreground mb-2" />
                  <p className="text-sm text-muted-foreground">No hay evidencia aún</p>
                  <p className="text-xs text-muted-foreground">El taller subirá fotos del antes, durante y después.</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {order.evidence.map((ev: any, i: number) => (
                    <div key={i} className="border rounded-lg p-3">
                      <div className="flex items-center gap-2 mb-2">
                        <Badge variant="outline" className="text-[10px]">{ev.stage}</Badge>
                      </div>
                      <div className="h-32 bg-secondary rounded flex items-center justify-center">
                        <Camera className="w-6 h-6 text-muted-foreground" />
                      </div>
                      <p className="text-xs text-muted-foreground mt-1">{ev.label}</p>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Changes tab (HU-22) */}
        <TabsContent value="changes">
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <CardTitle className="text-base">Cambios solicitados</CardTitle>
                <FeatureBadge type="MVP" />
              </div>
            </CardHeader>
            <CardContent>
              {order.changeRequests.length === 0 ? (
                <div className="text-center py-8">
                  <AlertTriangle className="w-8 h-8 mx-auto text-muted-foreground mb-2" />
                  <p className="text-sm text-muted-foreground">No hay cambios solicitados</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {order.changeRequests.map((cr: any, i: number) => (
                    <div key={i} className="border rounded-lg p-3">
                      <div className="flex items-center justify-between mb-1">
                        <Badge variant={cr.status === "APPROVED" ? "default" : "outline"} className="text-[10px]">
                          {cr.status === "APPROVED" ? "Aprobado" : cr.status === "REJECTED" ? "Rechazado" : "Pendiente"}
                        </Badge>
                        {cr.amount && <span className="text-sm font-semibold">+S/ {cr.amount}</span>}
                      </div>
                      <p className="text-sm">{cr.reason}</p>
                      {cr.approvedAt && <p className="text-xs text-muted-foreground mt-1">Resuelto: {cr.approvedAt}</p>}
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Review tab (HU-23) */}
        <TabsContent value="review">
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <CardTitle className="text-base">Reseña del servicio</CardTitle>
                <FeatureBadge type="MVP" />
              </div>
            </CardHeader>
            <CardContent>
              {reviewSubmitted ? (
                <div className="text-center py-6">
                  <CheckCircle2 className="w-10 h-10 mx-auto text-green-500 mb-2" />
                  <p className="text-sm font-medium">Reseña enviada</p>
                  <p className="text-xs text-muted-foreground mt-1">Gracias por evaluar el servicio de {order.workshop}</p>
                </div>
              ) : order.status !== "COMPLETADA" && order.status !== "CERRADA" ? (
                <div className="text-center py-6">
                  <Clock className="w-8 h-8 mx-auto text-muted-foreground mb-2" />
                  <p className="text-sm text-muted-foreground">Podrás dejar una reseña cuando se complete el servicio.</p>
                </div>
              ) : (
                <div className="space-y-4">
                  <div>
                    <Label>Calificación</Label>
                    <div className="flex gap-1 mt-1">
                      {[1, 2, 3, 4, 5].map((s) => (
                        <button key={s} onClick={() => setRating(s)} className="focus:outline-none">
                          <Star className={`w-6 h-6 ${s <= rating ? "text-yellow-500 fill-yellow-500" : "text-gray-300"}`} />
                        </button>
                      ))}
                    </div>
                  </div>
                  <div>
                    <Label>Comentario</Label>
                    <Textarea
                      value={reviewComment}
                      onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setReviewComment(e.target.value)}
                      placeholder="Cuéntanos tu experiencia..."
                      rows={3}
                    />
                  </div>
                  <Button onClick={handleSubmitReview} className="w-full">
                    Enviar reseña
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
