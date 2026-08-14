"use client";

import AppLayout from "@cloudscape-design/components/app-layout";
import type { ReactNode } from "react";

import { Breadcrumbs } from "@/components/layout/Breadcrumbs";
import { NotificationFlashbar } from "@/components/layout/NotificationFlashbar";
import { SideNav } from "@/components/layout/SideNav";
import { TopNavBar } from "@/components/layout/TopNavBar";
import { useBreadcrumbContext } from "@/context/BreadcrumbContext";

export interface ConsoleShellProps {
  children: ReactNode;
}

export function ConsoleShell({ children }: ConsoleShellProps) {
  const { items: breadcrumbItems } = useBreadcrumbContext();

  return (
    <>
      <TopNavBar />
      <AppLayout
        headerSelector="#app-header"
        navigation={<SideNav />}
        breadcrumbs={<Breadcrumbs items={breadcrumbItems} />}
        notifications={<NotificationFlashbar />}
        content={children}
        toolsHide
        splitPanelPreferences={{ position: "side" }}
      />
    </>
  );
}
