"use client";

import { Badge } from "@/components/ui/badge";
import { FlaskConical, Sparkles, Zap } from "lucide-react";

interface FeatureBadgeProps {
  type: "MVP" | "EXTRA" | "LABS";
  className?: string;
}

export function FeatureBadge({ type, className = "" }: FeatureBadgeProps) {
  if (type === "MVP") {
    return (
      <Badge variant="default" className={`text-[10px] gap-1 ${className}`}>
        <Zap className="w-3 h-3" />
        MVP
      </Badge>
    );
  }
  if (type === "EXTRA") {
    return (
      <Badge variant="secondary" className={`text-[10px] gap-1 ${className}`}>
        <Sparkles className="w-3 h-3" />
        EXTRA
      </Badge>
    );
  }
  return (
    <Badge variant="outline" className={`text-[10px] gap-1 border-purple-400 text-purple-600 ${className}`}>
      <FlaskConical className="w-3 h-3" />
      LABS
    </Badge>
  );
}
