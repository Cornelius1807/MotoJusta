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
} from "lucide-react";

const orderData = {
  id: "ORD-002",
  status: "COMPLETADA",
  moto: "Honda CB 190R (2023)",
  category: "Mantenimiento general",
  workshop: "MotoFix Pro",
  workshopRating: 4.8,
  district: "San Isidro",
  total: 250,
  startDate: "8 ene 2025",
  endDate: "10 ene 2025",
  parts: [
    { name: "Aceite Motul 5100 10W-40", type: "OEM", price: 75, qty: 2 },
    { name: "Filtro de aceite OEM Honda", type: "OEM", price: 35, qty: 1 },
    { name: "Filtro de aire", type: "AFTERMARKET", price: 25, qty: 1 },
    { name: "Mano de obra", type: "LABOR", price: 40, qty: 1 },
  ],
  evidence: [
    { stage: "BEFORE", label: "Estado inicial del motor" },
    { stage: "DURING", label: "Proceso de cambio de aceite" },
    { stage: "AFTER", label: "Motor con aceite nuevo" },
  ],
  changeRequests: [
    {
      reason: "Se encontró que el filtro de aire también necesita cambio, está muy desgastado y reduce rendimiento",
      amount: 25,
      status: "APPROVED",
      approvedAt: "9 ene 2025",
    },
  ],
};

export default function OrdenDetailPage() {
  const { id } = useParams();
  const [rating, setRating] = useState<number>(0);
  const [reviewComment, setReviewComment] = useState("");
  const [reviewSubmitted, setReviewSubmitted] = useState(false);

  const handleSubmitReview = () => {
    if (rating === 0) {
      toast.error("Selecciona una calificación");
      return;
    }
    if (rating <= 2 && reviewComment.length < 20) {
      toast.error("Calificaciones de 2 o menos requieren un comentario de al menos 20 caracteres");
      return;
    }
    setReviewSubmitted(true);
    toast.success("Reseña enviada exitosamente", { description: `Calificación: ${rating}/5` });
  };

  return (
    <div className="pb-20 lg:pb-0">
      <PageHeader title={`Orden ${id}`} description={`${orderData.moto} • ${orderData.category}`} badge="MVP" />

      {/* Status */}
      <Card className="mb-6 border-green-200 bg-green-50/30">
        <CardContent className="pt-4 flex items-center gap-3">
          <CheckCircle2 className="w-6 h-6 text-green-600" />
          <div>
            <p className="font-semibold text-green-800">Servicio completado</p>
            <p className="text-xs text-green-600">{orderData.startDate} → {orderData.endDate}</p>
          </div>
          <div className="ml-auto text-right">
            <p className="text-lg font-bold text-primary">S/ {orderData.total}</p>
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
                <span className="text-sm">{orderData.moto}</span>
              </div>
              <div className="flex items-center gap-3">
                <Store className="w-4 h-4 text-muted-foreground" />
                <span className="text-sm">{orderData.workshop}</span>
                <div className="flex items-center gap-1 text-xs">
                  <Star className="w-3 h-3 text-yellow-500 fill-yellow-500" />{orderData.workshopRating}
                </div>
              </div>
              <div className="flex items-center gap-3">
                <Wrench className="w-4 h-4 text-muted-foreground" />
                <span className="text-sm">{orderData.category}</span>
              </div>
              <Separator />
              <div>
                <p className="text-sm font-medium mb-2">Desglose de costos</p>
                {orderData.parts.map((p, i) => (
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
                  <span className="text-primary">S/ {orderData.total}</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Receipt (HU-25) */}
          <Card>
            <CardContent className="pt-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Receipt className="w-4 h-4 text-primary" />
                  <span className="text-sm font-medium">Recibo digital</span>
                  <FeatureBadge type="EXTRA" />
                </div>
                <Button variant="outline" size="sm" className="gap-1">
                  <Download className="w-3 h-3" /> Descargar PDF
                </Button>
              </div>
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
            <CardContent className="space-y-3">
              {orderData.evidence.map((ev, i) => (
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
              {orderData.changeRequests.map((cr, i) => (
                <div key={i} className="p-3 rounded-lg border">
                  <div className="flex items-center gap-2 mb-2">
                    <Badge className="bg-green-100 text-green-800 text-[10px]">
                      <CheckCircle2 className="w-3 h-3 mr-1" /> Aprobado
                    </Badge>
                    <span className="text-xs text-muted-foreground">{cr.approvedAt}</span>
                  </div>
                  <p className="text-sm">{cr.reason}</p>
                  {cr.amount > 0 && (
                    <p className="text-sm font-medium text-primary mt-1">+S/ {cr.amount}</p>
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
