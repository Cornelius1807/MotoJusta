"use client";

import { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { PageHeader } from "@/components/shared/page-header";
import { FeatureBadge } from "@/components/shared/feature-badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import { toast } from "sonner";
import {
  Clock,
  CheckCircle2,
  FileText,
  MessageSquare,
  Star,
  BarChart3,
  Sparkles,
  Send,
  AlertCircle,
  ChevronDown,
  Bike,
  Wrench,
  Shield,
} from "lucide-react";

const demoQuotes = [
  {
    id: "COT-001",
    workshop: "Taller MotoSpeed",
    district: "Miraflores",
    rating: 4.5,
    reviews: 32,
    total: 180,
    estimatedDays: 2,
    parts: [
      { name: "Pastillas de freno Brembo", type: "OEM", price: 120, qty: 1 },
      { name: "Mano de obra", type: "LABOR", price: 60, qty: 1 },
    ],
    message: "Podemos recibir tu moto mañana. Las pastillas Brembo son las mejores para tu modelo.",
  },
  {
    id: "COT-002",
    workshop: "MotoFix Pro",
    district: "San Isidro",
    rating: 4.8,
    reviews: 67,
    total: 155,
    estimatedDays: 1,
    parts: [
      { name: "Pastillas genéricas premium", type: "AFTERMARKET", price: 85, qty: 1 },
      { name: "Mano de obra", type: "LABOR", price: 70, qty: 1 },
    ],
    message: "Tenemos pastillas genéricas de alta calidad. Trabajo garantizado.",
  },
  {
    id: "COT-003",
    workshop: "Tu Moto Lima",
    district: "Lima",
    rating: 3.9,
    reviews: 15,
    total: 210,
    estimatedDays: 3,
    parts: [
      { name: "Pastillas OEM Honda", type: "OEM", price: 140, qty: 1 },
      { name: "Líquido de frenos", type: "OEM", price: 25, qty: 1 },
      { name: "Mano de obra", price: 45, qty: 1, type: "LABOR" },
    ],
    message: "Incluimos cambio de líquido de frenos sin costo adicional de mano de obra.",
  },
];

const statusTimeline = [
  { label: "Solicitud creada", date: "15 ene 2025, 10:30", done: true },
  { label: "Publicada a talleres", date: "15 ene 2025, 10:31", done: true },
  { label: "Primera cotización recibida", date: "15 ene 2025, 14:20", done: true },
  { label: "Cotización aceptada", date: "", done: false },
  { label: "En proceso", date: "", done: false },
  { label: "Completada", date: "", done: false },
];

const chatMessages = [
  { id: "1", from: "workshop", name: "MotoFix Pro", text: "Hola! Vi tu solicitud. ¿Podrías indicar cuántos km tienen las pastillas actuales?", time: "14:22" },
  { id: "2", from: "user", name: "Tú", text: "Hola! Creo que tienen unos 15,000 km desde el último cambio", time: "14:25" },
  { id: "3", from: "workshop", name: "MotoFix Pro", text: "Perfecto, ya es momento de cambiarlas. Te envié una cotización competitiva 👍", time: "14:30" },
];

export default function SolicitudDetailPage() {
  const { id } = useParams();
  const router = useRouter();
  const [chatInput, setChatInput] = useState("");
  const [messages, setMessages] = useState(chatMessages);

  const sendMessage = () => {
    if (!chatInput.trim()) return;
    setMessages([...messages, { id: Date.now().toString(), from: "user", name: "Tú", text: chatInput, time: "Ahora" }]);
    setChatInput("");
  };

  const acceptQuote = (quoteId: string) => {
    toast.success("Cotización aceptada", { description: "Se creará la orden de trabajo automáticamente." });
  };

  return (
    <div className="pb-20 lg:pb-0">
      <PageHeader title={`Solicitud ${id}`} description="Honda CB 190R • Frenos" badge="MVP" />

      {/* Status summary */}
      <div className="flex flex-wrap gap-2 mb-6">
        <Badge className="bg-primary/15 text-primary">Cotizada</Badge>
        <Badge variant="outline">Media urgencia</Badge>
        <Badge variant="secondary">3 cotizaciones</Badge>
      </div>

      <Tabs defaultValue="quotes" className="space-y-4">
        <TabsList className="w-full justify-start overflow-x-auto">
          <TabsTrigger value="quotes" className="gap-1">
            <FileText className="w-3 h-3" /> Cotizaciones
          </TabsTrigger>
          <TabsTrigger value="compare" className="gap-1">
            <BarChart3 className="w-3 h-3" /> Comparar
          </TabsTrigger>
          <TabsTrigger value="chat" className="gap-1">
            <MessageSquare className="w-3 h-3" /> Chat
          </TabsTrigger>
          <TabsTrigger value="timeline" className="gap-1">
            <Clock className="w-3 h-3" /> Estado
          </TabsTrigger>
        </TabsList>

        {/* Quotes tab */}
        <TabsContent value="quotes" className="space-y-4">
          {demoQuotes.map((q, i) => (
            <motion.div
              key={q.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1 }}
            >
              <Card>
                <CardContent className="pt-4">
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="font-semibold text-sm">{q.workshop}</h3>
                        <div className="flex items-center gap-1 text-xs">
                          <Star className="w-3 h-3 text-yellow-500 fill-yellow-500" />
                          {q.rating} ({q.reviews})
                        </div>
                      </div>
                      <p className="text-xs text-muted-foreground">{q.district} • {q.estimatedDays} día{q.estimatedDays > 1 ? "s" : ""}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-lg font-bold text-primary">S/ {q.total}</p>
                    </div>
                  </div>

                  <div className="space-y-1 mb-3">
                    {q.parts.map((p, pi) => (
                      <div key={pi} className="flex justify-between text-xs">
                        <span className="text-muted-foreground">
                          {p.name}
                          {p.type !== "LABOR" && (
                            <Badge variant="outline" className="ml-1 text-[9px] py-0 px-1">{p.type}</Badge>
                          )}
                        </span>
                        <span>S/ {p.price}</span>
                      </div>
                    ))}
                  </div>

                  {q.message && (
                    <p className="text-xs bg-secondary/50 p-2 rounded mb-3 italic">&ldquo;{q.message}&rdquo;</p>
                  )}

                  <div className="flex gap-2">
                    <Button size="sm" className="flex-1" onClick={() => acceptQuote(q.id)}>
                      Aceptar cotización
                    </Button>
                    <Button size="sm" variant="outline">
                      <MessageSquare className="w-3 h-3" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </TabsContent>

        {/* Compare tab (HU-15) */}
        <TabsContent value="compare">
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <CardTitle className="text-base">Comparador de cotizaciones</CardTitle>
                <FeatureBadge type="MVP" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left py-2 text-muted-foreground font-medium">Criterio</th>
                      {demoQuotes.map((q) => (
                        <th key={q.id} className="text-center py-2 font-medium">{q.workshop}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    <tr className="border-b">
                      <td className="py-2 text-muted-foreground">Precio total</td>
                      {demoQuotes.map((q) => (
                        <td key={q.id} className={`text-center py-2 font-semibold ${q.total === Math.min(...demoQuotes.map(dq => dq.total)) ? "text-green-600" : ""}`}>
                          S/ {q.total}
                        </td>
                      ))}
                    </tr>
                    <tr className="border-b">
                      <td className="py-2 text-muted-foreground">Calificación</td>
                      {demoQuotes.map((q) => (
                        <td key={q.id} className={`text-center py-2 ${q.rating === Math.max(...demoQuotes.map(dq => dq.rating)) ? "text-green-600 font-semibold" : ""}`}>
                          ⭐ {q.rating}
                        </td>
                      ))}
                    </tr>
                    <tr className="border-b">
                      <td className="py-2 text-muted-foreground">Días estimados</td>
                      {demoQuotes.map((q) => (
                        <td key={q.id} className={`text-center py-2 ${q.estimatedDays === Math.min(...demoQuotes.map(dq => dq.estimatedDays)) ? "text-green-600 font-semibold" : ""}`}>
                          {q.estimatedDays}d
                        </td>
                      ))}
                    </tr>
                    <tr className="border-b">
                      <td className="py-2 text-muted-foreground">Reseñas</td>
                      {demoQuotes.map((q) => (
                        <td key={q.id} className="text-center py-2">{q.reviews}</td>
                      ))}
                    </tr>
                    <tr>
                      <td className="py-2 text-muted-foreground">Tipo repuestos</td>
                      {demoQuotes.map((q) => (
                        <td key={q.id} className="text-center py-2">
                          {q.parts.some(p => p.type === "OEM") ? "OEM" : "Aftermarket"}
                        </td>
                      ))}
                    </tr>
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Chat tab (HU-16) */}
        <TabsContent value="chat">
          <Card className="flex flex-col" style={{ height: "400px" }}>
            <CardHeader className="pb-2">
              <div className="flex items-center gap-2">
                <CardTitle className="text-base">Chat con talleres</CardTitle>
                <FeatureBadge type="MVP" />
              </div>
            </CardHeader>
            <CardContent className="flex-1 flex flex-col min-h-0">
              <ScrollArea className="flex-1 pr-4">
                <div className="space-y-3">
                  {messages.map((msg) => (
                    <div key={msg.id} className={`flex ${msg.from === "user" ? "justify-end" : "justify-start"}`}>
                      <div className={`max-w-[80%] p-3 rounded-xl text-sm ${
                        msg.from === "user" ? "bg-primary text-primary-foreground rounded-br-sm" : "bg-secondary rounded-bl-sm"
                      }`}>
                        {msg.from !== "user" && <p className="text-xs font-semibold mb-1">{msg.name}</p>}
                        <p>{msg.text}</p>
                        <p className={`text-[10px] mt-1 ${msg.from === "user" ? "text-primary-foreground/70" : "text-muted-foreground"}`}>{msg.time}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </ScrollArea>
              <div className="flex gap-2 mt-3 pt-3 border-t">
                <Textarea
                  value={chatInput}
                  onChange={(e) => setChatInput(e.target.value)}
                  placeholder="Escribe un mensaje..."
                  rows={1}
                  className="resize-none"
                  onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); sendMessage(); } }}
                />
                <Button size="icon" onClick={sendMessage}>
                  <Send className="w-4 h-4" />
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Timeline tab (HU-09) */}
        <TabsContent value="timeline">
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <CardTitle className="text-base">Estado de la solicitud</CardTitle>
                <FeatureBadge type="MVP" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-0">
                {statusTimeline.map((item, i) => (
                  <div key={i} className="flex gap-3">
                    <div className="flex flex-col items-center">
                      <div className={`w-3 h-3 rounded-full mt-1 ${item.done ? "bg-primary" : "bg-border"}`} />
                      {i < statusTimeline.length - 1 && (
                        <div className={`w-0.5 h-8 ${item.done ? "bg-primary" : "bg-border"}`} />
                      )}
                    </div>
                    <div className="pb-6">
                      <p className={`text-sm ${item.done ? "font-medium" : "text-muted-foreground"}`}>{item.label}</p>
                      {item.date && <p className="text-xs text-muted-foreground">{item.date}</p>}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Request details card */}
          <Card className="mt-4">
            <CardHeader>
              <CardTitle className="text-base">Detalles de la solicitud</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center gap-2 text-sm">
                <Bike className="w-4 h-4 text-muted-foreground" />
                <span>Honda CB 190R (2023)</span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <Wrench className="w-4 h-4 text-muted-foreground" />
                <span>Frenos</span>
              </div>
              <Separator />
              <div>
                <p className="text-sm font-medium mb-1">Descripción</p>
                <p className="text-sm text-muted-foreground">
                  Las pastillas de freno delanteras hacen un ruido metálico al frenar. El problema empezó hace unos días y es constante.
                </p>
              </div>
              <div>
                <p className="text-sm font-medium mb-1">Respuestas guía</p>
                <div className="space-y-1">
                  <p className="text-xs bg-secondary/50 p-2 rounded">Freno afectado: <strong>Delantero</strong></p>
                  <p className="text-xs bg-secondary/50 p-2 rounded">Sonido al frenar: <strong>Roce metálico</strong></p>
                  <p className="text-xs bg-secondary/50 p-2 rounded">Palanca esponjosa: <strong>No</strong></p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
