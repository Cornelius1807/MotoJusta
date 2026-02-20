"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { PageHeader } from "@/components/shared/page-header";
import { FeatureBadge } from "@/components/shared/feature-badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import { getMetrics } from "@/app/actions/admin";
import {
  Users,
  Store,
  FileText,
  TrendingUp,
  Clock,
  Star,
  AlertTriangle,
  CheckCircle2,
  BarChart3,
  DollarSign,
} from "lucide-react";

const platformStats = [
  { label: "Motociclistas", value: "1,247", change: "+12%", icon: Users, color: "text-blue-500" },
  { label: "Talleres activos", value: "89", change: "+5%", icon: Store, color: "text-green-500" },
  { label: "Solicitudes (mes)", value: "342", change: "+18%", icon: FileText, color: "text-primary" },
  { label: "Transacciones (S/)", value: "45,890", change: "+22%", icon: DollarSign, color: "text-yellow-500" },
];

const serviceMetrics = [
  { label: "Tiempo promedio de cotización", value: "4.2 horas" },
  { label: "Cotizaciones por solicitud", value: "2.8 promedio" },
  { label: "Tasa de aceptación", value: "67%" },
  { label: "Satisfacción promedio", value: "4.3 / 5.0" },
  { label: "Tiempo promedio de servicio", value: "2.1 días" },
  { label: "Incidentes este mes", value: "3" },
];

const topWorkshops = [
  { name: "MotoFix Pro", district: "San Isidro", rating: 4.8, orders: 45 },
  { name: "Taller MotoSpeed", district: "Miraflores", rating: 4.5, orders: 38 },
  { name: "RapidMoto", district: "Surco", rating: 4.4, orders: 29 },
  { name: "Honda Service Center", district: "San Borja", rating: 4.3, orders: 25 },
  { name: "MotoExpert Lima", district: "Lima", rating: 4.2, orders: 22 },
];

const defaultCategoryDistribution = [
  { name: "Mantenimiento general", pct: 35 },
  { name: "Frenos", pct: 20 },
  { name: "Motor", pct: 18 },
  { name: "Neumáticos", pct: 12 },
  { name: "Sistema eléctrico", pct: 8 },
  { name: "Otros", pct: 7 },
];

