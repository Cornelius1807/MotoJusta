"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { PageHeader } from "@/components/shared/page-header";
import { EmptyState } from "@/components/shared/empty-state";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Plus, Bike, Pencil, Trash2 } from "lucide-react";
import { MOTORCYCLE_BRANDS } from "@/lib/validations";
import { toast } from "sonner";
import { getMotorcycles, createMotorcycle, deleteMotorcycle } from "@/app/actions/motorcycles";

interface Motorcycle {
  id: string;
  brand: string;
  model: string;
  year: number;
  displacement?: number;
  use?: string;
  kmApprox?: number;
  placa?: string;
  alias?: string;
}

// Demo data
const DEMO_MOTOS: Motorcycle[] = [
  { id: "1", brand: "Honda", model: "CB 190R", year: 2023, displacement: 184, use: "DIARIO", kmApprox: 8500, placa: "ABC-123", alias: "Mi Honda" },
  { id: "2", brand: "Yamaha", model: "FZ 250", year: 2022, displacement: 249, use: "MIXTO", kmApprox: 15000 },
];

export default function MotosPage() {
  const [motos, setMotos] = useState<Motorcycle[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isOpen, setIsOpen] = useState(false);
  const [form, setForm] = useState({ brand: "", model: "", year: "", displacement: "", use: "", kmApprox: "", placa: "", alias: "" });

  useEffect(() => {
    setIsLoading(true);
    getMotorcycles()
      .then((data) => {
        setMotos(data.map((m) => ({
          id: m.id,
          brand: m.brand,
          model: m.model,
          year: m.year,
          displacement: m.displacement ?? undefined,
          use: m.use ?? undefined,
          kmApprox: m.kmApprox ?? undefined,
          placa: (m as any).placa ?? undefined,
          alias: m.alias ?? undefined,
        })));
      })
      .catch((err) => {
        console.error("[Motos] Error loading:", err);
        toast.error(`Error al cargar motos: ${err.message || "Error desconocido"}`);
        setMotos([]);
      })
      .finally(() => setIsLoading(false));
  }, []);

  const handleSubmit = async () => {
    if (!form.brand || !form.model || !form.year) {
      toast.error("Marca, modelo y año son obligatorios");
      return;
    }
    const year = parseInt(form.year);
    if (year < 1970 || year > new Date().getFullYear() + 1) {
      toast.error("Año no válido");
      return;
    }
    try {
      const created = await createMotorcycle({
        brand: form.brand,
        model: form.model,
        year,
        displacement: form.displacement ? parseInt(form.displacement) : undefined,
        use: form.use || undefined,
        kmApprox: form.kmApprox ? parseInt(form.kmApprox) : undefined,
        placa: form.placa || undefined,
        alias: form.alias || undefined,
      });
      setMotos([...motos, {
        id: created.id,
        brand: created.brand,
        model: created.model,
        year: created.year,
        displacement: created.displacement ?? undefined,
        use: created.use ?? undefined,
        kmApprox: created.kmApprox ?? undefined,
        placa: (created as any).placa ?? undefined,
        alias: created.alias ?? undefined,
      }]);
      setForm({ brand: "", model: "", year: "", displacement: "", use: "", kmApprox: "", placa: "", alias: "" });
      setIsOpen(false);
      toast.success("Moto registrada correctamente");
    } catch (err: any) {
      console.error("[Motos] Error creating:", err);
      toast.error(`Error al registrar moto: ${err.message || "Error desconocido"}`);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteMotorcycle(id);
      setMotos(motos.filter((m) => m.id !== id));
      toast.success("Moto eliminada");
    } catch {
      setMotos(motos.filter((m) => m.id !== id));
      toast.error("No se pudo eliminar en el servidor. Eliminada localmente.");
    }
  };

  return (
    <div className="pb-20 lg:pb-0">
      <PageHeader title="Mis Motos" description="Gestiona tus motocicletas registradas" badge="MVP">
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
          <DialogTrigger asChild>
            <Button className="gap-2">
              <Plus className="w-4 h-4" />
              Registrar moto
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Registrar nueva moto</DialogTitle>
              <DialogDescription>Completa los datos de tu motocicleta</DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label>Marca *</Label>
                <Select value={form.brand} onValueChange={(v) => setForm({ ...form, brand: v })}>
                  <SelectTrigger><SelectValue placeholder="Selecciona marca" /></SelectTrigger>
                  <SelectContent>
                    {MOTORCYCLE_BRANDS.map((b) => (
                      <SelectItem key={b} value={b}>{b}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Modelo *</Label>
                <Input value={form.model} onChange={(e) => setForm({ ...form, model: e.target.value })} placeholder="Ej: CB 190R" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Año *</Label>
                  <Input type="number" value={form.year} onChange={(e) => setForm({ ...form, year: e.target.value })} placeholder="2024" />
                </div>
                <div>
                  <Label>Cilindrada (cc)</Label>
                  <Input type="number" value={form.displacement} onChange={(e) => setForm({ ...form, displacement: e.target.value })} placeholder="150" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Uso</Label>
                  <Select value={form.use} onValueChange={(v) => setForm({ ...form, use: v })}>
                    <SelectTrigger><SelectValue placeholder="Selecciona" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="TRABAJO">Trabajo</SelectItem>
                      <SelectItem value="DIARIO">Diario</SelectItem>
                      <SelectItem value="MIXTO">Mixto</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Km aproximados</Label>
                  <Input type="number" value={form.kmApprox} onChange={(e) => setForm({ ...form, kmApprox: e.target.value })} placeholder="10000" />
                </div>
              </div>
              <div>
                <Label>Placa (opcional)</Label>
                <Input value={form.placa} onChange={(e) => setForm({ ...form, placa: e.target.value.toUpperCase() })} placeholder="ABC-123" maxLength={10} />
              </div>
              <div>
                <Label>Alias (opcional)</Label>
                <Input value={form.alias} onChange={(e) => setForm({ ...form, alias: e.target.value })} placeholder="Mi moto roja" />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsOpen(false)}>Cancelar</Button>
              <Button onClick={handleSubmit}>Registrar</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </PageHeader>

      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2].map((i) => (
            <Card key={i}>
              <CardContent className="pt-6">
                <div className="animate-pulse space-y-3">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-xl bg-muted" />
                    <div className="space-y-2 flex-1">
                      <div className="h-4 bg-muted rounded w-3/4" />
                      <div className="h-3 bg-muted rounded w-1/2" />
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <div className="h-5 bg-muted rounded w-16" />
                    <div className="h-5 bg-muted rounded w-16" />
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : motos.length === 0 ? (
        <EmptyState
          title="No tienes motos registradas"
          description="Registra tu primera moto para poder crear solicitudes de servicio"
          actionLabel="Registrar moto"
          actionHref="#"
        />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          <AnimatePresence>
            {motos.map((moto, i) => (
              <motion.div
                key={moto.id}
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ delay: i * 0.05 }}
              >
                <Card className="hover:shadow-md transition-shadow">
                  <CardContent className="pt-6">
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
                          <Bike className="w-6 h-6 text-primary" />
                        </div>
                        <div>
                          <h3 className="font-semibold">{moto.brand} {moto.model}</h3>
                          <p className="text-sm text-muted-foreground">{moto.year} {moto.alias ? `• ${moto.alias}` : ""}</p>
                        </div>
                      </div>
                    </div>
                    <div className="flex flex-wrap gap-2 mb-4">
                      {moto.displacement && (
                        <Badge variant="secondary" className="text-xs">{moto.displacement}cc</Badge>
                      )}
                      {moto.use && (
                        <Badge variant="outline" className="text-xs">
                          {moto.use === "TRABAJO" ? "Trabajo" : moto.use === "DIARIO" ? "Diario" : "Mixto"}
                        </Badge>
                      )}
                      {moto.placa && (
                        <Badge variant="outline" className="text-xs">{moto.placa}</Badge>
                      )}
                      {moto.kmApprox && (
                        <Badge variant="outline" className="text-xs">{moto.kmApprox.toLocaleString()} km</Badge>
                      )}
                    </div>
                    <div className="flex gap-2">
                      <Button variant="outline" size="sm" className="flex-1 gap-1">
                        <Pencil className="w-3 h-3" /> Editar
                      </Button>
                      <Button variant="ghost" size="sm" className="text-destructive" onClick={() => handleDelete(moto.id)}>
                        <Trash2 className="w-3 h-3" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      )}
    </div>
  );
}
