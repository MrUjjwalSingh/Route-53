"use client";

import Box from "@cloudscape-design/components/box";
import Button from "@cloudscape-design/components/button";
import ColumnLayout from "@cloudscape-design/components/column-layout";
import Container from "@cloudscape-design/components/container";
import ContentLayout from "@cloudscape-design/components/content-layout";
import ExpandableSection from "@cloudscape-design/components/expandable-section";
import Header from "@cloudscape-design/components/header";
import Link from "@cloudscape-design/components/link";

import SpaceBetween from "@cloudscape-design/components/space-between";
import StatusIndicator from "@cloudscape-design/components/status-indicator";
import { useRouter } from "next/navigation";

import { useHealthChecks } from "@/lib/hooks/useHealthChecks";
import { useZones } from "@/lib/hooks/useZones";

function StatCard({
  label,
  value,
  href,
  description,
}: {
  label: string;
  value: string | number;
  href: string;
  description?: string;
}) {
  const router = useRouter();
  return (
    <div
      style={{ cursor: "pointer" }}
      onClick={() => router.push(href)}
    >
      <Box variant="awsui-key-label">{label}</Box>
      <Box
        variant="h1"
        color="text-status-info"
        fontSize="display-l"
      >
        {value}
      </Box>
      {description && (
        <Box variant="p" color="text-body-secondary" fontSize="body-s">
          {description}
        </Box>
      )}
    </div>
  );
}

