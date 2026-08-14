"use client";

import Box from "@cloudscape-design/components/box";
import ExpandableSection from "@cloudscape-design/components/expandable-section";
import Header from "@cloudscape-design/components/header";
import SpaceBetween from "@cloudscape-design/components/space-between";

const FAQS = [
  {
    question: "Is this the real AWS Route 53?",
    answer:
      "No. This is an independent, unofficial clone built with Next.js, Cloudscape (AWS's own open-source component library), FastAPI, and SQLite, for demonstration and learning purposes. It isn't affiliated with or endorsed by Amazon Web Services.",
  },
  {
    question: "How do I try it?",
    answer: 'Sign in with the demo account: demo@route53clone.dev / Passw0rd!, shown on the sign-in page.',
  },
  {
    question: "Does it persist data?",
    answer:
      "Yes — everything is backed by SQLite, so hosted zones and records survive backend restarts.",
  },
  {
    question: "Which record types are supported?",
    answer:
      "A, AAAA, CNAME, MX, TXT, NS, SOA, SRV, and CAA, each with the same per-type validation rules the real console enforces (single-value CNAMEs, no apex CNAMEs, TXT quoting, etc.).",
  },
];

export function FaqSection() {
  return (
    <div id="faqs" style={{ padding: "3rem 2rem", maxWidth: "800px" }}>
      <SpaceBetween size="l">
        <Header variant="h2">Frequently asked questions</Header>
        <SpaceBetween size="xs">
          {FAQS.map((faq) => (
            <ExpandableSection key={faq.question} headerText={faq.question}>
              <Box variant="p">{faq.answer}</Box>
            </ExpandableSection>
          ))}
        </SpaceBetween>
      </SpaceBetween>
    </div>
  );
}
