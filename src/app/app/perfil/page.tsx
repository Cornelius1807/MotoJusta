"use client";

import { useState } from "react";
import { PageHeader } from "@/components/shared/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { DISTRICTS } from "@/lib/validations";
import { toast } from "sonner";
import { User, MapPin, Bell, Shield } from "lucide-react";

export default function PerfilPage() {
  const [form, setForm] = useState({
    name: "Juan Pérez",
    district: "Miraflores",
    notifChannel: "IN_APP",
    phoneVisible: false,
  });

  const handleSave = () => {
    if (!form.name || !form.district) {
      toast.error("Nombre y distrito son obligatorios");
      return;
    }
    toast.success("Perfil actualizado correctamente");
  };

  return (
    <div className="pb-20 lg:pb-0 max-w-2xl">
      <PageHeader title="Mi Perfil" description="Configura tus datos y preferencias" badge="MVP" />

      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <User className="w-4 h-4 text-primary" /> Datos personales
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label>Nombre completo *</Label>
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
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Bell className="w-4 h-4 text-primary" /> Preferencias de notificación
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label>Canal preferido</Label>
              <Select value={form.notifChannel} onValueChange={(v) => setForm({ ...form, notifChannel: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="IN_APP">In-App</SelectItem>
                  <SelectItem value="EMAIL">Email</SelectItem>
                  <SelectItem value="PUSH">Push</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Shield className="w-4 h-4 text-primary" /> Privacidad
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium">Mostrar teléfono</p>
                <p className="text-xs text-muted-foreground">Tu teléfono será visible para talleres</p>
              </div>
              <Switch checked={form.phoneVisible} onCheckedChange={(v) => setForm({ ...form, phoneVisible: v })} />
            </div>
          </CardContent>
        </Card>

        <Button onClick={handleSave} className="w-full">Guardar cambios</Button>
      </div>
    </div>
  );
}