export default function AdminMetricasPage() {
  const [isLoading, setIsLoading] = useState(true);
  const [stats, setStats] = useState(platformStats);
  const [metrics, setMetrics] = useState(serviceMetrics);
  const [workshops, setWorkshops] = useState(topWorkshops);
  const [categories, setCategories] = useState(defaultCategoryDistribution);

  useEffect(() => {
    loadMetrics();
  }, []);

  async function loadMetrics() {
    try {
      setIsLoading(true);
      const data = await getMetrics();
      setStats([
        { label: "Usuarios totales", value: data.totalUsers.toLocaleString(), change: "", icon: Users, color: "text-blue-500" },
        { label: "Talleres activos", value: data.totalWorkshops.toLocaleString(), change: "", icon: Store, color: "text-green-500" },
        { label: "Solicitudes", value: data.totalRequests.toLocaleString(), change: "", icon: FileText, color: "text-primary" },
        { label: "Órdenes de trabajo", value: data.totalOrders.toLocaleString(), change: "", icon: DollarSign, color: "text-yellow-500" },
      ]);
      setMetrics([
        { label: "Cotizaciones totales", value: data.totalQuotes.toLocaleString() },
        { label: "Tasa de cotización", value: `${(data.quoteRate * 100).toFixed(0)}%` },
        { label: "Satisfacción promedio", value: `${data.avgRating.toFixed(1)} / 5.0` },
        { label: "Reseñas totales", value: data.totalReviews.toLocaleString() },
        { label: "Órdenes de trabajo", value: data.totalOrders.toLocaleString() },
        { label: "Incidentes", value: data.totalIncidents.toLocaleString() },
      ]);
      if (data.topWorkshops.length > 0) {
        setWorkshops(data.topWorkshops);
      }
      if (data.categoryDistribution && data.categoryDistribution.length > 0) {
        setCategories(data.categoryDistribution);
      }
    } catch (error) {
      toast.error("Error al cargar métricas");
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="pb-20 lg:pb-0">
      <PageHeader title="Métricas de la Plataforma" description="Estadísticas y KPIs de MotoJusta" badge="EXTRA" />

      {/* Platform stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {isLoading ? (
          [1, 2, 3, 4].map((n) => (
            <Card key={n}><CardContent className="pt-6"><div className="flex items-center gap-3"><Skeleton className="w-10 h-10 rounded-lg" /><div className="space-y-2"><Skeleton className="h-6 w-16" /><Skeleton className="h-3 w-24" /></div></div></CardContent></Card>
          ))
        ) : stats.map((stat, i) => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
          >
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center gap-3">
                  <div className={`p-2 rounded-lg bg-secondary ${stat.color}`}>
                    <stat.icon className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold">{stat.value}</p>
                    <p className="text-xs text-muted-foreground">{stat.label}</p>
                  </div>
                </div>
                {stat.change && (
                <Badge variant="secondary" className="mt-2 text-[10px] text-green-600">
                  <TrendingUp className="w-3 h-3 mr-1" /> {stat.change}
                </Badge>
                )}
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        {/* Service metrics */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <BarChart3 className="w-4 h-4 text-primary" /> Métricas de servicio
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {isLoading ? (
                [1, 2, 3, 4, 5, 6].map((n) => (
                  <div key={n} className="flex justify-between items-center py-2 border-b last:border-0">
                    <Skeleton className="h-4 w-40" /><Skeleton className="h-4 w-16" />
                  </div>
                ))
              ) : metrics.map((m) => (
                <div key={m.label} className="flex justify-between items-center py-2 border-b last:border-0">
                  <span className="text-sm text-muted-foreground">{m.label}</span>
                  <span className="text-sm font-semibold">{m.value}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Category distribution */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <FileText className="w-4 h-4 text-primary" /> Distribución por categoría
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {categories.map((cat) => (
                <div key={cat.name}>
                  <div className="flex justify-between text-sm mb-1">
                    <span>{cat.name}</span>
                    <span className="font-medium">{cat.pct}%</span>
                  </div>
                  <Progress value={cat.pct} className="h-2" />
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Top workshops */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Star className="w-4 h-4 text-primary" /> Top talleres del mes
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {isLoading ? (
              [1, 2, 3, 4, 5].map((n) => (
                <div key={n} className="flex items-center gap-3 py-2 border-b last:border-0">
                  <Skeleton className="w-8 h-8 rounded-full" /><div className="flex-1 space-y-1"><Skeleton className="h-4 w-32" /><Skeleton className="h-3 w-20" /></div><div className="text-right space-y-1"><Skeleton className="h-4 w-10 ml-auto" /><Skeleton className="h-3 w-16 ml-auto" /></div>
                </div>
              ))
            ) : workshops.map((w, i) => (
              <div key={w.name} className="flex items-center gap-3 py-2 border-b last:border-0">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
                  i === 0 ? "bg-yellow-100 text-yellow-800" : i === 1 ? "bg-gray-100 text-gray-800" : i === 2 ? "bg-orange-100 text-orange-800" : "bg-secondary text-muted-foreground"
                }`}>
                  {i + 1}
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium">{w.name}</p>
                  <p className="text-xs text-muted-foreground">{w.district}</p>
                </div>
                <div className="text-right">
                  <div className="flex items-center gap-1 text-sm">
                    <Star className="w-3 h-3 text-yellow-500 fill-yellow-500" /> {w.rating}
                  </div>
                  <p className="text-xs text-muted-foreground">{w.orders} órdenes</p>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
