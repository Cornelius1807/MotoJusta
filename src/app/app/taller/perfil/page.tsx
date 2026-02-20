"use client";

import { useState, useEffect } from "react";
import { PageHeader } from "@/components/shared/page-header";
import { FeatureBadge } from "@/components/shared/feature-badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Skeleton } from "@/components/ui/skeleton";
import { DISTRICTS } from "@/lib/validations";
import { registerWorkshop, getWorkshopProfile } from "@/app/actions/workshops";
import { toast } from "sonner";
import {
  Store,
  MapPin,
  Clock,
  Star,
  Shield,
  Phone,
  Globe,
  Camera,
  CheckCircle2,
} from "lucide-react";

const categories = [
  "Motor", "Frenos", "Suspensión", "Sistema eléctrico",
  "Transmisión", "Neumáticos", "Mantenimiento general", "Carrocería",
];

export default function TallerPerfilPage() {
  const [isLoading, setIsLoading] = useState(true);
  const [workshopStatus, setWorkshopStatus] = useState<string | null>(null);
  const [form, setForm] = useState({
    name: "",
    district: "",
    address: "",
    phone: "",
    description: "",
    categories: [] as string[],
    openTime: "08:00",
    closeTime: "18:00",
    acceptsPickup: false,
  });

  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    async function loadProfile() {
      try {
        const workshop = await getWorkshopProfile();
        if (workshop) {
          setForm({
            name: workshop.name || "",
            district: workshop.district || "",
            address: workshop.address || "",
            phone: workshop.phone || "",
            description: workshop.description || "",
            categories: workshop.categories?.map((c: any) => c.category?.name || c.name).filter(Boolean) || [],
            openTime: "08:00",
            closeTime: "18:00",
            acceptsPickup: false,
          });
          setWorkshopStatus(workshop.status);
        }
      } catch {
        // No existing workshop — user will register
      } finally {
        setIsLoading(false);
      }
    }
    loadProfile();
  }, []);

  const handleSave = async () => {
    if (!form.name || !form.district || !form.address) {
      toast.error("Nombre, distrito y dirección son obligatorios");
      return;
    }
    setIsSaving(true);
    try {
      await registerWorkshop({
        name: form.name,
        district: form.district,
        address: form.address,
        phone: form.phone || undefined,
        description: form.description || undefined,
      });
      toast.success("Perfil de taller actualizado");
    } catch (err: any) {
      toast.error("Error al guardar", { description: err.message });
    } finally {
      setIsSaving(false);
    }
  };

  const toggleCategory = (cat: string) => {
    setForm({
      ...form,
      categories: form.categories.includes(cat)
        ? form.categories.filter((c) => c !== cat)
        : [...form.categories, cat],
    });
  };

  return (
    <div className="pb-20 lg:pb-0 max-w-2xl">
      <PageHeader title="Perfil del Taller" description="Configura la información de tu taller" badge="MVP" />

      <div className="space-y-6">
        {/* Verification status */}
        {isLoading ? (
          <Card><CardContent className="pt-4"><Skeleton className="h-10 w-full" /></CardContent></Card>
        ) : workshopStatus === "VERIFICADO" ? (
        <Card className="border-green-200 bg-green-50/30">
          <CardContent className="pt-4 flex items-center gap-3">
            <CheckCircle2 className="w-5 h-5 text-green-600" />
            <div>
              <p className="text-sm font-medium text-green-800">Taller verificado</p>
              <p className="text-xs text-green-600">Tu taller ha sido verificado por el equipo de MotoJusta</p>
            </div>
          </CardContent>
        </Card>
        ) : workshopStatus === "PENDIENTE" ? (
        <Card className="border-yellow-200 bg-yellow-50/30">
          <CardContent className="pt-4 flex items-center gap-3">
            <Clock className="w-5 h-5 text-yellow-600" />
            <div>
              <p className="text-sm font-medium text-yellow-800">Verificación pendiente</p>
              <p className="text-xs text-yellow-600">Tu taller está siendo revisado por el equipo de MotoJusta</p>
            </div>
          </CardContent>
        </Card>
        ) : workshopStatus === "SUSPENDIDO" ? (
        <Card className="border-red-200 bg-red-50/30">
          <CardContent className="pt-4 flex items-center gap-3">
            <Shield className="w-5 h-5 text-red-600" />
            <div>
              <p className="text-sm font-medium text-red-800">Taller suspendido</p>
              <p className="text-xs text-red-600">Contacta a soporte para más información</p>
            </div>
          </CardContent>
        </Card>
        ) : (
        <Card className="border-blue-200 bg-blue-50/30">
          <CardContent className="pt-4 flex items-center gap-3">
            <Store className="w-5 h-5 text-blue-600" />
            <div>
              <p className="text-sm font-medium text-blue-800">Registra tu taller</p>
              <p className="text-xs text-blue-600">Completa los datos para registrar tu taller en MotoJusta</p>
            </div>
          </CardContent>
        </Card>
        )}

        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Store className="w-4 h-4 text-primary" /> Información general
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label>Nombre del taller *</Label>
              <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
            </div>
            <div>
              <Label>Distrito *</Label>
              <Select value={form.district} onValueChange={(v) => setForm({ ...form, district: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {DISTRICTS.map((d) => (
                    <SelectItem key={d} value={d}>{d}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Dirección *</Label>
              <Input value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} />
            </div>
            <div>
              <Label>Teléfono</Label>
              <Input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
            </div>
            <div>
              <Label>Descripción</Label>
              <Textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} rows={3} />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Clock className="w-4 h-4 text-primary" /> Horarios y servicios
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Hora apertura</Label>
                <Input type="time" value={form.openTime} onChange={(e) => setForm({ ...form, openTime: e.target.value })} />
              </div>
              <div>
                <Label>Hora cierre</Label>
                <Input type="time" value={form.closeTime} onChange={(e) => setForm({ ...form, closeTime: e.target.value })} />
              </div>
            </div>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium">Recojo a domicilio</p>
                <p className="text-xs text-muted-foreground">Ofreces recojo de la moto</p>
              </div>
              <Switch checked={form.acceptsPickup} onCheckedChange={(v) => setForm({ ...form, acceptsPickup: v })} />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Star className="w-4 h-4 text-primary" /> Especialidades
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-3">
              {categories.map((cat) => (
                <label key={cat} className="flex items-center gap-2 cursor-pointer">
                  <Checkbox
                    checked={form.categories.includes(cat)}
                    onCheckedChange={() => toggleCategory(cat)}
                  />
                  <span className="text-sm">{cat}</span>
                </label>
              ))}
            </div>
          </CardContent>
        </Card>

        <Button onClick={handleSave} disabled={isSaving} className="w-full">
          {isSaving ? "Guardando..." : "Guardar cambios"}
        </Button>
      </div>
    </div>
  );
}
