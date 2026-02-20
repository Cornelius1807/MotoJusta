"use client";

import { useState } from "react";
import { useParams, useRouter } from "next/navigation";
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
  const [laborCost, setLaborCost] = useState("");
  const [estimatedDays, setEstimatedDays] = useState("");
  const [message, setMessage] = useState("");
  const [parts, setParts] = useState<PartItem[]>([
    { id: "1", name: "", type: "OEM", price: 0, quantity: 1 },
  ]);

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

  const handleSubmit = () => {
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
    toast.success("Cotización enviada exitosamente", {
      description: `Total: S/ ${total.toFixed(2)} - ${estimatedDays} día(s)`,
    });
    router.push("/app/taller/solicitudes");
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
              <h3 className="font-semibold text-sm">Honda CB 190R (2023) • Frenos</h3>
              <p className="text-xs text-muted-foreground mt-1">
                Pastillas de freno delanteras hacen ruido metálico al frenar fuerte
              </p>
              <div className="flex gap-2 mt-2">
                <Badge variant="outline" className="text-[10px]">
                  <MapPin className="w-3 h-3 mr-1" /> Miraflores
                </Badge>
                <Badge className="text-[10px] bg-yellow-100 text-yellow-800">Media urgencia</Badge>
              </div>
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

      <Button onClick={handleSubmit} className="w-full gap-2" size="lg">
        <Send className="w-4 h-4" />
        Enviar cotización
      </Button>

      <p className="text-xs text-muted-foreground text-center mt-3 flex items-center justify-center gap-1">
        <Info className="w-3 h-3" />
        El motociclista podrá ver tu cotización y compararla con otras
      </p>
    </div>
  );
}
