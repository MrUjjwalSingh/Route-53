"use client";

import { useRouter } from "next/navigation";
import { useEffect, type ReactNode } from "react";

import Spinner from "@cloudscape-design/components/spinner";

import { ConsoleShell } from "@/components/layout/ConsoleShell";
import { SESSION_EXPIRED_FLAG } from "@/context/AuthContext";
import { useAuth } from "@/lib/hooks/useAuth";

export default function ConsoleLayout({ children }: { children: ReactNode }) {
  const { user, isLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading && !user) {
      const expired = typeof window !== "undefined" && sessionStorage.getItem(SESSION_EXPIRED_FLAG);
      if (expired) {
        sessionStorage.removeItem(SESSION_EXPIRED_FLAG);
        router.replace("/login?expired=1");
      } else {
        router.replace("/login");
      }
    }
  }, [isLoading, user, router]);

  if (isLoading || !user) {
    return (
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          height: "100vh",
        }}
      >
        <Spinner size="large" />
      </div>
    );
  }

  return <ConsoleShell>{children}</ConsoleShell>;
}
