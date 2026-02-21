"use client";

import { AuthenticateWithRedirectCallback } from "@clerk/nextjs";

export default function AdminLoginSSOCallback() {
  return <AuthenticateWithRedirectCallback signInForceRedirectUrl="/admin-login" />;
}
