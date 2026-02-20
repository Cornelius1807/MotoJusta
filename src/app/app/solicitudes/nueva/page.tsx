"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
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
} from "lucide-react";

const steps = [
  { id: 1, label: "Moto", icon: Bike },
  { id: 2, label: "Categoría", icon: Wrench },
  { id: 3, label: "Guía", icon: HelpCircle },
  { id: 4, label: "Detalle", icon: FileText },
  { id: 5, label: "Fotos", icon: Camera },
  { id: 6, label: "Confirmar", icon: CheckCircle2 },
];

const demoMotos = [
  { id: "1", label: "Honda CB 190R (2023)" },
  { id: "2", label: "Yamaha FZ 250 (2022)" },
];

const categories = [
  { id: "motor", name: "Motor", description: "Problemas de motor, ruidos, humo" },
  { id: "frenos", name: "Frenos", description: "Pastillas, discos, ABS" },
  { id: "suspension", name: "Suspensión", description: "Amortiguadores, horquilla" },
  { id: "electrico", name: "Sistema eléctrico", description: "Batería, luces, arranque" },
  { id: "transmision", name: "Transmisión", description: "Cadena, piñones, embrague" },
  { id: "neumaticos", name: "Neumáticos", description: "Cambio, parchado, biselar" },
  { id: "mantenimiento", name: "Mantenimiento general", description: "Aceite, filtros, revisión" },
  { id: "carroceria", name: "Carrocería", description: "Carenado, pintura, espejos" },
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
  default: [
    { question: "¿Cuándo notaste el problema?", options: ["Hoy", "Esta semana", "Hace más de una semana"] },
    { question: "¿El problema es constante?", options: ["Sí", "Intermitente", "Solo a veces"] },
  ],
};

export default function NuevaSolicitudPage() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [form, setForm] = useState({
    motoId: "",
    categoryId: "",
    answers: {} as Record<string, string>,
    description: "",
    urgency: "MEDIA" as string,
    photos: [] as string[],
  });

  const progress = (step / steps.length) * 100;
  const questions = guideQuestions[form.categoryId] || guideQuestions.default;

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

  const handleNext = () => {
    if (step < 6) setStep(step + 1);
    else {
      toast.success("Solicitud creada exitosamente", {
        description: "Los talleres podrán ver tu solicitud y enviarte cotizaciones.",
      });
      router.push("/app");
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
                {demoMotos.map((m) => (
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
                <div className="border-2 border-dashed border-border rounded-xl p-8 text-center hover:border-primary/50 transition-colors cursor-pointer">
                  <Upload className="w-10 h-10 mx-auto text-muted-foreground mb-3" />
                  <p className="text-sm text-muted-foreground">Arrastra fotos aquí o toca para seleccionar</p>
                  <p className="text-xs text-muted-foreground mt-1">Máximo 5 fotos, 5MB cada una</p>
                </div>
                <p className="text-xs text-muted-foreground mt-3 flex items-center gap-1">
                  <AlertTriangle className="w-3 h-3" />
                  Las fotos ayudan a los talleres a darte mejores cotizaciones
                </p>
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
                    <span className="font-medium">{demoMotos.find((m) => m.id === form.motoId)?.label}</span>
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
                            {(guideQuestions[form.categoryId] || guideQuestions.default)[parseInt(qi)]?.question}: <strong>{answer}</strong>
                          </li>
                        ))}
                      </ul>
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
        <Button onClick={handleNext} disabled={!canContinue()} className="flex-1 gap-1">
          {step === 6 ? "Publicar solicitud" : "Continuar"}
          {step < 6 && <ChevronRight className="w-4 h-4" />}
        </Button>
      </div>
    </div>
  );
}
