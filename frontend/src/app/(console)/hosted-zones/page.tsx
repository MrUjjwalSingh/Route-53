"use client";

import Spinner from "@cloudscape-design/components/spinner";
import { Suspense } from "react";

import { HostedZonesTable } from "@/components/hosted-zones/HostedZonesTable";

export default function HostedZonesPage() {
  return (
    <Suspense fallback={<Spinner size="large" />}>
      <HostedZonesTable />
    </Suspense>
  );
}
