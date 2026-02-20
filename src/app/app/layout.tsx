import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { AppShell } from "@/components/shared/app-shell";
import { TermsDialog } from "@/components/shared/terms-dialog";
import { getProfile } from "@/app/actions/profile";

export const dynamic = "force-dynamic";

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { userId } = await auth();
  if (!userId) redirect("/sign-in");

  let termsAccepted = true;
  try {
    const profile = await getProfile();
    termsAccepted = profile?.termsAccepted ?? false;
  } catch {
    // If profile fetch fails, don't block the app
  }

  return (
    <AppShell>
      <TermsDialog termsAccepted={termsAccepted} />
      {children}
    </AppShell>
  );
}
