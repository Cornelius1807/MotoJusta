"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import { createServiceRequest, estimateCost } from "@/app/actions/service-requests";
import { getMotorcycles } from "@/app/actions/motorcycles";
import { getCategories } from "@/app/actions/categories";
import { suggestCategory } from "@/app/actions/ai";
import { generateVisionDiagnosis } from "@/app/actions/ai";
import { uploadFile } from "@/app/actions/upload";
import { motion, AnimatePresence } from "framer-motion";
import { PageHeader } from "@/components/shared/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { FeatureBadge } from "@/components/shared/feature-badge";
import { toast } from "sonner";
import {
  Bike,
  Wrench,
  HelpCircle,
  FileText,
  Camera,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Upload,
  AlertTriangle,
  Sparkles,
  Eye,
} from "lucide-react";

const steps = [
  { id: 1, label: "Moto", icon: Bike },
  { id: 2, label: "Categoría", icon: Wrench },
  { id: 3, label: "Guía", icon: HelpCircle },
  { id: 4, label: "Detalle", icon: FileText },
  { id: 5, label: "Fotos", icon: Camera },
  { id: 6, label: "Confirmar", icon: CheckCircle2 },
];

const defaultCategories = [
  { id: "motor", slug: "motor", name: "Motor", description: "Problemas de motor, ruidos, humo" },
  { id: "frenos", slug: "frenos", name: "Frenos", description: "Pastillas, discos, ABS" },
  { id: "suspension", slug: "suspension", name: "Suspensión", description: "Amortiguadores, horquilla" },
  { id: "electrico", slug: "electrico", name: "Sistema eléctrico", description: "Batería, luces, arranque" },
  { id: "transmision", slug: "transmision", name: "Transmisión", description: "Cadena, piñones, embrague" },
  { id: "neumaticos", slug: "neumaticos", name: "Neumáticos", description: "Cambio, parchado, biselar" },
  { id: "mantenimiento", slug: "mantenimiento", name: "Mantenimiento general", description: "Aceite, filtros, revisión" },
  { id: "carroceria", slug: "carroceria", name: "Carrocería", description: "Carenado, pintura, espejos" },
];

