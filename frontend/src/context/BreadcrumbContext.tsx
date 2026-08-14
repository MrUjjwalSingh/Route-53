"use client";

import type { BreadcrumbGroupProps } from "@cloudscape-design/components/breadcrumb-group";
import { createContext, useContext, useEffect, useState, type ReactNode } from "react";

interface BreadcrumbContextValue {
  items: BreadcrumbGroupProps.Item[] | undefined;
  setItems: (items: BreadcrumbGroupProps.Item[] | undefined) => void;
}

const BreadcrumbContext = createContext<BreadcrumbContextValue | undefined>(undefined);

export function BreadcrumbProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<BreadcrumbGroupProps.Item[] | undefined>(undefined);
  return (
    <BreadcrumbContext.Provider value={{ items, setItems }}>{children}</BreadcrumbContext.Provider>
  );
}

export function useBreadcrumbContext(): BreadcrumbContextValue {
  const context = useContext(BreadcrumbContext);
  if (!context) {
    throw new Error("useBreadcrumbContext must be used within a BreadcrumbProvider");
  }
  return context;
}

/** Pages call this to override the auto-derived breadcrumb trail, e.g. to show
 * a hosted zone's name instead of its opaque id. Cleared automatically on unmount. */
export function useBreadcrumbOverride(items: BreadcrumbGroupProps.Item[] | undefined) {
  const { setItems } = useBreadcrumbContext();

  useEffect(() => {
    setItems(items);
    return () => setItems(undefined);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [JSON.stringify(items)]);
}
