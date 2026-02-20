"use client";

import React from "react";
import { User } from "lucide-react";

/**
 * Safely renders a Clerk <UserButton>. Falls back to a plain avatar icon
 * when Clerk is not configured (placeholder keys).
 */
export function SafeUserButton({ afterSignOutUrl = "/" }: { afterSignOutUrl?: string }) {
  const [Component, setComponent] = React.useState<React.ComponentType<{ afterSignOutUrl: string }> | null>(null);
  const [failed, setFailed] = React.useState(false);

  React.useEffect(() => {
    import("@clerk/nextjs")
      .then((mod) => {
        // Validate that Clerk is usable by checking the key
        const key = process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY;
        if (key && !key.includes("PLACEHOLDER")) {
          setComponent(() => mod.UserButton);
        } else {
          setFailed(true);
        }
      })
      .catch(() => setFailed(true));
  }, []);

  if (failed || !Component) {
    return (
      <div className="w-8 h-8 rounded-full bg-secondary flex items-center justify-center">
        <User className="w-4 h-4 text-muted-foreground" />
      </div>
    );
  }

  return <Component afterSignOutUrl={afterSignOutUrl} />;
}