const guideQuestions: Record<string, { question: string; options: string[] }[]> = {
  motor: [
    { question: "¿El motor enciende?", options: ["Sí, normal", "Sí, con dificultad", "No enciende"] },
    { question: "¿Escuchas algún ruido inusual?", options: ["No", "Golpeteo", "Silbido", "Traqueteo"] },
    { question: "¿Ves humo del escape?", options: ["No", "Blanco", "Negro", "Azul"] },
  ],
  frenos: [
    { question: "¿Cuál freno presenta el problema?", options: ["Delantero", "Trasero", "Ambos"] },
    { question: "¿Escuchas algún sonido al frenar?", options: ["No", "Chirrido", "Roce metálico"] },
    { question: "¿La palanca/pedal se siente esponjoso?", options: ["Sí", "No", "Intermitente"] },
  ],
  suspension: [
    { question: "¿Dónde sientes el problema?", options: ["Parte delantera", "Parte trasera", "Ambas"] },
    { question: "¿Qué síntoma presenta?", options: ["Rebote excesivo", "Rigidez", "Fuga de aceite", "Ruido"] },
    { question: "¿El problema aparece en qué superficie?", options: ["Baches", "Superficie lisa", "Siempre"] },
  ],
  electrico: [
    { question: "¿Qué componente falla?", options: ["Arranque", "Luces", "Batería", "Tablero", "Otro"] },
    { question: "¿La batería es reciente?", options: ["Menos de 6 meses", "6-12 meses", "Más de 1 año", "No sé"] },
    { question: "¿El problema es intermitente?", options: ["Sí", "No", "Solo en frío", "Solo en caliente"] },
  ],
  transmision: [
    { question: "¿Qué tipo de transmisión tiene?", options: ["Cadena", "Correa", "Cardan"] },
    { question: "¿Qué síntoma presenta?", options: ["Ruido en cadena", "Patina el embrague", "Dificultad al cambiar", "Vibración"] },
    { question: "¿Cuándo fue el último ajuste/cambio de cadena?", options: ["Menos de 3 meses", "3-6 meses", "Más de 6 meses", "No recuerdo"] },
  ],
  neumaticos: [
    { question: "¿Qué neumático necesita atención?", options: ["Delantero", "Trasero", "Ambos"] },
    { question: "¿Qué servicio necesitas?", options: ["Cambio completo", "Parchado", "Balanceo", "Revisión"] },
    { question: "¿Cuánto kilometraje tienen los neumáticos actuales?", options: ["Menos de 5,000 km", "5,000-15,000 km", "Más de 15,000 km", "No sé"] },
  ],
  mantenimiento: [
    { question: "¿Qué servicio de mantenimiento necesitas?", options: ["Cambio de aceite", "Revisión general", "Afinamiento", "Varios"] },
    { question: "¿Cuántos km desde el último mantenimiento?", options: ["Menos de 3,000", "3,000-6,000", "Más de 6,000", "Primer mantenimiento"] },
    { question: "¿Tienes el manual de mantenimiento?", options: ["Sí", "No", "No estoy seguro"] },
  ],
  carroceria: [
    { question: "¿Qué parte de la carrocería necesita atención?", options: ["Carenado", "Tanque", "Espejos", "Guardafango", "Otro"] },
    { question: "¿Cuál es el problema?", options: ["Rayón", "Rotura/grieta", "Abolladura", "Pintura", "Pieza faltante"] },
    { question: "¿Fue por un accidente?", options: ["Sí", "No", "Desgaste normal"] },
  ],
  default: [
    { question: "¿Cuándo notaste el problema?", options: ["Hoy", "Esta semana", "Hace más de una semana"] },
    { question: "¿El problema es constante?", options: ["Sí", "Intermitente", "Solo a veces"] },
  ],
};

