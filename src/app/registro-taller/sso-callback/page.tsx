"use client";

import { AuthenticateWithRedirectCallback } from "@clerk/nextjs";

export default function RegistroTallerSSOCallback() {
  return <AuthenticateWithRedirectCallback signUpForceRedirectUrl="/registro-taller" />;
}
