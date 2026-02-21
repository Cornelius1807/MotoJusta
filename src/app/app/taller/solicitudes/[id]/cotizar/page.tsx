"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { createQuote } from "@/app/actions/quotes";
import { getServiceRequestById } from "@/app/actions/service-requests";
import { motion } from "framer-motion";
import { PageHeader } from "@/components/shared/page-header";
import { FeatureBadge } from "@/components/shared/feature-badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import {
  Plus,
  Trash2,
  Send,
  Wrench,
  Bike,
  MapPin,
  Info,
  Calculator,
} from "lucide-react";

interface PartItem {
  id: string;
  name: string;
  type: "OEM" | "AFTERMARKET" | "USED";
  price: number;
  quantity: number;
}

export default function CotizarPage() {
  const { id } = useParams();
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [requestData, setRequestData] = useState<any>(null);
  const [laborCost, setLaborCost] = useState("");
  const [diagnosis, setDiagnosis] = useState("");
  const [estimatedDays, setEstimatedDays] = useState("");
  const [message, setMessage] = useState("");
  const [parts, setParts] = useState<PartItem[]>([
    { id: "1", name: "", type: "OEM", price: 0, quantity: 1 },
  ]);

  useEffect(() => {
    async function load() {
      try {
        const data = await getServiceRequestById(id as string);
        if (data) setRequestData(data);
      } catch (err) {
        console.error("Failed to load request", err);
      } finally {
        setIsLoading(false);
      }
    }
    load();
  }, [id]);

  const addPart = () => {
    setParts([...parts, { id: Date.now().toString(), name: "", type: "OEM", price: 0, quantity: 1 }]);
  };

  const removePart = (partId: string) => {
    if (parts.length <= 1) return;
    setParts(parts.filter((p) => p.id !== partId));
  };

  const updatePart = (partId: string, field: keyof PartItem, value: string | number) => {
    setParts(parts.map((p) => p.id === partId ? { ...p, [field]: value } : p));
  };

  const partsTotal = parts.reduce((sum, p) => sum + (p.price * p.quantity), 0);
  const total = partsTotal + (parseFloat(laborCost) || 0);

  const handleSubmit = async () => {
    if (parts.some((p) => !p.name)) {
      toast.error("Todos los repuestos deben tener nombre");
      return;
    }
    if (!laborCost || parseFloat(laborCost) <= 0) {
      toast.error("Costo de mano de obra requerido");
      return;
    }
    if (!estimatedDays) {
      toast.error("Días estimados requeridos");
      return;
    }
    setIsSubmitting(true);
    try {
      const validUntil = new Date();
      validUntil.setDate(validUntil.getDate() + 7);
      await createQuote({
        requestId: id as string,
        diagnosis: diagnosis || "Diagnóstico pendiente",
        laborCost: parseFloat(laborCost),
        estimatedTime: estimatedDays,
        validUntil: validUntil.toISOString(),
        notes: message,
        parts: parts.map((p) => ({ name: p.name, partType: p.type, unitPrice: p.price, quantity: p.quantity })),
      });
      toast.success("Cotización enviada exitosamente", {
        description: `Total: S/ ${total.toFixed(2)} - ${estimatedDays} día(s)`,
      });
      router.push("/app/taller/solicitudes");
    } catch (err: any) {
      toast.error("Error al enviar cotización", { description: err.message });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="pb-20 lg:pb-0 max-w-2xl mx-auto">
      <PageHeader
        title={`Cotizar ${id}`}
        description="Envía tu cotización detallada al motociclista"
        badge="MVP"
      />

      {/* Request summary */}
      <Card className="mb-6">
        <CardContent className="pt-4">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
              <Bike className="w-5 h-5 text-primary" />
            </div>
            <div>
              {isLoading ? (
                <div className="space-y-2"><div className="h-4 w-48 bg-secondary animate-pulse rounded" /><div className="h-3 w-64 bg-secondary animate-pulse rounded" /></div>
              ) : requestData ? (
                <>
                  <h3 className="font-semibold text-sm">{requestData.motorcycle?.brand} {requestData.motorcycle?.model} ({requestData.motorcycle?.year}) • {requestData.category?.name}</h3>
                  <p className="text-xs text-muted-foreground mt-1">{requestData.description}</p>
                  <div className="flex gap-2 mt-2">
                    {requestData.user?.district && (
                      <Badge variant="outline" className="text-[10px]">
                        <MapPin className="w-3 h-3 mr-1" /> {requestData.user.district}
                      </Badge>
                    )}
                    <Badge className={`text-[10px] ${requestData.urgency === "ALTA" ? "bg-red-100 text-red-800" : requestData.urgency === "MEDIA" ? "bg-yellow-100 text-yellow-800" : "bg-green-100 text-green-800"}`}>
                      {requestData.urgency === "ALTA" ? "Urgente" : requestData.urgency === "MEDIA" ? "Media urgencia" : "Baja urgencia"}
                    </Badge>
                  </div>
                </>
              ) : (
                <>
                  <h3 className="font-semibold text-sm text-destructive">Solicitud no encontrada</h3>
                  <p className="text-xs text-muted-foreground mt-1">
                    No se pudo cargar la información de esta solicitud. Es posible que haya sido eliminada o no esté disponible.
                  </p>
                </>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Parts breakdown (HU-13/14) */}
      <Card className="mb-6">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <CardTitle className="text-base">Repuestos</CardTitle>
              <FeatureBadge type="MVP" />
            </div>
            <Button variant="outline" size="sm" onClick={addPart} className="gap-1">
              <Plus className="w-3 h-3" /> Agregar
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {parts.map((part, i) => (
            <motion.div
              key={part.id}
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              className="space-y-3 p-3 rounded-lg border bg-secondary/20"
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-muted-foreground">Repuesto {i + 1}</span>
                {parts.length > 1 && (
                  <Button variant="ghost" size="sm" className="h-6 w-6 p-0 text-destructive" onClick={() => removePart(part.id)}>
                    <Trash2 className="w-3 h-3" />
                  </Button>
                )}
              </div>
              <div>
                <Label className="text-xs">Nombre del repuesto *</Label>
                <Input
                  value={part.name}
                  onChange={(e) => updatePart(part.id, "name", e.target.value)}
                  placeholder="Ej: Pastillas de freno Brembo"
                  className="h-9"
                />
              </div>
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <Label className="text-xs">Tipo</Label>
                  <Select value={part.type} onValueChange={(v) => updatePart(part.id, "type", v)}>
                    <SelectTrigger className="h-9"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="OEM">OEM</SelectItem>
                      <SelectItem value="AFTERMARKET">Alternativo</SelectItem>
                      <SelectItem value="USED">Usado</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label className="text-xs">Precio (S/)</Label>
                  <Input
                    type="number"
                    value={part.price || ""}
                    onChange={(e) => updatePart(part.id, "price", parseFloat(e.target.value) || 0)}
                    className="h-9"
                    min={0}
                  />
                </div>
                <div>
                  <Label className="text-xs">Cant.</Label>
                  <Input
                    type="number"
                    value={part.quantity}
                    onChange={(e) => updatePart(part.id, "quantity", parseInt(e.target.value) || 1)}
                    className="h-9"
                    min={1}
                  />
                </div>
              </div>
            </motion.div>
          ))}

          <div className="text-right text-sm">
            Subtotal repuestos: <strong>S/ {partsTotal.toFixed(2)}</strong>
          </div>
        </CardContent>
      </Card>

      {/* Labor and details */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="text-base">Mano de obra y tiempo</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label>Diagnóstico</Label>
            <Textarea
              value={diagnosis}
              onChange={(e) => setDiagnosis(e.target.value)}
              placeholder="Describe tu diagnóstico del problema..."
              rows={2}
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Mano de obra (S/) *</Label>
              <Input
                type="number"
                value={laborCost}
                onChange={(e) => setLaborCost(e.target.value)}
                placeholder="60"
                min={0}
              />
            </div>
            <div>
              <Label>Días estimados *</Label>
              <Input
                type="number"
                value={estimatedDays}
                onChange={(e) => setEstimatedDays(e.target.value)}
                placeholder="2"
                min={1}
              />
            </div>
          </div>
          <div>
            <Label>Mensaje al motociclista (opcional)</Label>
            <Textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Explica tu propuesta, recomendaciones, garantías..."
              rows={3}
            />
          </div>
        </CardContent>
      </Card>

      {/* Total and submit */}
      <Card className="mb-6 border-primary/30 bg-primary/5">
        <CardContent className="pt-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Calculator className="w-5 h-5 text-primary" />
              <span className="font-medium">Total cotización</span>
            </div>
            <span className="text-2xl font-bold text-primary">S/ {total.toFixed(2)}</span>
          </div>
        </CardContent>
      </Card>

      <Button onClick={handleSubmit} disabled={isSubmitting} className="w-full gap-2" size="lg">
        <Send className="w-4 h-4" />
        {isSubmitting ? "Enviando..." : "Enviar cotización"}
      </Button>

      <p className="text-xs text-muted-foreground text-center mt-3 flex items-center justify-center gap-1">
        <Info className="w-3 h-3" />
        El motociclista podrá ver tu cotización y compararla con otras
      </p>
    </div>
  );
}
