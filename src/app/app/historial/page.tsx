"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { PageHeader } from "@/components/shared/page-header";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import Link from "next/link";
import {
  Search,
  CheckCircle2,
  Star,
  Clock,
  Bike,
  FileText,
  Download,
  ChevronRight,
} from "lucide-react";
import { toast } from "sonner";
import { getUserOrders } from "@/app/actions/work-orders";

interface HistoryItem {
  id: string;
  orderId: string;
  moto: string;
  category: string;
  workshop: string;
  total: number;
  completedAt: string;
  rating: number | null;
  hasReceipt: boolean;
}

const DEMO_HISTORY: HistoryItem[] = [
  {
    id: "1",
    orderId: "ORD-002",
    moto: "Honda CB 190R",
    category: "Mantenimiento general",
    workshop: "MotoFix Pro",
    total: 250,
    completedAt: "10 ene 2025",
    rating: 4.5,
    hasReceipt: true,
  },
  {
    id: "2",
    orderId: "ORD-005",
    moto: "Honda CB 190R",
    category: "Neumáticos",
    workshop: "Taller MotoSpeed",
    total: 180,
    completedAt: "28 dic 2024",
    rating: 5,
    hasReceipt: true,
  },
  {
    id: "3",
    orderId: "ORD-008",
    moto: "Yamaha FZ 250",
    category: "Motor",
    workshop: "RapidMoto",
    total: 490,
    completedAt: "15 dic 2024",
    rating: 3.5,
    hasReceipt: true,
  },
  {
    id: "4",
    orderId: "ORD-012",
    moto: "Honda CB 190R",
    category: "Sistema eléctrico",
    workshop: "MotoExpert Lima",
    total: 120,
    completedAt: "01 dic 2024",
    rating: null,
    hasReceipt: false,
  },
];

function formatDate(date: Date | string | null): string {
  if (!date) return "";
  return new Date(date).toLocaleDateString("es-PE", { day: "2-digit", month: "short", year: "numeric" });
}

export default function HistorialPage() {
  const [search, setSearch] = useState("");
  const [history, setHistory] = useState<HistoryItem[]>(DEMO_HISTORY);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    setIsLoading(true);
    getUserOrders()
      .then((data) => {
        const completed = data.filter((o) => o.status === "COMPLETADA" || o.status === "CERRADA");
        if (completed.length > 0) {
          setHistory(completed.map((o) => ({
            id: o.id,
            orderId: o.id,
            moto: `${o.request.motorcycle.brand} ${o.request.motorcycle.model}`,
            category: o.request.category?.name || "Sin categoría",
            workshop: o.workshop.name,
            total: o.totalFinal ?? o.totalAgreed,
            completedAt: formatDate(o.completedAt),
            rating: o.review?.rating ?? null,
            hasReceipt: o.status === "COMPLETADA" || o.status === "CERRADA",
          })));
        }
      })
      .catch(() => {
        setHistory(DEMO_HISTORY);
      })
      .finally(() => setIsLoading(false));
  }, []);

  const filtered = history.filter((h) => {
    if (!search) return true;
    const q = search.toLowerCase();
    return h.moto.toLowerCase().includes(q) || h.workshop.toLowerCase().includes(q) || h.category.toLowerCase().includes(q);
  });

  const totalSpent = history.reduce((sum, h) => sum + h.total, 0);

  return (
    <div className="pb-20 lg:pb-0">
      <PageHeader title="Historial de Servicios" description="Revisa todos tus servicios completados" badge="MVP" />

      {/* Summary */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
        <Card>
          <CardContent className="pt-4 text-center">
            <p className="text-2xl font-bold text-primary">{history.length}</p>
            <p className="text-xs text-muted-foreground">Servicios</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 text-center">
            <p className="text-2xl font-bold">S/ {totalSpent.toLocaleString()}</p>
            <p className="text-xs text-muted-foreground">Total invertido</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 text-center">
            <p className="text-2xl font-bold text-yellow-500">
              {history.filter((h) => h.rating).length > 0
                ? (history.filter((h) => h.rating).reduce((sum, h) => sum + (h.rating || 0), 0) / history.filter((h) => h.rating).length).toFixed(1)
                : "—"}
            </p>
            <p className="text-xs text-muted-foreground">Rating promedio</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 text-center">
            <p className="text-2xl font-bold text-green-600">{history.filter((h) => h.hasReceipt).length}</p>
            <p className="text-xs text-muted-foreground">Recibos</p>
          </CardContent>
        </Card>
      </div>

      {/* Search */}
      <div className="relative mb-6">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input placeholder="Buscar por moto, taller o categoría..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" />
      </div>

      {/* History list */}
      <div className="space-y-3">
        {isLoading ? [1, 2, 3].map((i) => (
          <Card key={i}>
            <CardContent className="pt-4 pb-4">
              <div className="animate-pulse flex items-start gap-3">
                <div className="w-10 h-10 rounded-lg bg-muted shrink-0" />
                <div className="flex-1 space-y-2">
                  <div className="h-3 bg-muted rounded w-24" />
                  <div className="h-4 bg-muted rounded w-1/2" />
                  <div className="h-3 bg-muted rounded w-1/3" />
                </div>
                <div className="h-4 bg-muted rounded w-16" />
              </div>
            </CardContent>
          </Card>
        )) : filtered.map((item, i) => (
          <motion.div
            key={item.id}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05 }}
          >
            <Link href={`/app/ordenes/${item.orderId}`}>
              <Card className="hover:shadow-md transition-shadow cursor-pointer">
                <CardContent className="pt-4 pb-4">
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 rounded-lg bg-green-100 flex items-center justify-center shrink-0">
                      <CheckCircle2 className="w-5 h-5 text-green-600" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-xs font-mono text-muted-foreground">{item.orderId}</span>
                        <Badge variant="secondary" className="text-[10px]">{item.category}</Badge>
                      </div>
                      <h3 className="font-medium text-sm">{item.moto}</h3>
                      <p className="text-xs text-muted-foreground mt-1">{item.workshop}</p>
                      <div className="flex items-center gap-4 mt-2">
                        <span className="text-xs text-muted-foreground flex items-center gap-1">
                          <Clock className="w-3 h-3" /> {item.completedAt}
                        </span>
                        {item.rating && (
                          <span className="text-xs flex items-center gap-1">
                            <Star className="w-3 h-3 text-yellow-500 fill-yellow-500" /> {item.rating}
                          </span>
                        )}
                        {item.hasReceipt && (
                          <Badge variant="outline" className="text-[10px]">
                            <FileText className="w-3 h-3 mr-1" /> Recibo
                          </Badge>
                        )}
                      </div>
                    </div>
                    <div className="text-right shrink-0">
                      <p className="text-sm font-bold text-primary">S/ {item.total}</p>
                      <ChevronRight className="w-4 h-4 text-muted-foreground mt-1 ml-auto" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </Link>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
