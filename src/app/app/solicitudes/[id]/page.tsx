"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { getServiceRequestById } from "@/app/actions/service-requests";
import { acceptQuote as acceptQuoteAction, rejectQuote, counterOffer } from "@/app/actions/quotes";
import { sendChatMessage, getChatMessages } from "@/app/actions/chat";
import { generateComparativeSummary, detectRedFlags } from "@/app/actions/ai";
import { motion } from "framer-motion";
import { PageHeader } from "@/components/shared/page-header";
import { FeatureBadge } from "@/components/shared/feature-badge";
import { FeatureGate } from "@/components/shared/feature-gate";
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

  // Reject & Counter-offer state
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
              name: m.sender?.name || "Tú",
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
            name: m.sender?.name || "Tú",
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
    const optimistic = { id: Date.now().toString(), from: "user" as const, name: "Tú", text: chatInput, time: "Ahora" };
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
      toast.success("Cotización aceptada", { description: "Se creará la orden de trabajo automáticamente." });
      router.push("/app");
    } catch (err: any) {
      toast.error("Error al aceptar cotización", { description: err.message });
    }
  };

  const handleRejectQuote = async () => {
    if (!rejectReason.trim()) {
      toast.error("Indica el motivo del rechazo");
      return;
    }
    try {
      await rejectQuote(activeQuoteId, rejectReason);
      toast.success("Cotización rechazada");
      setRejectDialogOpen(false);
      setRejectReason("");
      // Remove from local list
      setQuotes(quotes.filter((q) => q.id !== activeQuoteId));
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
      toast.success("Contraoferta enviada", { description: "Se notificará al taller por chat." });
      setCounterDialogOpen(false);
      setCounterMessage("");
      setCounterAmount("");
    } catch (err: any) {
      toast.error("Error al enviar contraoferta", { description: err.message });
    }
  };

  return (
    <div className="pb-20 lg:pb-0">
      <PageHeader title={`Solicitud ${id}`} description={requestData ? `${requestData.motorcycle?.brand} ${requestData.motorcycle?.model}${requestData.motorcycle?.year ? ` (${requestData.motorcycle.year})` : ""} • ${requestData.category?.name || ""}` : "Cargando..."} badge="MVP" />

      {/* Status summary */}
      <div className="flex flex-wrap gap-2 mb-6">
        <Badge className="bg-primary/15 text-primary">{requestData?.status === "PUBLICADA" ? "Publicada" : requestData?.status === "EN_COTIZACION" ? "En cotización" : requestData?.status === "SELECCIONADA" ? "Seleccionada" : requestData?.status || "Cargando..."}</Badge>
        <Badge variant="outline">{requestData?.urgencyLevel === "ALTA" ? "Alta urgencia" : requestData?.urgencyLevel === "BAJA" ? "Baja urgencia" : "Media urgencia"}</Badge>
        <Badge variant="secondary">{quotes.length} cotización{quotes.length !== 1 ? "es" : ""}</Badge>
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
                <p className="text-sm font-medium">Aún no hay cotizaciones</p>
                <p className="text-xs text-muted-foreground mt-1">Los talleres cercanos serán notificados y podrán enviar cotizaciones.</p>
              </CardContent>
            </Card>
          ) : quotes.map((q, i) => (
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
                      Aceptar cotización
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
              <FeatureGate flag="hu36_ia_resumen_comparativo">
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
                        toast.success(`Se detectaron ${result.flags?.length || 0} alertas`);
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
              </FeatureGate>
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
                      {quotes.map((q) => (
                        <th key={q.id} className="text-center py-2 font-medium">{q.workshop}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    <tr className="border-b">
                      <td className="py-2 text-muted-foreground">Precio total</td>
                      {quotes.map((q) => (
                        <td key={q.id} className={`text-center py-2 font-semibold ${q.total === Math.min(...quotes.map((dq: any) => dq.total)) ? "text-green-600" : ""}`}>
                          S/ {q.total}
                        </td>
                      ))}
                    </tr>
                    <tr className="border-b">
                      <td className="py-2 text-muted-foreground">Calificación</td>
                      {quotes.map((q) => (
                        <td key={q.id} className={`text-center py-2 ${q.rating === Math.max(...quotes.map((dq: any) => dq.rating)) ? "text-green-600 font-semibold" : ""}`}>
                          ⭐ {q.rating}
                        </td>
                      ))}
                    </tr>
                    <tr className="border-b">
                      <td className="py-2 text-muted-foreground">Días estimados</td>
                      {quotes.map((q) => (
                        <td key={q.id} className={`text-center py-2 ${q.estimatedDays === Math.min(...quotes.map((dq: any) => dq.estimatedDays)) ? "text-green-600 font-semibold" : ""}`}>
                          {q.estimatedDays}d
                        </td>
                      ))}
                    </tr>
                    <tr className="border-b">
                      <td className="py-2 text-muted-foreground">Reseñas</td>
                      {quotes.map((q) => (
                        <td key={q.id} className="text-center py-2">{q.reviews}</td>
                      ))}
                    </tr>
                    <tr>
                      <td className="py-2 text-muted-foreground">Tipo repuestos</td>
                      {quotes.map((q) => (
                        <td key={q.id} className="text-center py-2">
                          {q.parts.some((p: any) => p.type === "ORIGINAL") ? "Original" : "Alternativo"}
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
                      <p className="text-sm text-muted-foreground">No hay mensajes aún</p>
                      <p className="text-xs text-muted-foreground">Envía un mensaje para iniciar conversación con los talleres.</p>
                    </div>
                  ) : messages.map((msg) => (
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
                {(() => {
                  const timeline = [
                    { label: "Solicitud creada", status: "BORRADOR", date: requestData?.createdAt ? new Date(requestData.createdAt).toLocaleString("es-PE") : "" },
                    { label: "Publicada a talleres", status: "PUBLICADA", date: "" },
                    { label: "En cotización", status: "EN_COTIZACION", date: "" },
                    { label: "Cotización aceptada", status: "SELECCIONADA", date: "" },
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
                          <div className={`w-3 h-3 rounded-full mt-1 ${isDone ? "bg-primary" : "bg-border"}`} />
                          {i < timeline.length - 1 && (
                            <div className={`w-0.5 h-8 ${isDone ? "bg-primary" : "bg-border"}`} />
                          )}
                        </div>
                        <div className="pb-6">
                          <p className={`text-sm ${isDone ? "font-medium" : "text-muted-foreground"}`}>{item.label}</p>
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
                    <span>{requestData.motorcycle?.brand} {requestData.motorcycle?.model}{requestData.motorcycle?.year ? ` (${requestData.motorcycle.year})` : ""}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <Wrench className="w-4 h-4 text-muted-foreground" />
                    <span>{requestData.category?.name || "Sin categoría"}</span>
                  </div>
                  <Separator />
                  <div>
                    <p className="text-sm font-medium mb-1">Descripción</p>
                    <p className="text-sm text-muted-foreground">
                      {requestData.description || "Sin descripción"}
                    </p>
                  </div>
                  {requestData.guideAnswers && Object.keys(requestData.guideAnswers).length > 0 && (
                    <div>
                      <p className="text-sm font-medium mb-1">Respuestas guía</p>
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
                <p className="text-sm text-muted-foreground">No se encontró la solicitud</p>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Reject quote dialog */}
      <Dialog open={rejectDialogOpen} onOpenChange={setRejectDialogOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Rechazar cotización</DialogTitle>
            <DialogDescription>Indica el motivo por el que rechazas esta cotización.</DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <Textarea
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
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

      {/* Counter-offer dialog */}
      <Dialog open={counterDialogOpen} onOpenChange={setCounterDialogOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Enviar contraoferta</DialogTitle>
            <DialogDescription>Propón un monto alternativo y un mensaje al taller.</DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <div>
              <label className="text-sm font-medium">Monto sugerido (S/)</label>
              <Input
                type="number"
                value={counterAmount}
                onChange={(e) => setCounterAmount(e.target.value)}
                placeholder="150"
              />
            </div>
            <div>
              <label className="text-sm font-medium">Mensaje</label>
              <Textarea
                value={counterMessage}
                onChange={(e) => setCounterMessage(e.target.value)}
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
