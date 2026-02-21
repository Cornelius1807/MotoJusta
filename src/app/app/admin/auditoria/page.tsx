"use client";

import { useState, useEffect } from "react";
import { getAuditLogs } from "@/app/actions/admin";
import { PageHeader } from "@/components/shared/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Shield,
  Clock,
  User,
  FileText,
} from "lucide-react";

interface AuditEntry {
  id: string;
  actorId: string;
  action: string;
  targetType: string;
  targetId: string;
  reason: string | null;
  metadata: string | null;
  createdAt: string;
}

const actionColors: Record<string, string> = {
  RESOLVER_INCIDENTE: "bg-green-100 text-green-800",
  VERIFICAR_TALLER: "bg-blue-100 text-blue-800",
  SUSPENDER_TALLER: "bg-red-100 text-red-800",
  CREATE_CHANGE_REQUEST: "bg-yellow-100 text-yellow-800",
  APPROVE_CHANGE: "bg-green-100 text-green-800",
  REJECT_CHANGE: "bg-red-100 text-red-800",
  REPORT_INCIDENT: "bg-orange-100 text-orange-800",
};

export default function AuditoriaPage() {
  const [logs, setLogs] = useState<AuditEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const data = await getAuditLogs(100);
        setLogs(data.map((l: any) => ({
          ...l,
          createdAt: l.createdAt.toISOString ? l.createdAt.toISOString() : l.createdAt,
        })));
      } catch (err) {
        console.error("Failed to load audit logs", err);
      } finally {
        setIsLoading(false);
      }
    }
    load();
  }, []);

  return (
    <div className="pb-20 lg:pb-0 max-w-3xl">
      <PageHeader
        title="Auditoría"
        description="Registro de acciones administrativas de la plataforma"
        badge="EXTRA"
      />

      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <CardTitle className="text-base">Registro de actividad</CardTitle>
            <Badge variant="secondary" className="text-[10px]">
              {isLoading ? "..." : `${logs.length} registros`}
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-3">
              {[1, 2, 3, 4, 5].map((i) => (
                <div key={i} className="h-16 rounded-lg bg-secondary animate-pulse" />
              ))}
            </div>
          ) : logs.length === 0 ? (
            <div className="text-center py-8">
              <Shield className="w-10 h-10 mx-auto text-muted-foreground mb-3" />
              <p className="text-sm font-medium">Sin registros de auditoría</p>
              <p className="text-xs text-muted-foreground mt-1">
                Las acciones administrativas aparecerán aquí.
              </p>
            </div>
          ) : (
            <ScrollArea className="h-[600px] pr-4">
              <div className="space-y-2">
                {logs.map((log) => (
                  <div
                    key={log.id}
                    className="flex items-start gap-3 p-3 rounded-lg border bg-secondary/20"
                  >
                    <div className="w-8 h-8 rounded-full bg-secondary flex items-center justify-center shrink-0 mt-0.5">
                      <FileText className="w-4 h-4 text-muted-foreground" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap mb-1">
                        <Badge
                          className={`text-[10px] ${actionColors[log.action] || "bg-gray-100 text-gray-800"}`}
                        >
                          {log.action}
                        </Badge>
                        <span className="text-[10px] text-muted-foreground">
                          {log.targetType} → {log.targetId.slice(0, 12)}…
                        </span>
                      </div>
                      {log.reason && (
                        <p className="text-xs text-muted-foreground">{log.reason}</p>
                      )}
                      <div className="flex items-center gap-2 mt-1 text-[10px] text-muted-foreground">
                        <User className="w-3 h-3" />
                        <span>{log.actorId.slice(0, 12)}…</span>
                        <Clock className="w-3 h-3 ml-2" />
                        <span>
                          {new Date(log.createdAt).toLocaleString("es-PE", {
                            day: "2-digit",
                            month: "short",
                            year: "numeric",
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </ScrollArea>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
