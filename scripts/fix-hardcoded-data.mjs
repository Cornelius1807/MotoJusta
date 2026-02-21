import { writeFileSync } from "fs";
import { join } from "path";

const ROOT = new URL("..", import.meta.url).pathname;

// ============================================================
// FILE 1: src/app/app/solicitudes/[id]/page.tsx
// ============================================================
const solicitudDetail = `"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { getServiceRequestById } from "@/app/actions/service-requests";
import { acceptQuote as acceptQuoteAction, rejectQuote, counterOffer } from "@/app/actions/quotes";
import { sendChatMessage, getChatMessages } from "@/app/actions/chat";
import { generateComparativeSummary, detectRedFlags } from "@/app/actions/ai";
import { motion } from "framer-motion";
import { PageHeader } from "@/components/shared/page-header";
import { FeatureBadge } from "@/components/shared/feature-badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
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
  Loader2,
} from "lucide-react";

export default function SolicitudDetailPage() {
  const { id } = useParams();
  const router = useRouter();
  const [chatInput, setChatInput] = useState("");
  const [messages, setMessages] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [requestData, setRequestData] = useState<any>(null);
  const [quotes, setQuotes] = useState<any[]>([]);
  const [aiSummary, setAiSummary] = useState<any>(null);
  const [redFlags, setRedFlags] = useState<any>(null);
  const [isAiLoading, setIsAiLoading] = useState(false);

  // FIX 4: Reject & Counter-offer state
  const [rejectDialogOpen, setRejectDialogOpen] = useState(false);
  const [counterDialogOpen, setCounterDialogOpen] = useState(false);
  const [activeQuoteId, setActiveQuoteId] = useState<string>("");
  const [rejectReason, setRejectReason] = useState("");
  const [counterMessage, setCounterMessage] = useState("");
  const [counterAmount, setCounterAmount] = useState("");

  useEffect(() => {
    async function load() {
      try {
        const data = await getServiceRequestById(id as string);
        if (data) {
          setRequestData(data);
          if (data.quotes && data.quotes.length > 0) {
            setQuotes(data.quotes.map((q: any) => ({
              id: q.id,
              workshop: q.workshop?.name || "Taller",
              district: q.workshop?.district || "",
              rating: q.workshop?.rating || 0,
              reviews: q.workshop?.totalServices || 0,
              total: q.totalCost,
              estimatedDays: parseInt(q.estimatedTime) || 1,
              parts: q.parts?.map((p: any) => ({ name: p.name, type: p.partType, price: p.unitPrice, qty: p.quantity })) || [],
              message: q.notes || "",
            })));
          }
        }
        // Load chat messages
        try {
          const msgs = await getChatMessages(id as string);
          if (msgs && msgs.length > 0) {
            setMessages(msgs.map((m: any) => ({
              id: m.id,
              from: m.sender?.role === "TALLER" ? "workshop" : "user",
              name: m.sender?.name || "T\u00fa",
              text: m.content,
              time: new Date(m.createdAt).toLocaleTimeString("es-PE", { hour: "2-digit", minute: "2-digit" }),
            })));
          }
        } catch (_) { /* no messages yet */ }
      } catch (err) {
        console.error("Failed to load request", err);
      } finally {
        setIsLoading(false);
      }
    }
    load();
  }, [id]);

  // HU-16: Auto-refresh chat messages every 5 seconds
  useEffect(() => {
    const interval = setInterval(async () => {
      try {
        const msgs = await getChatMessages(id as string);
        if (msgs && msgs.length > 0) {
          setMessages(msgs.map((m: any) => ({
            id: m.id,
            from: m.sender?.role === "TALLER" ? "workshop" : "user",
            name: m.sender?.name || "T\u00fa",
            text: m.content,
            time: new Date(m.createdAt).toLocaleTimeString("es-PE", { hour: "2-digit", minute: "2-digit" }),
          })));
        }
      } catch {
        // Silently fail polling
      }
    }, 5000);
    return () => clearInterval(interval);
  }, [id]);

  const sendMessage = async () => {
    if (!chatInput.trim()) return;
    const optimistic = { id: Date.now().toString(), from: "user" as const, name: "T\u00fa", text: chatInput, time: "Ahora" };
    setMessages([...messages, optimistic]);
    const content = chatInput;
    setChatInput("");
    try {
      await sendChatMessage({ requestId: id as string, content });
    } catch (err: any) {
      toast.error("Error al enviar mensaje", { description: err.message });
    }
  };

  const acceptQuote = async (quoteId: string) => {
    try {
      await acceptQuoteAction(quoteId);
      toast.success("Cotizaci\u00f3n aceptada", { description: "Se crear\u00e1 la orden de trabajo autom\u00e1ticamente." });
      router.push("/app");
    } catch (err: any) {
      toast.error("Error al aceptar cotizaci\u00f3n", { description: err.message });
    }
  };

  const handleRejectQuote = async () => {
    if (!rejectReason.trim()) {
      toast.error("Indica el motivo del rechazo");
      return;
    }
    try {
      await rejectQuote(activeQuoteId, rejectReason);
      toast.success("Cotizaci\u00f3n rechazada");
      setRejectDialogOpen(false);
      setRejectReason("");
      setQuotes(quotes.filter((q: any) => q.id !== activeQuoteId));
    } catch (err: any) {
      toast.error("Error al rechazar", { description: err.message });
    }
  };

  const handleCounterOffer = async () => {
    if (!counterMessage.trim() || !counterAmount) {
      toast.error("Completa el monto y mensaje de la contraoferta");
      return;
    }
    try {
      await counterOffer(activeQuoteId, counterMessage, parseFloat(counterAmount));
      toast.success("Contraoferta enviada", { description: "Se notificar\u00e1 al taller por chat." });
      setCounterDialogOpen(false);
      setCounterMessage("");
      setCounterAmount("");
    } catch (err: any) {
      toast.error("Error al enviar contraoferta", { description: err.message });
    }
  };

  return (
    <div className="pb-20 lg:pb-0">
      <PageHeader title={\`Solicitud \${id}\`} description={requestData ? \`\${requestData.motorcycle?.brand} \${requestData.motorcycle?.model}\${requestData.motorcycle?.year ? \` (\${requestData.motorcycle.year})\` : ""} \u2022 \${requestData.category?.name || ""}\` : "Cargando..."} badge="MVP" />

      {/* Status summary */}
      <div className="flex flex-wrap gap-2 mb-6">
        <Badge className="bg-primary/15 text-primary">{requestData?.status === "PUBLICADA" ? "Publicada" : requestData?.status === "EN_COTIZACION" ? "En cotizaci\u00f3n" : requestData?.status === "SELECCIONADA" ? "Seleccionada" : requestData?.status || "Cargando..."}</Badge>
        <Badge variant="outline">{requestData?.urgencyLevel === "ALTA" ? "Alta urgencia" : requestData?.urgencyLevel === "BAJA" ? "Baja urgencia" : "Media urgencia"}</Badge>
        <Badge variant="secondary">{quotes.length} cotizaci\u00f3n{quotes.length !== 1 ? "es" : ""}</Badge>
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
          {isLoading ? (
            <div className="space-y-4">{[1, 2, 3].map((i) => <div key={i} className="h-48 rounded-lg bg-secondary animate-pulse" />)}</div>
          ) : quotes.length === 0 ? (
            <Card>
              <CardContent className="pt-8 pb-8 text-center">
                <FileText className="w-10 h-10 mx-auto text-muted-foreground mb-3" />
                <p className="text-sm font-medium">A\u00fan no hay cotizaciones</p>
                <p className="text-xs text-muted-foreground mt-1">Los talleres cercanos ser\u00e1n notificados y podr\u00e1n enviar cotizaciones.</p>
              </CardContent>
            </Card>
          ) : quotes.map((q: any, i: number) => (
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
                      <p className="text-xs text-muted-foreground">{q.district} \u2022 {q.estimatedDays} d\u00eda{q.estimatedDays > 1 ? "s" : ""}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-lg font-bold text-primary">S/ {q.total}</p>
                    </div>
                  </div>

                  <div className="space-y-1 mb-3">
                    {q.parts.map((p: any, pi: number) => (
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
                      Aceptar cotizaci\u00f3n
                    </Button>
                    <Button size="sm" variant="outline" onClick={() => { setActiveQuoteId(q.id); setCounterDialogOpen(true); }}>
                      Contraoferta
                    </Button>
                    <Button size="sm" variant="ghost" className="text-destructive" onClick={() => { setActiveQuoteId(q.id); setRejectDialogOpen(true); }}>
                      Rechazar
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
              {/* AI Summary & Red Flags buttons */}
              <div className="flex gap-2 mb-4">
                <Button
                  variant="outline"
                  size="sm"
                  className="gap-1"
                  disabled={isAiLoading}
                  onClick={async () => {
                    setIsAiLoading(true);
                    try {
                      const summary = await generateComparativeSummary(id as string);
                      setAiSummary(summary);
                      toast.success("Resumen comparativo generado");
                    } catch (err: any) {
                      toast.error("Error al generar resumen", { description: err.message });
                    } finally {
                      setIsAiLoading(false);
                    }
                  }}
                >
                  <Sparkles className="w-3 h-3" /> {isAiLoading ? "Analizando..." : "Resumen IA"}
                </Button>
                {quotes.length > 0 && (
                  <Button
                    variant="outline"
                    size="sm"
                    className="gap-1"
                    disabled={isAiLoading}
                    onClick={async () => {
                      setIsAiLoading(true);
                      try {
                        const result = await detectRedFlags(quotes[0].id);
                        setRedFlags(result);
                        toast.success(\`Se detectaron \${result.flags?.length || 0} alertas\`);
                      } catch (err: any) {
                        toast.error("Error al detectar alertas", { description: err.message });
                      } finally {
                        setIsAiLoading(false);
                      }
                    }}
                  >
                    <AlertCircle className="w-3 h-3" /> Red Flags
                  </Button>
                )}
              </div>
              {aiSummary && (
                <div className="mb-4 p-3 rounded-lg bg-primary/5 border border-primary/20">
                  <p className="text-xs font-medium text-primary mb-1">Resumen IA</p>
                  <p className="text-sm">{typeof aiSummary === 'string' ? aiSummary : aiSummary.recommendation || JSON.stringify(aiSummary)}</p>
                </div>
              )}
              {redFlags && redFlags.flags && redFlags.flags.length > 0 && (
                <div className="mb-4 p-3 rounded-lg bg-destructive/5 border border-destructive/20">
                  <p className="text-xs font-medium text-destructive mb-1">Alertas detectadas</p>
                  {redFlags.flags.map((f: any, i: number) => (
                    <div key={i} className="text-sm mb-1">
                      <Badge variant="outline" className="text-[10px] mr-1">{f.severity}</Badge>
                      {f.description}
                    </div>
                  ))}
                </div>
              )}
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left py-2 text-muted-foreground font-medium">Criterio</th>
                      {quotes.map((q: any) => (
                        <th key={q.id} className="text-center py-2 font-medium">{q.workshop}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    <tr className="border-b">
                      <td className="py-2 text-muted-foreground">Precio total</td>
                      {quotes.map((q: any) => (
                        <td key={q.id} className={\`text-center py-2 font-semibold \${q.total === Math.min(...quotes.map((dq: any) => dq.total)) ? "text-green-600" : ""}\`}>
                          S/ {q.total}
                        </td>
                      ))}
                    </tr>
                    <tr className="border-b">
                      <td className="py-2 text-muted-foreground">Calificaci\u00f3n</td>
                      {quotes.map((q: any) => (
                        <td key={q.id} className={\`text-center py-2 \${q.rating === Math.max(...quotes.map((dq: any) => dq.rating)) ? "text-green-600 font-semibold" : ""}\`}>
                          \u2b50 {q.rating}
                        </td>
                      ))}
                    </tr>
                    <tr className="border-b">
                      <td className="py-2 text-muted-foreground">D\u00edas estimados</td>
                      {quotes.map((q: any) => (
                        <td key={q.id} className={\`text-center py-2 \${q.estimatedDays === Math.min(...quotes.map((dq: any) => dq.estimatedDays)) ? "text-green-600 font-semibold" : ""}\`}>
                          {q.estimatedDays}d
                        </td>
                      ))}
                    </tr>
                    <tr className="border-b">
                      <td className="py-2 text-muted-foreground">Rese\u00f1as</td>
                      {quotes.map((q: any) => (
                        <td key={q.id} className="text-center py-2">{q.reviews}</td>
                      ))}
                    </tr>
                    <tr>
                      <td className="py-2 text-muted-foreground">Tipo repuestos</td>
                      {quotes.map((q: any) => (
                        <td key={q.id} className="text-center py-2">
                          {q.parts.some((p: any) => p.type === "OEM") ? "OEM" : "Aftermarket"}
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
                  {messages.length === 0 ? (
                    <div className="text-center py-8">
                      <MessageSquare className="w-8 h-8 mx-auto text-muted-foreground mb-2" />
                      <p className="text-sm text-muted-foreground">No hay mensajes a\u00fan</p>
                      <p className="text-xs text-muted-foreground">Env\u00eda un mensaje para iniciar conversaci\u00f3n con los talleres.</p>
                    </div>
                  ) : messages.map((msg: any) => (
                    <div key={msg.id} className={\`flex \${msg.from === "user" ? "justify-end" : "justify-start"}\`}>
                      <div className={\`max-w-[80%] p-3 rounded-xl text-sm \${
                        msg.from === "user" ? "bg-primary text-primary-foreground rounded-br-sm" : "bg-secondary rounded-bl-sm"
                      }\`}>
                        {msg.from !== "user" && <p className="text-xs font-semibold mb-1">{msg.name}</p>}
                        <p>{msg.text}</p>
                        <p className={\`text-[10px] mt-1 \${msg.from === "user" ? "text-primary-foreground/70" : "text-muted-foreground"}\`}>{msg.time}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </ScrollArea>
              <div className="flex gap-2 mt-3 pt-3 border-t">
                <Textarea
                  value={chatInput}
                  onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setChatInput(e.target.value)}
                  placeholder="Escribe un mensaje..."
                  rows={1}
                  className="resize-none"
                  onKeyDown={(e: React.KeyboardEvent) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); sendMessage(); } }}
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
                {(() => {
                  const timeline = [
                    { label: "Solicitud creada", status: "BORRADOR", date: requestData?.createdAt ? new Date(requestData.createdAt).toLocaleString("es-PE") : "" },
                    { label: "Publicada a talleres", status: "PUBLICADA", date: "" },
                    { label: "En cotizaci\u00f3n", status: "EN_COTIZACION", date: "" },
                    { label: "Cotizaci\u00f3n aceptada", status: "SELECCIONADA", date: "" },
                    { label: "En proceso", status: "EN_SERVICIO", date: "" },
                    { label: "Completada", status: "CERRADA", date: "" },
                  ];
                  const statusOrder = ["BORRADOR", "PUBLICADA", "EN_COTIZACION", "SELECCIONADA", "EN_SERVICIO", "CERRADA"];
                  const currentIdx = statusOrder.indexOf(requestData?.status || "PUBLICADA");
                  return timeline.map((item, i) => {
                    const isDone = i <= currentIdx;
                    return (
                      <div key={i} className="flex gap-3">
                        <div className="flex flex-col items-center">
                          <div className={\`w-3 h-3 rounded-full mt-1 \${isDone ? "bg-primary" : "bg-border"}\`} />
                          {i < timeline.length - 1 && (
                            <div className={\`w-0.5 h-8 \${isDone ? "bg-primary" : "bg-border"}\`} />
                          )}
                        </div>
                        <div className="pb-6">
                          <p className={\`text-sm \${isDone ? "font-medium" : "text-muted-foreground"}\`}>{item.label}</p>
                          {item.date && <p className="text-xs text-muted-foreground">{item.date}</p>}
                        </div>
                      </div>
                    );
                  });
                })()}
              </div>
            </CardContent>
          </Card>

          {/* Request details card - uses real data */}
          <Card className="mt-4">
            <CardHeader>
              <CardTitle className="text-base">Detalles de la solicitud</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {isLoading ? (
                <div className="flex items-center justify-center py-6">
                  <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
                </div>
              ) : requestData ? (
                <>
                  <div className="flex items-center gap-2 text-sm">
                    <Bike className="w-4 h-4 text-muted-foreground" />
                    <span>{requestData.motorcycle?.brand} {requestData.motorcycle?.model}{requestData.motorcycle?.year ? \` (\${requestData.motorcycle.year})\` : ""}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <Wrench className="w-4 h-4 text-muted-foreground" />
                    <span>{requestData.category?.name || "Sin categor\u00eda"}</span>
                  </div>
                  <Separator />
                  <div>
                    <p className="text-sm font-medium mb-1">Descripci\u00f3n</p>
                    <p className="text-sm text-muted-foreground">
                      {requestData.description || "Sin descripci\u00f3n"}
                    </p>
                  </div>
                  {requestData.guideAnswers && Object.keys(requestData.guideAnswers).length > 0 && (
                    <div>
                      <p className="text-sm font-medium mb-1">Respuestas gu\u00eda</p>
                      <div className="space-y-1">
                        {Object.entries(requestData.guideAnswers).map(([question, answer]: [string, any]) => (
                          <p key={question} className="text-xs bg-secondary/50 p-2 rounded">
                            {question}: <strong>{String(answer)}</strong>
                          </p>
                        ))}
                      </div>
                    </div>
                  )}
                </>
              ) : (
                <p className="text-sm text-muted-foreground">No se encontr\u00f3 la solicitud</p>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* FIX 4: Reject quote dialog */}
      <Dialog open={rejectDialogOpen} onOpenChange={setRejectDialogOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Rechazar cotizaci\u00f3n</DialogTitle>
            <DialogDescription>Indica el motivo por el que rechazas esta cotizaci\u00f3n.</DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <Textarea
              value={rejectReason}
              onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setRejectReason(e.target.value)}
              placeholder="Indica el motivo del rechazo..."
              rows={3}
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setRejectDialogOpen(false)}>Cancelar</Button>
            <Button variant="destructive" onClick={handleRejectQuote}>Rechazar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* FIX 4: Counter-offer dialog */}
      <Dialog open={counterDialogOpen} onOpenChange={setCounterDialogOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Enviar contraoferta</DialogTitle>
            <DialogDescription>Prop\u00f3n un monto alternativo y un mensaje al taller.</DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <div>
              <label className="text-sm font-medium">Monto sugerido (S/)</label>
              <Input
                type="number"
                value={counterAmount}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setCounterAmount(e.target.value)}
                placeholder="150"
              />
            </div>
            <div>
              <label className="text-sm font-medium">Mensaje</label>
              <Textarea
                value={counterMessage}
                onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setCounterMessage(e.target.value)}
                placeholder="Explica tu propuesta..."
                rows={3}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCounterDialogOpen(false)}>Cancelar</Button>
            <Button onClick={handleCounterOffer}>Enviar contraoferta</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
`;

