"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import { getPublicWorkshopProfile } from "@/app/actions/workshops";
import { motion } from "framer-motion";
import { PageHeader } from "@/components/shared/page-header";
import { EmptyState } from "@/components/shared/empty-state";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  Star,
  MapPin,
  Wrench,
  Shield,
  CheckCircle2,
  Clock,
} from "lucide-react";

export default function PublicWorkshopPage() {
  const { workshopId } = useParams();
  const [workshop, setWorkshop] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const data = await getPublicWorkshopProfile(workshopId as string);
        setWorkshop(data);
      } catch (err) {
        console.error("Failed to load workshop", err);
      } finally {
        setIsLoading(false);
      }
    }
    load();
  }, [workshopId]);

  if (isLoading) {
    return (
      <div className="pb-20 lg:pb-0">
        <div className="space-y-4">
          <div className="h-8 bg-muted rounded w-1/3 animate-pulse" />
          <div className="h-48 bg-muted rounded animate-pulse" />
          <div className="h-32 bg-muted rounded animate-pulse" />
        </div>
      </div>
    );
  }

  if (!workshop) {
    return (
      <div className="pb-20 lg:pb-0">
        <EmptyState
          title="Taller no encontrado"
          description="Este taller no existe o no está verificado."
        />
      </div>
    );
  }

  return (
    <div className="pb-20 lg:pb-0">
      <PageHeader
        title={workshop.name}
        description={`${workshop.district} — Taller verificado`}
      />

      {/* Workshop info card */}
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
        <Card className="mb-6">
          <CardContent className="pt-6 space-y-4">
            <div className="flex items-start gap-4">
              <div className="w-16 h-16 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                <Wrench className="w-8 h-8 text-primary" />
              </div>
              <div className="flex-1">
                <h2 className="text-xl font-bold">{workshop.name}</h2>
                <div className="flex items-center gap-2 text-sm text-muted-foreground mt-1">
                  <MapPin className="w-4 h-4" />
                  <span>{workshop.address}, {workshop.district}</span>
                </div>
                <div className="flex items-center gap-4 mt-2">
                  <div className="flex items-center gap-1">
                    <Star className="w-4 h-4 text-yellow-500 fill-yellow-500" />
                    <span className="font-semibold">{workshop.rating.toFixed(1)}</span>
                  </div>
                  <span className="text-sm text-muted-foreground">{workshop.totalServices} servicios</span>
                  <Badge variant="secondary" className="text-xs">
                    <Shield className="w-3 h-3 mr-1" />
                    Verificado
                  </Badge>
                </div>
              </div>
            </div>

            {workshop.description && (
              <>
                <Separator />
                <div>
                  <p className="text-sm font-medium mb-1">Descripción</p>
                  <p className="text-sm text-muted-foreground">{workshop.description}</p>
                </div>
              </>
            )}

            {workshop.guaranteePolicy && (
              <div>
                <p className="text-sm font-medium mb-1">Política de garantía</p>
                <p className="text-sm text-muted-foreground">{workshop.guaranteePolicy}</p>
              </div>
            )}

            {workshop.evidenceRate > 0 && (
              <div className="flex items-center gap-2 text-sm">
                <CheckCircle2 className="w-4 h-4 text-green-600" />
                <span>Tasa de evidencia: {(workshop.evidenceRate * 100).toFixed(0)}%</span>
              </div>
            )}
          </CardContent>
        </Card>
      </motion.div>

      {/* Categories / Specialties */}
      {workshop.categories.length > 0 && (
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="text-base">Especialidades</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {workshop.categories.map((cat: any) => (
                <Badge key={cat.id} variant="secondary">
                  {cat.name}
                </Badge>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Reviews */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">
            Reseñas ({workshop.reviews.length})
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {workshop.reviews.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-4">
              Este taller aún no tiene reseñas.
            </p>
          ) : (
            workshop.reviews.map((review: any, i: number) => (
              <motion.div
                key={review.id}
                initial={{ opacity: 0, y: 5 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
              >
                <div className="p-3 rounded-lg border">
                  <div className="flex items-center gap-2 mb-2">
                    <div className="w-8 h-8 rounded-full bg-secondary flex items-center justify-center text-xs font-bold">
                      {review.userName.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <p className="text-sm font-medium">{review.userName}</p>
                      <div className="flex items-center gap-1">
                        {Array.from({ length: 5 }).map((_, si) => (
                          <Star
                            key={si}
                            className={`w-3 h-3 ${
                              si < review.rating
                                ? "text-yellow-500 fill-yellow-500"
                                : "text-gray-300"
                            }`}
                          />
                        ))}
                      </div>
                    </div>
                    <span className="ml-auto text-xs text-muted-foreground flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {new Date(review.createdAt).toLocaleDateString("es-PE", {
                        day: "2-digit",
                        month: "short",
                        year: "numeric",
                      })}
                    </span>
                  </div>
                  {review.comment && (
                    <p className="text-sm text-muted-foreground">{review.comment}</p>
                  )}
                </div>
              </motion.div>
            ))
          )}
        </CardContent>
      </Card>
    </div>
  );
}
