"use client";

import { useEffect, useState } from "react";
import { useUser } from "@clerk/nextjs";
import { SignUp } from "@clerk/nextjs";
import { useRouter } from "next/navigation";
import { registerWorkshop } from "@/app/actions/workshops";
import { getCategories } from "@/app/actions/categories";
import { getWorkshopProfile } from "@/app/actions/workshops";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { Wrench, Store, MapPin, Phone, FileText, Shield, Loader2 } from "lucide-react";
import Link from "next/link";

const DISTRICTS = [
  "Lima", "Miraflores", "San Isidro", "Surco", "San Borja", "La Molina",
  "Barranco", "Pueblo Libre", "Jesús María", "Lince", "Magdalena",
  "San Miguel", "Breña", "Rímac", "Chorrillos", "Ate", "Santa Anita",
  "El Agustino", "SJL", "SJM", "VMT", "Comas", "Los Olivos",
  "Independencia", "Callao", "Ventanilla", "Otro",
];

export default function RegistroTallerPage() {
  const { isSignedIn, isLoaded } = useUser();
  const router = useRouter();

  const [categories, setCategories] = useState<{ id: string; name: string }[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [checkingWorkshop, setCheckingWorkshop] = useState(true);

  // Form fields
  const [name, setName] = useState("");
  const [address, setAddress] = useState("");
  const [district, setDistrict] = useState("");
  const [phone, setPhone] = useState("");
  const [ruc, setRuc] = useState("");
  const [description, setDescription] = useState("");
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [transparencyAccepted, setTransparencyAccepted] = useState(false);

  // Check if user already has a workshop
  useEffect(() => {
    if (!isSignedIn) {
      setCheckingWorkshop(false);
      return;
    }
    getWorkshopProfile()
      .then((workshop) => {
        if (workshop) {
          router.replace("/app/taller/solicitudes");
        } else {
          setCheckingWorkshop(false);
        }
      })
      .catch(() => setCheckingWorkshop(false));
  }, [isSignedIn, router]);

  // Load categories
  useEffect(() => {
    if (isSignedIn) {
      getCategories()
        .then((cats) => setCategories(cats))
        .catch(() => {});
    }
  }, [isSignedIn]);

  const toggleCategory = (catId: string) => {
    setSelectedCategories((prev) =>
      prev.includes(catId) ? prev.filter((c) => c !== catId) : [...prev, catId]
    );
  };

  const handleSubmit = async () => {
    if (!name || !address || !district || !phone) {
      toast.error("Completa todos los campos obligatorios");
      return;
    }
    if (phone.length < 7) {
      toast.error("Teléfono inválido (mínimo 7 dígitos)");
      return;
    }
    if (selectedCategories.length === 0) {
      toast.error("Selecciona al menos una categoría de servicio");
      return;
    }
    if (!transparencyAccepted) {
      toast.error("Debes aceptar la política de transparencia");
      return;
    }

    setIsSubmitting(true);
    try {
      await registerWorkshop({
        name,
        address,
        district,
        phone,
        ruc: ruc || undefined,
        description: description || undefined,
        categoryIds: selectedCategories,
        transparencyAccepted,
      });
      toast.success("¡Taller registrado exitosamente!", {
        description: "Tu taller está pendiente de verificación por el equipo de MotoJusta.",
      });
      router.push("/app/taller/solicitudes");
    } catch (err: any) {
      toast.error("Error al registrar taller", { description: err.message });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isLoaded) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  // Step 1: Not signed in → show sign-up
  if (!isSignedIn) {
    return (
      <div className="min-h-screen bg-background">
        <nav className="border-b bg-background/80 backdrop-blur-md">
          <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
            <Link href="/" className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
                <Wrench className="w-5 h-5 text-primary-foreground" />
              </div>
              <span className="font-bold text-xl">Moto<span className="text-primary">Justa</span></span>
            </Link>
            <Link href="/sign-in">
              <Button variant="ghost" size="sm">¿Ya tienes cuenta? Ingresar</Button>
            </Link>
          </div>
        </nav>

        <div className="max-w-lg mx-auto px-4 py-12">
          <div className="text-center mb-8">
            <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-4">
              <Store className="w-8 h-8 text-primary" />
            </div>
            <h1 className="text-3xl font-bold mb-2">Registra tu taller</h1>
            <p className="text-muted-foreground">
              Primero crea tu cuenta, luego completa los datos de tu taller.
            </p>
          </div>

          <div className="flex justify-center">
            <SignUp
              forceRedirectUrl="/registro-taller"
              appearance={{
                elements: {
                  rootBox: "mx-auto",
                  card: "shadow-lg border rounded-2xl",
                  headerTitle: "text-2xl font-bold",
                  formButtonPrimary: "bg-primary hover:bg-primary/90",
                },
              }}
            />
          </div>
        </div>
      </div>
    );
  }

  // Checking if user already has workshop
  if (checkingWorkshop) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  // Step 2: Signed in → show workshop registration form
  return (
    <div className="min-h-screen bg-background">
      <nav className="border-b bg-background/80 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
              <Wrench className="w-5 h-5 text-primary-foreground" />
            </div>
            <span className="font-bold text-xl">Moto<span className="text-primary">Justa</span></span>
          </Link>
        </div>
      </nav>

      <div className="max-w-2xl mx-auto px-4 py-12">
        <div className="text-center mb-8">
          <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-4">
            <Store className="w-8 h-8 text-primary" />
          </div>
          <h1 className="text-3xl font-bold mb-2">Datos de tu taller</h1>
          <p className="text-muted-foreground">
            Completa la información de tu taller para empezar a recibir solicitudes de servicio.
          </p>
        </div>

        <div className="space-y-6">
          {/* Basic info */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <Store className="w-4 h-4 text-primary" /> Información del taller
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label>Nombre del taller *</Label>
                <Input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Ej: MotoFix Pro"
                />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <Label>Distrito *</Label>
                  <Select value={district} onValueChange={setDistrict}>
                    <SelectTrigger><SelectValue placeholder="Seleccionar distrito" /></SelectTrigger>
                    <SelectContent>
                      {DISTRICTS.map((d) => (
                        <SelectItem key={d} value={d}>{d}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Teléfono *</Label>
                  <div className="relative">
                    <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      placeholder="987 654 321"
                      className="pl-9"
                    />
                  </div>
                </div>
              </div>
              <div>
                <Label>Dirección *</Label>
                <div className="relative">
                  <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    placeholder="Av. Ejemplo 123"
                    className="pl-9"
                  />
                </div>
              </div>
              <div>
                <Label>RUC (opcional)</Label>
                <Input
                  value={ruc}
                  onChange={(e) => setRuc(e.target.value)}
                  placeholder="20123456789"
                  maxLength={11}
                />
              </div>
              <div>
                <Label>Descripción (opcional)</Label>
                <Textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Describe tu taller, servicios destacados, años de experiencia..."
                  rows={3}
                />
              </div>
            </CardContent>
          </Card>

          {/* Categories */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <FileText className="w-4 h-4 text-primary" /> Categorías de servicio *
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground mb-3">
                Selecciona las categorías de servicio que ofreces:
              </p>
              <div className="flex flex-wrap gap-2">
                {categories.length === 0 ? (
                  <p className="text-sm text-muted-foreground">Cargando categorías...</p>
                ) : categories.map((cat) => (
                  <Badge
                    key={cat.id}
                    variant={selectedCategories.includes(cat.id) ? "default" : "outline"}
                    className="cursor-pointer text-sm py-1.5 px-3"
                    onClick={() => toggleCategory(cat.id)}
                  >
                    {selectedCategories.includes(cat.id) ? "✓ " : ""}{cat.name}
                  </Badge>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Transparency policy */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <Shield className="w-4 h-4 text-primary" /> Política de transparencia
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="bg-secondary/50 rounded-lg p-4 mb-4 text-sm text-muted-foreground space-y-2">
                <p>Al registrarte como taller en MotoJusta, te comprometes a:</p>
                <ul className="list-disc pl-5 space-y-1">
                  <li>Presentar cotizaciones claras y desglosadas (mano de obra + repuestos)</li>
                  <li>No realizar trabajos adicionales sin autorización del motociclista</li>
                  <li>Subir evidencia fotográfica del proceso de servicio</li>
                  <li>Respetar los precios cotizados</li>
                </ul>
              </div>
              <div className="flex items-center gap-2">
                <Checkbox
                  id="transparency"
                  checked={transparencyAccepted}
                  onCheckedChange={(v) => setTransparencyAccepted(v === true)}
                />
                <label htmlFor="transparency" className="text-sm cursor-pointer">
                  Acepto la política de transparencia de MotoJusta *
                </label>
              </div>
            </CardContent>
          </Card>

          <Button onClick={handleSubmit} disabled={isSubmitting} className="w-full gap-2" size="lg">
            {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Store className="w-4 h-4" />}
            {isSubmitting ? "Registrando..." : "Registrar mi taller"}
          </Button>

          <p className="text-xs text-muted-foreground text-center">
            Tu taller será verificado por el equipo de MotoJusta antes de recibir solicitudes.
          </p>
        </div>
      </div>
    </div>
  );
}