writeFileSync(join(ROOT, "src/app/app/solicitudes/[id]/page.tsx"), solicitudDetail);
console.log("✅ solicitudes/[id]/page.tsx written");

// ============================================================
// FILE 2: src/app/app/ordenes/[id]/page.tsx
// ============================================================
const ordenDetail = `"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import { getUserOrders } from "@/app/actions/work-orders";
import { submitReview } from "@/app/actions/reviews";
import { motion } from "framer-motion";
import { PageHeader } from "@/components/shared/page-header";
import { FeatureBadge } from "@/components/shared/feature-badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Progress } from "@/components/ui/progress";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import {
  CheckCircle2,
  Clock,
  FileText,
  Star,
  Camera,
  AlertTriangle,
  MessageSquare,
  Download,
  Wrench,
  Bike,
  Store,
  Receipt,
} from "lucide-react";

export default function OrdenDetailPage() {
  const { id } = useParams();
  const [rating, setRating] = useState<number>(0);
  const [reviewComment, setReviewComment] = useState("");
  const [reviewSubmitted, setReviewSubmitted] = useState(false);
  const [order, setOrder] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const orders = await getUserOrders();
        const found = orders?.find((o: any) => o.id === id);
        if (found) {
          setOrder({
            id: found.id,
            status: found.status,
            moto: \`\${found.request?.motorcycle?.brand || "Moto"} \${found.request?.motorcycle?.model || ""}\${found.request?.motorcycle?.year ? \` (\${found.request.motorcycle.year})\` : ""}\`,
            category: found.request?.category?.name || "Servicio",
            workshop: found.workshop?.name || "Taller",
            workshopRating: found.workshop?.rating || 0,
            district: found.workshop?.district || "",
            total: found.totalFinal ?? found.totalAgreed ?? 0,
            startDate: found.startedAt ? new Date(found.startedAt).toLocaleDateString("es-PE", { day: "numeric", month: "short", year: "numeric" }) : "",
            endDate: found.completedAt ? new Date(found.completedAt).toLocaleDateString("es-PE", { day: "numeric", month: "short", year: "numeric" }) : "",
            parts: found.quote?.parts?.map((p: any) => ({ name: p.name, type: p.partType, price: p.unitPrice, qty: p.quantity })) || [],
            evidence: found.evidence?.map((e: any) => ({ stage: e.stage, label: e.description || e.stage })) || [],
            changeRequests: found.changeRequests?.map((cr: any) => ({ reason: cr.reason, amount: cr.newAmount, status: cr.status, approvedAt: cr.resolvedAt ? new Date(cr.resolvedAt).toLocaleDateString("es-PE") : "" })) || [],
            review: found.review || null,
          });
          if (found.review) setReviewSubmitted(true);
        }
      } catch (err) {
        console.error("Failed to load order", err);
      } finally {
        setIsLoading(false);
      }
    }
    load();
  }, [id]);

  const handleSubmitReview = async () => {
    if (rating === 0 || !reviewComment.trim()) {
      toast.error("Completa la calificaci\u00f3n y el comentario");
      return;
    }
    try {
      await submitReview({ orderId: id as string, rating, comment: reviewComment });
      setReviewSubmitted(true);
      toast.success("Rese\u00f1a enviada", { description: "Gracias por tu evaluaci\u00f3n." });
    } catch (err: any) {
      toast.error("Error al enviar rese\u00f1a", { description: err.message });
    }
  };

  if (isLoading || !order) {
    return (
      <div className="pb-20 lg:pb-0">
        <PageHeader title={\`Orden \${id}\`} description="Cargando..." badge="MVP" />
        <div className="space-y-4">
          {[1, 2, 3].map((i) => <Skeleton key={i} className="h-40 w-full rounded-lg" />)}
        </div>
      </div>
    );
  }

  return (
    <div className="pb-20 lg:pb-0">
      <PageHeader title={\`Orden \${id}\`} description={\`\${order.moto} \u2022 \${order.category}\`} badge="MVP" />

      {/* Status & progress */}
      <div className="flex flex-wrap gap-2 mb-4">
        <Badge className={order.status === "COMPLETADA" ? "bg-green-100 text-green-800" : "bg-yellow-100 text-yellow-800"}>
          {order.status === "COMPLETADA" ? "Completada" : order.status === "EN_PROCESO" || order.status === "EN_SERVICIO" ? "En proceso" : order.status}
        </Badge>
      </div>

      <Tabs defaultValue="detail" className="space-y-4">
        <TabsList className="w-full justify-start overflow-x-auto">
          <TabsTrigger value="detail" className="gap-1">
            <FileText className="w-3 h-3" /> Detalle
          </TabsTrigger>
          <TabsTrigger value="evidence" className="gap-1">
            <Camera className="w-3 h-3" /> Evidencia
          </TabsTrigger>
          <TabsTrigger value="changes" className="gap-1">
            <AlertTriangle className="w-3 h-3" /> Cambios
          </TabsTrigger>
          <TabsTrigger value="review" className="gap-1">
            <Star className="w-3 h-3" /> Rese\u00f1a
          </TabsTrigger>
        </TabsList>

        {/* Detail tab */}
        <TabsContent value="detail" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Informaci\u00f3n del servicio</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center gap-2 text-sm">
                <Bike className="w-4 h-4 text-muted-foreground" />
                <span>{order.moto}</span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <Wrench className="w-4 h-4 text-muted-foreground" />
                <span>{order.category}</span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <Store className="w-4 h-4 text-muted-foreground" />
                <span>{order.workshop} \u2022 \u2b50 {order.workshopRating}</span>
              </div>
              <Separator />
              <div>
                <p className="text-sm font-medium mb-2">Desglose de costos</p>
                <div className="space-y-1">
                  {order.parts.map((p: any, i: number) => (
                    <div key={i} className="flex justify-between text-sm">
                      <span className="text-muted-foreground">
                        {p.name}
                        {p.type && p.type !== "LABOR" && (
                          <Badge variant="outline" className="ml-1 text-[9px] py-0 px-1">{p.type}</Badge>
                        )}
                      </span>
                      <span>S/ {p.price}</span>
                    </div>
                  ))}
                  <Separator className="my-2" />
                  <div className="flex justify-between font-semibold">
                    <span>Total</span>
                    <span className="text-primary">S/ {order.total}</span>
                  </div>
                </div>
              </div>
              {order.startDate && (
                <div className="flex items-center gap-2 text-xs text-muted-foreground mt-2">
                  <Clock className="w-3 h-3" />
                  {order.startDate}{order.endDate ? \` - \${order.endDate}\` : " - En curso"}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Evidence tab (HU-21) */}
        <TabsContent value="evidence">
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <CardTitle className="text-base">Evidencia fotogr\u00e1fica</CardTitle>
                <FeatureBadge type="EXTRA" />
              </div>
            </CardHeader>
            <CardContent>
              {order.evidence.length === 0 ? (
                <div className="text-center py-8">
                  <Camera className="w-8 h-8 mx-auto text-muted-foreground mb-2" />
                  <p className="text-sm text-muted-foreground">No hay evidencia a\u00fan</p>
                  <p className="text-xs text-muted-foreground">El taller subir\u00e1 fotos del antes, durante y despu\u00e9s.</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {order.evidence.map((ev: any, i: number) => (
                    <div key={i} className="border rounded-lg p-3">
                      <div className="flex items-center gap-2 mb-2">
                        <Badge variant="outline" className="text-[10px]">{ev.stage}</Badge>
                      </div>
                      <div className="h-32 bg-secondary rounded flex items-center justify-center">
                        <Camera className="w-6 h-6 text-muted-foreground" />
                      </div>
                      <p className="text-xs text-muted-foreground mt-1">{ev.label}</p>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Changes tab (HU-22) */}
        <TabsContent value="changes">
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <CardTitle className="text-base">Cambios solicitados</CardTitle>
                <FeatureBadge type="MVP" />
              </div>
            </CardHeader>
            <CardContent>
              {order.changeRequests.length === 0 ? (
                <div className="text-center py-8">
                  <AlertTriangle className="w-8 h-8 mx-auto text-muted-foreground mb-2" />
                  <p className="text-sm text-muted-foreground">No hay cambios solicitados</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {order.changeRequests.map((cr: any, i: number) => (
                    <div key={i} className="border rounded-lg p-3">
                      <div className="flex items-center justify-between mb-1">
                        <Badge variant={cr.status === "APPROVED" ? "default" : "outline"} className="text-[10px]">
                          {cr.status === "APPROVED" ? "Aprobado" : cr.status === "REJECTED" ? "Rechazado" : "Pendiente"}
                        </Badge>
                        {cr.amount && <span className="text-sm font-semibold">+S/ {cr.amount}</span>}
                      </div>
                      <p className="text-sm">{cr.reason}</p>
                      {cr.approvedAt && <p className="text-xs text-muted-foreground mt-1">Resuelto: {cr.approvedAt}</p>}
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Review tab (HU-23) */}
        <TabsContent value="review">
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <CardTitle className="text-base">Rese\u00f1a del servicio</CardTitle>
                <FeatureBadge type="MVP" />
              </div>
            </CardHeader>
            <CardContent>
              {reviewSubmitted ? (
                <div className="text-center py-6">
                  <CheckCircle2 className="w-10 h-10 mx-auto text-green-500 mb-2" />
                  <p className="text-sm font-medium">Rese\u00f1a enviada</p>
                  <p className="text-xs text-muted-foreground mt-1">Gracias por evaluar el servicio de {order.workshop}</p>
                </div>
              ) : order.status !== "COMPLETADA" && order.status !== "CERRADA" ? (
                <div className="text-center py-6">
                  <Clock className="w-8 h-8 mx-auto text-muted-foreground mb-2" />
                  <p className="text-sm text-muted-foreground">Podr\u00e1s dejar una rese\u00f1a cuando se complete el servicio.</p>
                </div>
              ) : (
                <div className="space-y-4">
                  <div>
                    <Label>Calificaci\u00f3n</Label>
                    <div className="flex gap-1 mt-1">
                      {[1, 2, 3, 4, 5].map((s) => (
                        <button key={s} onClick={() => setRating(s)} className="focus:outline-none">
                          <Star className={\`w-6 h-6 \${s <= rating ? "text-yellow-500 fill-yellow-500" : "text-gray-300"}\`} />
                        </button>
                      ))}
                    </div>
                  </div>
                  <div>
                    <Label>Comentario</Label>
                    <Textarea
                      value={reviewComment}
                      onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setReviewComment(e.target.value)}
                      placeholder="Cu\u00e9ntanos tu experiencia..."
                      rows={3}
                    />
                  </div>
                  <Button onClick={handleSubmitReview} className="w-full">
                    Enviar rese\u00f1a
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
`;