function StepRow({
  number,
  title,
  description,
  action,
}: {
  number: number;
  title: string;
  description: string;
  action?: { label: string; href: string };
}) {
  const router = useRouter();
  return (
    <div style={{ display: "flex", gap: 16, padding: "12px 0", borderBottom: "1px solid var(--color-border-divider-default, #e9ebed)" }}>
      <div
        style={{
          flexShrink: 0,
          width: 32,
          height: 32,
          borderRadius: "50%",
          background: "#0972d3",
          color: "#fff",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontWeight: 700,
          fontSize: 14,
        }}
      >
        {number}
      </div>
      <div style={{ flex: 1 }}>
        <Box variant="strong">{title}</Box>
        <Box color="text-body-secondary" fontSize="body-s" variant="p">
          {description}
        </Box>
        {action && (
          <div style={{ marginTop: 6 }}>
            <Button
              variant="inline-link"
              onClick={() => router.push(action.href)}
            >
              {action.label}
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}

export default function DashboardPage() {
  const { data: zones, isLoading } = useZones({ page_size: 100 });
  const { data: healthChecksData, isLoading: hcLoading } = useHealthChecks({ page_size: 1 });
  const router = useRouter();

  const totalZones = isLoading ? "…" : zones?.total ?? 0;
  const publicZones = isLoading
    ? "…"
    : zones?.items.filter((z) => z.type === "Public").length ?? 0;
  const privateZones = isLoading
    ? "…"
    : zones?.items.filter((z) => z.type === "Private").length ?? 0;
  const totalHealthChecks = hcLoading ? "…" : healthChecksData?.total ?? 0;

  return (
    <ContentLayout
      header={
        <Header
          variant="h1"
          description="Amazon Route 53 is a highly available and scalable cloud Domain Name System (DNS) web service."
          actions={
            <Button variant="primary" onClick={() => router.push("/hosted-zones/create")}>
              Create hosted zone
            </Button>
          }
        >
          Route 53 dashboard
        </Header>
      }
    >
      <SpaceBetween size="l">
        {/* Resource summary */}
        <Container
          header={
            <Header
              variant="h2"
              description="Overview of your Route 53 resources."
              actions={
                <Button
                  variant="link"
                  onClick={() => router.push("/hosted-zones")}
                >
                  View all hosted zones
                </Button>
              }
            >
              Resources
            </Header>
          }
        >
          <ColumnLayout columns={4} variant="text-grid">
            <StatCard
              label="Hosted zones"
              value={totalZones}
              href="/hosted-zones"
              description="Total DNS zones"
            />
            <StatCard
              label="Public zones"
              value={publicZones}
              href="/hosted-zones?type=Public"
              description="Internet-facing"
            />
            <StatCard
              label="Private zones"
              value={privateZones}
              href="/hosted-zones?type=Private"
              description="VPC-associated"
            />
            <StatCard
              label="Health checks"
              value={totalHealthChecks}
              href="/health-checks"
              description="Active monitors"
            />
          </ColumnLayout>
        </Container>

        {/* Service Health banner */}
        <Container
          header={<Header variant="h2">Service health</Header>}
        >
          <ColumnLayout columns={3} variant="text-grid">
            <div>
              <Box variant="awsui-key-label">DNS service</Box>
              <StatusIndicator type="success">Operational</StatusIndicator>
            </div>
            <div>
              <Box variant="awsui-key-label">Health check service</Box>
              <StatusIndicator type="success">Operational</StatusIndicator>
            </div>
            <div>
              <Box variant="awsui-key-label">Domain registration</Box>
              <StatusIndicator type="success">Operational</StatusIndicator>
            </div>
          </ColumnLayout>
        </Container>

        {/* Getting started */}
        <Container
          header={
            <Header
              variant="h2"
              description="Follow these steps to set up DNS routing for your domain."
            >
              Getting started with Route 53
            </Header>
          }
        >
          <SpaceBetween size="s">
            <StepRow
              number={1}
              title="Create a hosted zone"
              description="A hosted zone is a container for records, and records contain information about how you want to route traffic for a specific domain, such as example.com, and its subdomains."
              action={{ label: "Create hosted zone", href: "/hosted-zones/create" }}
            />
            <StepRow
              number={2}
              title="Create DNS records"
              description="After creating a hosted zone, create records to specify how you want to route traffic to your resources, such as Amazon EC2 instances, Elastic Load Balancing load balancers, or Amazon S3 buckets."
              action={{ label: "View hosted zones", href: "/hosted-zones" }}
            />
            <StepRow
              number={3}
              title="Update your domain's name servers (optional)"
              description="If you registered your domain with another registrar, update the name servers at the registrar to use the Route 53 name servers that were assigned to the hosted zone when you created it."
            />
            <StepRow
              number={4}
              title="Create health checks (optional)"
              description="Route 53 health checks monitor the health and performance of your web applications, web servers, and other resources. Route 53 can route traffic away from unhealthy resources."
              action={{ label: "Create health check", href: "/health-checks" }}
            />
          </SpaceBetween>
        </Container>

        {/* Additional features */}
        <ColumnLayout columns={2}>
          <Container
            header={<Header variant="h2">Additional features</Header>}
          >
            <SpaceBetween size="s">
              <ExpandableSection
                headerText="Traffic flow"
                headerDescription="Create sophisticated routing configurations"
              >
                <Box variant="p" color="text-body-secondary">
                  Use traffic flow to route your end users to the endpoint that will give them the best experience based on geoproximity, latency, health, and other considerations.
                </Box>
                <Button variant="inline-link" onClick={() => router.push("/traffic-policies")}>
                  View traffic policies →
                </Button>
              </ExpandableSection>
              <ExpandableSection
                headerText="Route 53 Resolver"
                headerDescription="Resolve DNS queries between VPCs and your network"
              >
                <Box variant="p" color="text-body-secondary">
                  Route 53 Resolver responds recursively to DNS queries from AWS resources for public records, VPC-specific DNS names, and private hosted zones.
                </Box>
                <Button variant="inline-link" onClick={() => router.push("/resolver")}>
                  Configure resolver →
                </Button>
              </ExpandableSection>
            </SpaceBetween>
          </Container>

          <Container
            header={<Header variant="h2">Quick links</Header>}
          >
            <SpaceBetween size="s">
              <Link href="https://docs.aws.amazon.com/Route53/latest/DeveloperGuide/Welcome.html" external>
                Route 53 Developer Guide
              </Link>
              <Link href="https://docs.aws.amazon.com/Route53/latest/APIReference/Welcome.html" external>
                Route 53 API Reference
              </Link>
              <Link href="https://aws.amazon.com/route53/pricing/" external>
                Route 53 Pricing
              </Link>
              <Link href="https://docs.aws.amazon.com/Route53/latest/DeveloperGuide/routing-policy.html" external>
                Routing Policies Guide
              </Link>
              <Link href="https://docs.aws.amazon.com/Route53/latest/DeveloperGuide/health-checks-creating.html" external>
                Creating Health Checks
              </Link>
            </SpaceBetween>
          </Container>
        </ColumnLayout>

        {/* Service limits */}
        <Container
          header={
            <Header
              variant="h2"
              description="Default limits for Route 53 resources."
              actions={
                <Link href="https://docs.aws.amazon.com/Route53/latest/DeveloperGuide/DNSLimitations.html" external>
                  View all limits
                </Link>
              }
            >
              Service quotas
            </Header>
          }
        >
          <ColumnLayout columns={4} variant="text-grid">
            <div>
              <Box variant="awsui-key-label">Hosted zones per account</Box>
              <Box>500</Box>
            </div>
            <div>
              <Box variant="awsui-key-label">Records per hosted zone</Box>
              <Box>10,000</Box>
            </div>
            <div>
              <Box variant="awsui-key-label">Health checks per account</Box>
              <Box>200</Box>
            </div>
            <div>
              <Box variant="awsui-key-label">Traffic policies per account</Box>
              <Box>50</Box>
            </div>
          </ColumnLayout>
        </Container>
      </SpaceBetween>
    </ContentLayout>
  );
}