export default function NuevaSolicitudPage() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [motos, setMotos] = useState<{ id: string; label: string }[]>([]);
  const [categories, setCategories] = useState(defaultCategories);
  const [form, setForm] = useState({
    motoId: "",
    categoryId: "",
    answers: {} as Record<string, string>,
    description: "",
    urgency: "MEDIA" as string,
    photos: [] as string[],
  });

  // AI category suggestion state
  const [categorySuggestions, setCategorySuggestions] = useState<Array<{ categoryId: string; name: string; score: number }>>([]);
  const [isSuggesting, setIsSuggesting] = useState(false);

  // Cost estimation state
  const [costEstimate, setCostEstimate] = useState<{ min: number; max: number; avg: number; count: number } | null>(null);

  // Vision diagnosis state
  const [visionDiagnosis, setVisionDiagnosis] = useState<any>(null);
  const [isVisionLoading, setIsVisionLoading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    async function loadMotos() {
      try {
        const result = await getMotorcycles();
        if (result.success) {
          setMotos(result.data.map((m: any) => ({ id: m.id, label: `${m.brand} ${m.model} (${m.year})` })));
        } else {
          console.error("Failed to load motorcycles:", result.error);
        }
      } catch (err) {
        console.error("Failed to load motorcycles", err);
      } finally {
        setIsLoading(false);
      }
    }
    loadMotos();

    // Load real categories from DB
    getCategories()
      .then((cats) => {
        if (cats && cats.length > 0) {
          setCategories(cats.map((c) => ({ id: c.id, slug: c.slug, name: c.name, description: c.description || "" })));
        }
      })
      .catch(() => { /* keep defaults */ });
  }, []);

  // Debounced category suggestion when description changes
  useEffect(() => {
    if (form.description.length < 15) {
      setCategorySuggestions([]);
      return;
    }
    const timer = setTimeout(async () => {
      setIsSuggesting(true);
      try {
        const result = await suggestCategory(form.description);
        setCategorySuggestions(result.suggestions || []);
      } catch {
        // Silently fail AI suggestion
      } finally {
        setIsSuggesting(false);
      }
    }, 800);
    return () => clearTimeout(timer);
  }, [form.description]);

  // Fetch cost estimate when category is selected
  useEffect(() => {
    if (!form.categoryId) {
      setCostEstimate(null);
      return;
    }
    estimateCost(form.categoryId)
      .then((data) => setCostEstimate(data))
      .catch(() => setCostEstimate(null));
  }, [form.categoryId]);

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;
    const newUrls: string[] = [];
    for (const file of files.slice(0, 5 - form.photos.length)) {
      try {
        const fd = new FormData();
        fd.append("file", file);
        const result = await uploadFile(fd, "request-media");
        newUrls.push(result.url);
      } catch {
        // Graceful fallback to local preview URL
        const localUrl = URL.createObjectURL(file);
        newUrls.push(localUrl);
      }
    }
    setForm((prev) => ({ ...prev, photos: [...prev.photos, ...newUrls] }));
    if (e.target) e.target.value = "";
  };

  const progress = (step / steps.length) * 100;
  const selectedCatSlug = categories.find((c) => c.id === form.categoryId)?.slug || form.categoryId;
  const questions = guideQuestions[selectedCatSlug] || guideQuestions.default;

  const canContinue = () => {
    switch (step) {
      case 1: return !!form.motoId;
      case 2: return !!form.categoryId;
      case 3: return Object.keys(form.answers).length >= (questions?.length || 0);
      case 4: return form.description.length >= 20;
      case 5: return true; // photos optional
      case 6: return true;
      default: return false;
    }
  };

  const handleNext = async () => {
    if (step < 6) {
      setStep(step + 1);
    } else {
      setIsSubmitting(true);
      try {
        await createServiceRequest({
          motorcycleId: form.motoId,
          categoryId: form.categoryId,
          description: form.description,
          urgency: form.urgency,
          photoUrls: form.photos.filter((p) => !p.startsWith("blob:")),
        });
        toast.success("Solicitud creada exitosamente", {
          description: "Los talleres podrán ver tu solicitud y enviarte cotizaciones.",
        });
        router.push("/app");
      } catch (err: any) {
        toast.error("Error al crear solicitud", { description: err.message || "Intenta de nuevo" });
      } finally {
        setIsSubmitting(false);
      }
    }
  };

  const handleBack = () => {
    if (step > 1) setStep(step - 1);
  };

  return (
    <div className="pb-20 lg:pb-0 max-w-2xl mx-auto">
      <PageHeader title="Nueva Solicitud" description="Describe el servicio que necesitas para tu moto" badge="MVP" />

      {/* Step indicator */}
      <div className="mb-6">
        <Progress value={progress} className="h-2 mb-4" />
        <div className="flex justify-between">
          {steps.map((s) => {
            const StepIcon = s.icon;
            const isActive = s.id === step;
            const isDone = s.id < step;
            return (
              <div key={s.id} className="flex flex-col items-center gap-1">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs transition-colors
                  ${isActive ? "bg-primary text-primary-foreground" : isDone ? "bg-primary/20 text-primary" : "bg-secondary text-muted-foreground"}`}>
                  <StepIcon className="w-4 h-4" />
                </div>
                <span className={`text-[10px] hidden sm:block ${isActive ? "text-primary font-medium" : "text-muted-foreground"}`}>
                  {s.label}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Step content */}
      <AnimatePresence mode="wait">
        <motion.div
          key={step}
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -20 }}
          transition={{ duration: 0.2 }}
        >
          {step === 1 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Selecciona tu moto</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {isLoading ? (
                  <div className="space-y-3">
                    {[1, 2].map((i) => (<div key={i} className="w-full h-16 rounded-lg bg-secondary animate-pulse" />))}
                  </div>
                ) : motos.length === 0 ? (
                  <div className="text-center py-6 text-muted-foreground">
                    <Bike className="w-8 h-8 mx-auto mb-2 opacity-50" />
                    <p>No tienes motos registradas.</p>
                    <Button variant="link" onClick={() => router.push("/app/motos")} className="mt-1">Registra una moto primero</Button>
                  </div>
                ) : motos.map((m) => (
                  <button
                    key={m.id}
                    onClick={() => setForm({ ...form, motoId: m.id })}
                    className={`w-full flex items-center gap-3 p-4 rounded-lg border-2 transition-colors text-left
                      ${form.motoId === m.id ? "border-primary bg-primary/5" : "border-border hover:border-primary/50"}`}
                  >
                    <Bike className={`w-5 h-5 ${form.motoId === m.id ? "text-primary" : "text-muted-foreground"}`} />
                    <span className="font-medium">{m.label}</span>
                  </button>
                ))}
              </CardContent>
            </Card>
          )}

          {step === 2 && (
            <Card>
              <CardHeader>
                <div className="flex items-center gap-2">
                  <CardTitle className="text-base">Categoría del servicio</CardTitle>
                  <FeatureBadge type="MVP" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {categories.map((c) => (
                    <button
                      key={c.id}
                      onClick={() => setForm({ ...form, categoryId: c.id, answers: {} })}
                      className={`p-4 rounded-lg border-2 text-left transition-colors
                        ${form.categoryId === c.id ? "border-primary bg-primary/5" : "border-border hover:border-primary/50"}`}
                    >
                      <p className="font-medium text-sm">{c.name}</p>
                      <p className="text-xs text-muted-foreground mt-1">{c.description}</p>
                    </button>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {step === 3 && (
            <Card>
              <CardHeader>
                <div className="flex items-center gap-2">
                  <CardTitle className="text-base">Preguntas guía</CardTitle>
                  <FeatureBadge type="MVP" />
                </div>
              </CardHeader>
              <CardContent className="space-y-6">
                {questions.map((q, qi) => (
                  <div key={qi}>
                    <Label className="text-sm font-medium mb-3 block">{q.question}</Label>
                    <RadioGroup
                      value={form.answers[qi.toString()] || ""}
                      onValueChange={(v) => setForm({ ...form, answers: { ...form.answers, [qi.toString()]: v } })}
                    >
                      <div className="flex flex-wrap gap-2">
                        {q.options.map((opt) => (
                          <Label
                            key={opt}
                            className={`flex items-center gap-2 px-3 py-2 rounded-lg border cursor-pointer transition-colors
                              ${form.answers[qi.toString()] === opt ? "border-primary bg-primary/5" : "border-border hover:border-primary/50"}`}
                          >
                            <RadioGroupItem value={opt} className="sr-only" />
                            <span className="text-sm">{opt}</span>
                          </Label>
                        ))}
                      </div>
                    </RadioGroup>
                  </div>
                ))}
              </CardContent>
            </Card>
          )}

          {step === 4 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Describe el problema</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label>Descripción detallada *</Label>
                  <Textarea
                    value={form.description}
                    onChange={(e) => setForm({ ...form, description: e.target.value })}
                    placeholder="Describe con detalle el problema o servicio que necesitas (mínimo 20 caracteres)..."
                    rows={5}
                    className="mt-1"
                  />
                  <p className={`text-xs mt-1 ${form.description.length < 20 ? "text-destructive" : "text-muted-foreground"}`}>
                    {form.description.length}/20 caracteres mínimo
                  </p>
                  {/* AI category suggestions */}
                  {(categorySuggestions.length > 0 || isSuggesting) && (
                    <div className="mt-2">
                      <p className="text-xs text-muted-foreground flex items-center gap-1 mb-1">
                        <Sparkles className="w-3 h-3" /> {isSuggesting ? "Analizando..." : "Categoría sugerida por IA:"}
                      </p>
                      <div className="flex flex-wrap gap-1">
                        {categorySuggestions.map((s) => (
                          <Badge
                            key={s.categoryId}
                            variant="secondary"
                            className="cursor-pointer hover:bg-primary/20 transition-colors text-xs"
                            onClick={() => setForm({ ...form, categoryId: s.categoryId, answers: {} })}
                          >
                            {s.name} ({Math.round(s.score * 100)}%)
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
                <div>
                  <Label>Nivel de urgencia</Label>
                  <div className="flex gap-3 mt-2">
                    {[
                      { value: "BAJA", label: "Baja", desc: "Sin prisa" },
                      { value: "MEDIA", label: "Media", desc: "Esta semana" },
                      { value: "ALTA", label: "Alta", desc: "Urgente" },
                    ].map((u) => (
                      <button
                        key={u.value}
                        onClick={() => setForm({ ...form, urgency: u.value })}
                        className={`flex-1 p-3 rounded-lg border-2 text-center transition-colors
                          ${form.urgency === u.value ? "border-primary bg-primary/5" : "border-border"}`}
                      >
                        <p className="text-sm font-medium">{u.label}</p>
                        <p className="text-[10px] text-muted-foreground">{u.desc}</p>
                      </button>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {step === 5 && (
            <Card>
              <CardHeader>
                <div className="flex items-center gap-2">
                  <CardTitle className="text-base">Fotos (opcional)</CardTitle>
                  <FeatureBadge type="MVP" />
                </div>
              </CardHeader>
              <CardContent>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/jpeg,image/png,image/webp,video/mp4"
                  multiple
                  className="hidden"
                  onChange={handleFileSelect}
                />
                <div
                  className="border-2 border-dashed border-border rounded-xl p-8 text-center hover:border-primary/50 transition-colors cursor-pointer"
                  onClick={() => fileInputRef.current?.click()}
                >
                  <Upload className="w-10 h-10 mx-auto text-muted-foreground mb-3" />
                  <p className="text-sm text-muted-foreground">Arrastra fotos aquí o toca para seleccionar</p>
                  <p className="text-xs text-muted-foreground mt-1">Máximo 5 fotos, 5MB cada una</p>
                </div>
                {form.photos.length > 0 && (
                  <div className="flex flex-wrap gap-2 mt-3">
                    {form.photos.map((url, i) => (
                      <div key={i} className="relative w-20 h-20 rounded-lg overflow-hidden border">
                        <img src={url} alt={`Foto ${i + 1}`} className="w-full h-full object-cover" />
                      </div>
                    ))}
                  </div>
                )}
                <p className="text-xs text-muted-foreground mt-3 flex items-center gap-1">
                  <AlertTriangle className="w-3 h-3" />
                  Las fotos ayudan a los talleres a darte mejores cotizaciones
                </p>
                {/* Vision diagnosis button */}
                {form.photos.length > 0 && (
                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full mt-3 gap-1"
                    disabled={isVisionLoading}
                    onClick={async () => {
                      setIsVisionLoading(true);
                      try {
                        const selectedMoto = motos.find((m) => m.id === form.motoId);
                        const result = await generateVisionDiagnosis({
                          requestId: "",
                          imageUrls: form.photos.slice(0, 3),
                          symptoms: form.description,
                          motorcycleBrand: selectedMoto?.label.split(" ")[0] || "Moto",
                          motorcycleModel: selectedMoto?.label || "Modelo",
                        });
                        setVisionDiagnosis(result);
                        toast.success("Diagnóstico visual generado");
                      } catch (err: any) {
                        toast.error("Error en diagnóstico visual", { description: err.message });
                      } finally {
                        setIsVisionLoading(false);
                      }
                    }}
                  >
                    <Eye className="w-3 h-3" /> {isVisionLoading ? "Analizando..." : "Diagnóstico visual IA"}
                    <FeatureBadge type="LABS" />
                  </Button>
                )}
                {visionDiagnosis && (
                  <div className="mt-3 p-3 rounded-lg bg-primary/5 border border-primary/20">
                    <p className="text-xs font-medium text-primary mb-1 flex items-center gap-1">
                      <Eye className="w-3 h-3" /> Diagnóstico visual IA
                      {!visionDiagnosis.isConclusive && <Badge variant="outline" className="text-[9px] ml-1">No concluyente</Badge>}
                    </p>
                    <p className="text-sm">{visionDiagnosis.probableDiagnosis}</p>
                    {visionDiagnosis.observations?.map((obs: string, i: number) => (
                      <p key={i} className="text-xs text-muted-foreground mt-1">• {obs}</p>
                    ))}
                    <p className="text-[10px] text-muted-foreground mt-2">{visionDiagnosis.disclaimer}</p>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {step === 6 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Confirmar solicitud</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Moto:</span>
                    <span className="font-medium">{motos.find((m) => m.id === form.motoId)?.label}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Categoría:</span>
                    <span className="font-medium">{categories.find((c) => c.id === form.categoryId)?.name}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Urgencia:</span>
                    <Badge variant={form.urgency === "ALTA" ? "destructive" : "secondary"}>
                      {form.urgency === "BAJA" ? "Baja" : form.urgency === "MEDIA" ? "Media" : "Alta"}
                    </Badge>
                  </div>
                  <div className="text-sm">
                    <span className="text-muted-foreground">Descripción:</span>
                    <p className="mt-1 text-sm bg-secondary/50 p-3 rounded-lg">{form.description}</p>
                  </div>
                  {Object.keys(form.answers).length > 0 && (
                    <div className="text-sm">
                      <span className="text-muted-foreground">Respuestas guía:</span>
                      <ul className="mt-1 space-y-1">
                        {Object.entries(form.answers).map(([qi, answer]) => (
                          <li key={qi} className="text-xs bg-secondary/30 p-2 rounded">
                            {(guideQuestions[selectedCatSlug] || guideQuestions.default)[parseInt(qi)]?.question}: <strong>{answer}</strong>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                  {/* Cost estimation range */}
                  {costEstimate && costEstimate.count > 0 && (
                    <div className="p-3 rounded-lg bg-blue-50 border border-blue-200">
                      <p className="text-xs font-medium text-blue-800 mb-1">Rango estimado de costo (basado en {costEstimate.count} cotizaciones anteriores)</p>
                      <div className="flex items-center gap-3">
                        <span className="text-sm">S/ {costEstimate.min.toLocaleString()}</span>
                        <div className="flex-1 h-2 bg-blue-200 rounded-full relative">
                          <div className="absolute top-1/2 -translate-y-1/2 w-2 h-2 bg-blue-600 rounded-full" style={{ left: `${((costEstimate.avg - costEstimate.min) / (costEstimate.max - costEstimate.min || 1)) * 100}%` }} />
                        </div>
                        <span className="text-sm">S/ {costEstimate.max.toLocaleString()}</span>
                      </div>
                      <p className="text-xs text-blue-600 mt-1 text-center">Promedio: S/ {costEstimate.avg.toLocaleString()}</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          )}
        </motion.div>
      </AnimatePresence>

      {/* Navigation buttons */}
      <div className="flex gap-3 mt-6">
        {step > 1 && (
          <Button variant="outline" onClick={handleBack} className="gap-1">
            <ChevronLeft className="w-4 h-4" /> Atrás
          </Button>
        )}
        <Button onClick={handleNext} disabled={!canContinue() || isSubmitting} className="flex-1 gap-1">
          {isSubmitting ? "Publicando..." : step === 6 ? "Publicar solicitud" : "Continuar"}
          {step < 6 && <ChevronRight className="w-4 h-4" />}
        </Button>
      </div>
    </div>
  );
}
