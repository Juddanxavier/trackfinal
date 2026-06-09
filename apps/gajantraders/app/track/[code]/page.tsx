"use client";

import { useEffect } from "react";
import { useParams, useRouter } from "next/navigation";

export default function TrackCodeRedirect() {
  const params = useParams();
  const router = useRouter();
  const code = params?.code as string;

  useEffect(() => {
    if (code) {
      router.replace(`/track?code=${encodeURIComponent(code)}`);
    } else {
      router.replace("/track");
    }
  }, [code, router]);

  return null;
}
