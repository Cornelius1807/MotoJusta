"use client";

import { useEffect, useState } from "react";
import { useAuth, useClerk } from "@clerk/nextjs";
import { SignUp } from "@clerk/nextjs";
import { useRouter } from "next/navigation";
import { registerWorkshop } from "@/app/actions/workshops";
import { getCategories } from "@/app/actions/categories";
import { getWorkshopProfile } from "@/app/actions/workshops";
import { checkUserHasExistingData } from "@/app/actions/roles";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { Wrench, Store, MapPin, Phone, FileText, Shield, Loader2, AlertTriangle, User, Mail, LogOut } from "lucide-react";
import Link from "next/link";

const DISTRICTS = [
  "Lima", "Miraflores", "San Isidro", "Surco", "San Borja", "La Molina",
  "Barranco", "Pueblo Libre", "Jesús María", "Lince", "Magdalena",
  "San Miguel", "Breña", "Rímac", "Chorrillos", "Ate", "Santa Anita",
  "El Agustino", "SJL", "SJM", "VMT", "Comas", "Los Olivos",
  "Independencia", "Callao", "Ventanilla", "Otro",
];

type PageState = "loading" | "not-signed-in" | "existing-user-blocked" | "show-form";

export default function RegistroTallerPage() {
  const { isSignedIn, isLoaded } = useAuth();
  const { signOut } = useClerk();
  const router = useRouter();

  const [pageState, setPageState] = useState<PageState>("loading");
  const [categories, setCategories] = useState<{ id: string; name: string }[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Form fields
  const [contactName, setContactName] = useState("");
  const [contactEmail, setContactEmail] = useState("");
  const [name, setName] = useState("");
  const [address, setAddress] = useState("");
  const [district, setDistrict] = useState("");
  const [phone, setPhone] = useState("");
  const [ruc, setRuc] = useState("");
  const [description, setDescription] = useState("");
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [transparencyAccepted, setTransparencyAccepted] = useState(false);

  // Determine page state based on auth + user data
  useEffect(() => {
    if (!isLoaded) return;

    if (!isSignedIn) {
      setPageState("not-signed-in");
      return;
    }

    // User is signed in — check their status
    Promise.all([
      getWorkshopProfile(),
      checkUserHasExistingData(),
    ])
      .then(([workshop, userData]) => {
        if (workshop) {
          // Already has workshop → redirect to taller dashboard
          router.replace("/app/taller/solicitudes");
          return;
        }
        if (userData.role === "ADMIN") {
          setPageState("existing-user-blocked");
          return;
        }
        if (userData.role === "TALLER") {
          // Already taller but no workshop record → show form
          setPageState("show-form");
          return;
        }
        // MOTOCICLISTA role — check if they have existing data
        if (userData.hasData) {
          setPageState("existing-user-blocked");
          return;
        }
        // Fresh account with no data → show form
        setPageState("show-form");
      })
      .catch(() => setPageState("show-form"));
  }, [isLoaded, isSignedIn, router]);

  // Load categories when showing form
  useEffect(() => {
    if (pageState === "show-form" && isSignedIn) {
      getCategories()
        .then((cats) => setCategories(cats))
        .catch(() => {});
    }
  }, [pageState, isSignedIn]);

  const toggleCategory = (catId: string) => {
    setSelectedCategories((prev) =>
      prev.includes(catId) ? prev.filter((c) => c !== catId) : [...prev, catId]
    );
  };

  const handleSubmit = async () => {
    if (!contactName) {
      toast.error("Ingresa el nombre del representante");
      return;
    }
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
        contactName,
        contactEmail: contactEmail || undefined,
        name,
        address,
        district,
        phone,
        ruc: ruc || undefined,
        description: description || undefined,
        categoryIds: selectedCategories,
        transparencyAccepted,
      });
      toast.success("¡Solicitud enviada!", {
        description: "Tu taller será revisado por el equipo de MotoJusta antes de activarse.",
      });
      router.push("/app/taller/solicitudes");
    } catch (err: any) {
      toast.error("Error al registrar taller", { description: err.message });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSignOutAndRegister = async () => {
    await signOut();
  };

  // --- RENDER STATES ---

  if (pageState === "loading") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  // Not signed in → show Clerk SignUp
  if (pageState === "not-signed-in") {
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

        <div className="max-w-lg mx-auto px-4 py-12">
          <div className="text-center mb-8">
            <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-4">
              <Store className="w-8 h-8 text-primary" />
            </div>
            <h1 className="text-3xl font-bold mb-2">Registra tu taller</h1>
            <p className="text-muted-foreground">
              Crea una cuenta nueva para tu taller. Luego completa los datos de tu negocio.
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

  // Already has a motociclista account with data → block
  if (pageState === "existing-user-blocked") {
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

        <div className="max-w-lg mx-auto px-4 py-12">
          <div className="text-center">
            <div className="w-16 h-16 rounded-2xl bg-yellow-100 flex items-center justify-center mx-auto mb-4">
              <AlertTriangle className="w-8 h-8 text-yellow-600" />
            </div>
            <h1 className="text-2xl font-bold mb-3">Ya tienes una cuenta activa</h1>
            <p className="text-muted-foreground mb-6 max-w-md mx-auto">
              Esta cuenta ya está en uso como motociclista. Para registrar un taller necesitas
              crear una <strong>cuenta nueva</strong> con un correo diferente.
            </p>

            <div className="bg-secondary/50 rounded-xl p-4 mb-6 text-sm text-left space-y-2">
              <p className="font-medium">¿Por qué necesito otra cuenta?</p>
              <ul className="list-disc pl-5 text-muted-foreground space-y-1">
                <li>Las cuentas de motociclista y taller son independientes por seguridad</li>
                <li>Permite que el admin verifique cada taller de forma separada</li>
                <li>Evita conflictos de interés entre quien pide y quien cotiza servicios</li>
              </ul>
            </div>

            <div className="flex flex-col gap-3">
              <Button onClick={handleSignOutAndRegister} className="gap-2">
                <LogOut className="w-4 h-4" />
                Cerrar sesión y crear cuenta de taller
              </Button>
              <Link href="/app">
                <Button variant="ghost" className="w-full">Volver a mi cuenta de motociclista</Button>
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Fresh account → show workshop registration form
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
            Completa la información para que nuestro equipo verifique tu taller.
          </p>
        </div>

        <div className="space-y-6">
          {/* Contact info */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <User className="w-4 h-4 text-primary" /> Datos del representante
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label>Nombre completo del representante *</Label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    value={contactName}
                    onChange={(e) => setContactName(e.target.value)}
                    placeholder="Juan Pérez"
                    className="pl-9"
                  />
                </div>
              </div>
              <div>
                <Label>Email de contacto del taller (opcional)</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    value={contactEmail}
                    onChange={(e) => setContactEmail(e.target.value)}
                    placeholder="taller@ejemplo.com"
                    type="email"
                    className="pl-9"
                  />
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  Email adicional para comunicaciones del taller.
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Business info */}
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
                  <Label>Teléfono del taller *</Label>
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
                <Label>Dirección completa *</Label>
                <div className="relative">
                  <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    placeholder="Av. Ejemplo 123, Referencia: frente al parque"
                    className="pl-9"
                  />
                </div>
              </div>
              <div>
                <Label>RUC (opcional pero recomendado)</Label>
                <Input
                  value={ruc}
                  onChange={(e) => setRuc(e.target.value)}
                  placeholder="20123456789"
                  maxLength={11}
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Talleres con RUC verificado tienen prioridad en la plataforma.
                </p>
              </div>
              <div>
                <Label>Descripción del taller (opcional)</Label>
                <Textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Describe tu taller, servicios destacados, años de experiencia, marcas que trabajas..."
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
                  <li>Permitir la verificación de datos por parte del equipo de MotoJusta</li>
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

          {/* Info banner about verification */}
          <div className="bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800 rounded-xl p-4 text-sm">
            <p className="font-medium text-blue-900 dark:text-blue-100 mb-1">
              ¿Qué pasa después del registro?
            </p>
            <ol className="list-decimal pl-5 text-blue-800 dark:text-blue-200 space-y-1">
              <li>Nuestro equipo revisará los datos de tu taller</li>
              <li>Verificaremos la información proporcionada (RUC, ubicación, etc.)</li>
              <li>Si todo está correcto, tu taller será activado y podrás recibir solicitudes</li>
              <li>Te notificaremos cuando tu taller sea verificado</li>
            </ol>
          </div>

          <Button onClick={handleSubmit} disabled={isSubmitting} className="w-full gap-2" size="lg">
            {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Store className="w-4 h-4" />}
            {isSubmitting ? "Enviando solicitud..." : "Enviar solicitud de registro"}
          </Button>

          <p className="text-xs text-muted-foreground text-center">
            Tu taller será verificado por el equipo de MotoJusta antes de poder recibir solicitudes.
          </p>
        </div>
      </div>
    </div>
  );
}