writeFileSync(join(ROOT, "src/app/app/ordenes/[id]/page.tsx"), ordenDetail);
console.log("✅ ordenes/[id]/page.tsx written");

// ============================================================
// FILE 3: src/app/app/taller/ordenes/[id]/page.tsx
// ============================================================
const tallerOrdenDetail = `"use client";

import { useState, useEffect, useRef } from "react";
import { useParams } from "next/navigation";
import { getWorkshopOrders } from "@/app/actions/work-orders";
import { updateOrderProgress, addEvidence, requestOrderChange, completeOrder } from "@/app/actions/work-orders";
import { motion } from "framer-motion";
import { PageHeader } from "@/components/shared/page-header";
import { FeatureBadge } from "@/components/shared/feature-badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import {
  Wrench,
  Camera,
  Upload,
  FileText,
  AlertTriangle,
  CheckCircle2,
  Clock,
  MessageSquare,
  Plus,
} from "lucide-react";

export default function OrdenDetailPage() {
  const { id } = useParams();
  const [changeReason, setChangeReason] = useState("");
  const [changeAmount, setChangeAmount] = useState("");
  const [order, setOrder] = useState<any>(null);
  const [evidence, setEvidence] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const evidenceInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    async function load() {
      try {
        const orders = await getWorkshopOrders();
        const found = orders?.find((o: any) => o.id === id);
        if (found) {
          setOrder({
            id: found.id,
            moto: \`\${found.request?.motorcycle?.brand || "Moto"} \${found.request?.motorcycle?.model || ""}\${found.request?.motorcycle?.year ? \` (\${found.request.motorcycle.year})\` : ""}\`,
            category: found.request?.category?.name || "Servicio",
            client: found.request?.user?.name || "Cliente",
            total: found.totalFinal ?? found.totalAgreed ?? 0,
            status: found.status,
            progress: found.status === "COMPLETADA" ? 100 : found.status === "EN_SERVICIO" || found.status === "EN_PROCESO" ? 60 : 0,
            parts: found.quote?.parts?.map((p: any) => ({ name: p.name, type: p.partType, price: p.unitPrice, qty: p.quantity })) || [],
          });
          if (found.evidence && found.evidence.length > 0) {
            setEvidence(found.evidence.map((e: any) => ({ id: e.id, stage: e.stage, label: e.description || e.stage, type: e.mediaType === "VIDEO" ? "video" : "photo" })));
          }
        }
      } catch (err) {
        console.error("Failed to load order", err);
      } finally {
        setIsLoading(false);
      }
    }
    load();
  }, [id]);

  const handleUploadEvidence = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const mediaType = file.type.startsWith("video") ? "VIDEO" : "PHOTO";
    try {
      // In production, upload to storage first
      await addEvidence({ orderId: id as string, stage: "DURING", mediaType, url: URL.createObjectURL(file), description: file.name });
      setEvidence((prev: any[]) => [...prev, { id: Date.now().toString(), stage: "DURING", label: file.name, type: mediaType === "VIDEO" ? "video" : "photo" }]);
      toast.success("Evidencia subida correctamente");
    } catch (err: any) {
      toast.error("Error al subir evidencia", { description: err.message });
    }
  };

  const handleRequestChange = async () => {
    if (!changeReason || changeReason.length < 20) {
      toast.error("La justificaci\u00f3n debe tener al menos 20 caracteres");
      return;
    }
    try {
      await requestOrderChange({
        orderId: id as string,
        reason: changeReason,
        newAmount: changeAmount ? parseFloat(changeAmount) : undefined,
      });
      toast.success("Solicitud de cambio enviada", {
        description: "El motociclista recibir\u00e1 una notificaci\u00f3n para aprobar el cambio.",
      });
      setChangeReason("");
      setChangeAmount("");
    } catch (err: any) {
      toast.error("Error al solicitar cambio", { description: err.message });
    }
  };

  const handleComplete = async () => {
    try {
      await completeOrder(id as string);
      toast.success("Orden completada", { description: "Se notificar\u00e1 al motociclista." });
      if (order) setOrder({ ...order, status: "COMPLETADA", progress: 100 });
    } catch (err: any) {
      toast.error("Error al completar", { description: err.message });
    }
  };

  if (isLoading || !order) {
    return (
      <div className="pb-20 lg:pb-0">
        <PageHeader title={\`Orden \${id}\`} description="Cargando..." badge="MVP" />
        <div className="space-y-4">
          {[1, 2, 3].map((i) => <Skeleton key={i} className="h-40 w-full rounded-lg" />)}
        </div>
      </div>
    );
  }

  return (
    <div className="pb-20 lg:pb-0">
      <PageHeader title={\`Orden \${id}\`} description={\`\${order.moto} \u2022 \${order.category}\`} badge="MVP" />

      {/* Progress */}
      <Card className="mb-4">
        <CardContent className="pt-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium">Progreso</span>
            <span className="text-sm text-muted-foreground">{order.progress}%</span>
          </div>
          <Progress value={order.progress} className="h-2" />
          <div className="flex items-center justify-between mt-3 text-xs text-muted-foreground">
            <span>Cliente: {order.client}</span>
            <span>Total: S/ {order.total}</span>
          </div>
        </CardContent>
      </Card>

      <Tabs defaultValue="detail" className="space-y-4">
        <TabsList className="w-full justify-start overflow-x-auto">
          <TabsTrigger value="detail" className="gap-1">
            <FileText className="w-3 h-3" /> Detalle
          </TabsTrigger>
          <TabsTrigger value="evidence" className="gap-1">
            <Camera className="w-3 h-3" /> Evidencia
          </TabsTrigger>
          <TabsTrigger value="changes" className="gap-1">
            <AlertTriangle className="w-3 h-3" /> Cambios
          </TabsTrigger>
        </TabsList>

        {/* Detail tab */}
        <TabsContent value="detail" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Repuestos y costos</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-1">
                {order.parts.map((p: any, i: number) => (
                  <div key={i} className="flex justify-between text-sm">
                    <span className="text-muted-foreground">
                      {p.name}
                      {p.type && p.type !== "LABOR" && (
                        <Badge variant="outline" className="ml-1 text-[9px] py-0 px-1">{p.type}</Badge>
                      )}
                    </span>
                    <span>S/ {p.price}</span>
                  </div>
                ))}
                <Separator className="my-2" />
                <div className="flex justify-between font-semibold">
                  <span>Total</span>
                  <span className="text-primary">S/ {order.total}</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {order.status !== "COMPLETADA" && order.status !== "CERRADA" && (
            <Button className="w-full" onClick={handleComplete}>
              <CheckCircle2 className="w-4 h-4 mr-2" /> Marcar como completada
            </Button>
          )}
        </TabsContent>

        {/* Evidence tab (HU-21) */}
        <TabsContent value="evidence" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <CardTitle className="text-base">Evidencia fotogr\u00e1fica</CardTitle>
                  <FeatureBadge type="EXTRA" />
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Upload area */}
              <input
                ref={evidenceInputRef}
                type="file"
                accept="image/*,video/*"
                className="hidden"
                onChange={handleUploadEvidence}
              />
              <Button variant="outline" className="w-full gap-2" onClick={() => evidenceInputRef.current?.click()}>
                <Upload className="w-4 h-4" /> Subir evidencia
              </Button>

              {evidence.length === 0 ? (
                <div className="text-center py-6">
                  <Camera className="w-8 h-8 mx-auto text-muted-foreground mb-2" />
                  <p className="text-sm text-muted-foreground">No hay evidencia a\u00fan</p>
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-3">
                  {evidence.map((ev: any) => (
                    <div key={ev.id} className="border rounded-lg p-2">
                      <div className="flex items-center gap-1 mb-1">
                        <Badge variant="outline" className="text-[10px]">{ev.stage}</Badge>
                        <Badge variant="secondary" className="text-[10px]">{ev.type}</Badge>
                      </div>
                      <div className="h-24 bg-secondary rounded flex items-center justify-center">
                        <Camera className="w-5 h-5 text-muted-foreground" />
                      </div>
                      <p className="text-[10px] text-muted-foreground mt-1 truncate">{ev.label}</p>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Change requests tab (HU-22) */}
        <TabsContent value="changes" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <CardTitle className="text-base">Solicitar cambio</CardTitle>
                <FeatureBadge type="MVP" />
              </div>
              <p className="text-xs text-muted-foreground">
                Cualquier cambio en repuestos o costos debe ser aprobado por el motociclista (bloqueante).
              </p>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label>Justificaci\u00f3n del cambio * (m\u00edn. 20 caracteres)</Label>
                <Textarea
                  value={changeReason}
                  onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setChangeReason(e.target.value)}
                  placeholder="Explica por qu\u00e9 se necesita el cambio..."
                  rows={3}
                />
                {changeReason.length > 0 && changeReason.length < 20 && (
                  <p className="text-xs text-destructive mt-1">{20 - changeReason.length} caracteres m\u00e1s requeridos</p>
                )}
              </div>
              <div>
                <Label>Nuevo monto (opcional)</Label>
                <Input
                  type="number"
                  value={changeAmount}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setChangeAmount(e.target.value)}
                  placeholder="S/ 0.00"
                />
              </div>
              <Button className="w-full" onClick={handleRequestChange} disabled={changeReason.length < 20}>
                <AlertTriangle className="w-4 h-4 mr-2" /> Solicitar cambio
              </Button>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
`;

writeFileSync(join(ROOT, "src/app/app/taller/ordenes/[id]/page.tsx"), tallerOrdenDetail);
console.log("✅ taller/ordenes/[id]/page.tsx written");

console.log("\\nAll 3 files written successfully!");
