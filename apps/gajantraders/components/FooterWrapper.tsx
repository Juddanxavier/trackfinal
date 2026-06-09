"use client";

import { usePathname } from "next/navigation";
import Footer from "./Footer";

const authPaths = [
  "/login",
  "/register",
  "/forgot-password",
  "/reset-password",
  "/verify-email",
  "/onboarding",
];

export default function FooterWrapper() {
  const pathname = usePathname();
  const isAuthPage = authPaths.some((p) => pathname?.startsWith(p));

  if (isAuthPage) return null;

  return <Footer />;
}
