"use client";

import { useEffect } from "react";
import { PageHeader } from "@/components/shared/page-header";
import { FeatureBadge } from "@/components/shared/feature-badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { FEATURE_FLAGS } from "@/lib/feature-flags";
import { useFeatureFlags } from "@/stores/feature-flags-store";
import { toast } from "sonner";
import {
  Zap,
  Sparkles,
  FlaskConical,
  Shield,
} from "lucide-react";

const badgeConfig = {
  MVP: { icon: Zap, color: "bg-primary/15 text-primary" },
  EXTRA: { icon: Sparkles, color: "bg-blue-100 text-blue-800" },
  LABS: { icon: FlaskConical, color: "bg-purple-100 text-purple-800" },
};

export default function AdminConfigPage() {
  const { flags, isEnabled, setFlag, mvpMode, setMvpMode, loaded, loadFlags } = useFeatureFlags();

  useEffect(() => {
    loadFlags();
  }, [loadFlags]);

  const mvpFlags = FEATURE_FLAGS.filter((f) => f.badge === "MVP");
  const extraFlags = FEATURE_FLAGS.filter((f) => f.badge === "EXTRA");
  const labsFlags = FEATURE_FLAGS.filter((f) => f.badge === "LABS");

  const handleMvpToggle = async () => {
    await setMvpMode(!mvpMode);
    toast(mvpMode ? "Modo completo activado" : "Modo MVP activado", {
      description: mvpMode ? "Todas las features configuradas están visibles para todos los usuarios" : "Solo features MVP están activas para todos los usuarios",
    });
  };

  if (!loaded) {
    return (
      <div className="pb-20 lg:pb-0 max-w-3xl">
        <PageHeader title="Configuración" description="Gestiona los feature flags y configuración de la plataforma" badge="EXTRA" />
        <div className="space-y-4">
          {[1, 2, 3].map((i) => <Skeleton key={i} className="h-32 w-full rounded-lg" />)}
        </div>
      </div>
    );
  }

  return (
    <div className="pb-20 lg:pb-0 max-w-3xl">
      <PageHeader title="Configuración" description="Gestiona los feature flags y configuración de la plataforma" badge="EXTRA" />

      {/* MVP Mode toggle */}
      <Card className="mb-6 border-primary/30">
        <CardContent className="pt-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                <Shield className="w-5 h-5 text-primary" />
              </div>
              <div>
                <h3 className="font-semibold text-sm">Modo MVP</h3>
                <p className="text-xs text-muted-foreground">Solo muestra features marcadas como MVP</p>
              </div>
            </div>
            <Switch checked={mvpMode} onCheckedChange={handleMvpToggle} />
          </div>
        </CardContent>
      </Card>

      {/* Feature flags by category */}
      {[
        { title: "Features MVP", flags: mvpFlags, badge: "MVP" as const },
        { title: "Features Extra", flags: extraFlags, badge: "EXTRA" as const },
        { title: "Features Labs (Experimental)", flags: labsFlags, badge: "LABS" as const },
      ].map((section) => (
        <Card key={section.title} className="mb-6">
          <CardHeader>
            <div className="flex items-center gap-2">
              <CardTitle className="text-base">{section.title}</CardTitle>
              <FeatureBadge type={section.badge} />
              <Badge variant="secondary" className="text-[10px]">{section.flags.length} features</Badge>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-0">
              {section.flags.map((flag, i) => {
                const enabled = isEnabled(flag.key);
                return (
                  <div key={flag.key}>
                    <div className="flex items-center justify-between py-3">
                      <div className="flex-1 min-w-0 mr-4">
                        <div className="flex items-center gap-2">
                          <p className="text-sm font-medium">{flag.name}</p>
                          <code className="text-[10px] text-muted-foreground bg-secondary px-1 rounded">{flag.key}</code>
                        </div>
                        <p className="text-xs text-muted-foreground mt-0.5">{flag.description}</p>
                      </div>
                      <Switch
                        checked={enabled}
                        onCheckedChange={async () => {
                          await setFlag(flag.key, !enabled);
                          toast(`${flag.name} ${enabled ? "desactivada" : "activada"}`);
                        }}
                        disabled={mvpMode && section.badge !== "MVP"}
                      />
                    </div>
                    {i < section.flags.length - 1 && <Separator />}
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
