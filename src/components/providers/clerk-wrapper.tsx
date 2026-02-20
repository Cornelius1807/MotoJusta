"use client";

import { ClerkProvider } from "@clerk/nextjs";
import { esES } from "@clerk/localizations";

export function ClerkWrapper({ children }: { children: React.ReactNode }) {
  const key = process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY;
  const isConfigured = key && !key.includes("PLACEHOLDER");

  if (!isConfigured) {
    // Render children without Clerk – avoids the invalid publishableKey error
    // while still allowing the app to function in demo/preview mode.
    return <>{children}</>;
  }

  return (
    <ClerkProvider
      localization={esES}
      publishableKey={key}
      signInFallbackRedirectUrl="/app"
      signUpFallbackRedirectUrl="/app"
    >
      {children}
    </ClerkProvider>
  );
}
