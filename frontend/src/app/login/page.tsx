"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useState, type FormEvent } from "react";

import Alert from "@cloudscape-design/components/alert";
import Box from "@cloudscape-design/components/box";
import Button from "@cloudscape-design/components/button";
import Form from "@cloudscape-design/components/form";
import FormField from "@cloudscape-design/components/form-field";
import Input from "@cloudscape-design/components/input";
import SpaceBetween from "@cloudscape-design/components/space-between";
import Tabs from "@cloudscape-design/components/tabs";


import { ApiError } from "@/lib/api/client";
import { useAuth } from "@/lib/hooks/useAuth";

const DEMO_EMAIL = "demo@route53clone.dev";
const DEMO_PASSWORD = "Passw0rd!";


function LoginForm() {
  const { login } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const expired = searchParams.get("expired") === "1";

  const [activeTab, setActiveTab] = useState("root");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [accountId, setAccountId] = useState("");
  const [iamUser, setIamUser] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const effectiveEmail = activeTab === "iam" ? email : email;

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setError(null);
    setIsSubmitting(true);
    try {
      await login(effectiveEmail, password);
      router.replace("/dashboard");
    } catch (err) {
      setError(
        err instanceof ApiError
          ? err.message
          : "Something went wrong. Please try again."
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div
      style={{
        minHeight: "100vh",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        background: "#f2f3f3",
        padding: "2rem 1rem",
        fontFamily: "'Amazon Ember', 'Helvetica Neue', Helvetica, Arial, sans-serif",
      }}
    >
      {/* AWS Logo */}
      <div style={{ marginBottom: 24 }}>
        <svg viewBox="0 0 100 36" width="110" height="40" aria-label="Amazon Web Services">
          <text
            x="0"
            y="30"
            fontFamily="'Amazon Ember', Arial, sans-serif"
            fontWeight="900"
            fontSize="38"
            fill="#232F3E"
            letterSpacing="-2"
          >
            aws
          </text>
          {/* orange smile */}
          <path d="M2 35 Q50 48 98 35" fill="none" stroke="#FF9900" strokeWidth="4" strokeLinecap="round" />
        </svg>
      </div>

      <div style={{ width: "100%", maxWidth: 360 }}>
        <SpaceBetween size="l">
          {expired && !error && (
            <Alert type="info" header="Session expired">
              Your session has expired. Please sign in again.
            </Alert>
          )}
          {error && (
            <Alert type="error" header="There was a problem">
              {error}
            </Alert>
          )}

          <div
            style={{
              background: "#fff",
              borderRadius: 4,
              border: "1px solid #d5dbdb",
              padding: "24px 28px 28px",
              boxShadow: "0 1px 4px rgba(0,0,0,.12)",
            }}
          >
            <Box variant="h2" textAlign="center">
              Sign in
            </Box>

            <div style={{ marginTop: 16, marginBottom: 4 }}>
              <Tabs
                activeTabId={activeTab}
                onChange={(e) => {
                  setActiveTab(e.detail.activeTabId);
                  setError(null);
                }}
                tabs={[
                  { id: "root", label: "Root user" },
                  { id: "iam", label: "IAM user" },
                ]}
              />
            </div>

            <form onSubmit={handleSubmit}>
              <Form
                actions={
                  <Button
                    variant="primary"
                    fullWidth
                    loading={isSubmitting}
                    formAction="submit"
                  >
                    Sign in
                  </Button>
                }
              >
                <SpaceBetween size="m">
                  {activeTab === "iam" && (
                    <FormField
                      label="Account ID (12 digits) or account alias"
                      description="Enter the AWS account ID or alias for the account you want to access."
                    >
                      <Input
                        type="text"
                        value={accountId}
                        onChange={(e) => setAccountId(e.detail.value)}
                        placeholder="123456789012"
                      />
                    </FormField>
                  )}
                  <FormField label={activeTab === "root" ? "Root user email address" : "IAM user name"}>
                    <Input
                      type={activeTab === "root" ? "email" : "text"}
                      value={activeTab === "root" ? email : iamUser}
                      onChange={(e) =>
                        activeTab === "root"
                          ? setEmail(e.detail.value)
                          : setIamUser(e.detail.value)
                      }
                      placeholder={activeTab === "root" ? "you@example.com" : "IAM user name"}
                      autoFocus
                    />
                  </FormField>
                  {activeTab === "iam" && (
                    <FormField label="Email (for demo login)">
                      <Input
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.detail.value)}
                        placeholder="you@example.com"
                      />
                    </FormField>
                  )}
                  <FormField label="Password">
                    <Input
                      type="password"
                      value={password}
                      onChange={(e) => setPassword(e.detail.value)}
                    />
                  </FormField>
                </SpaceBetween>
              </Form>
            </form>

            <div style={{ marginTop: 16, textAlign: "center" }}>
              <Button variant="inline-link" href="#">
                Forgot your password?
              </Button>
            </div>
          </div>

          {/* Demo credentials */}
          <div
            style={{
              background: "#fff",
              borderRadius: 4,
              border: "1px solid #d5dbdb",
              padding: "16px 20px",
              boxShadow: "0 1px 4px rgba(0,0,0,.08)",
            }}
          >
            <SpaceBetween size="xs">
              <Box variant="strong" color="text-status-info">
                🔑 Demo credentials
              </Box>
              <Box variant="p" color="text-body-secondary" fontSize="body-s">
                Email: <code style={{ fontFamily: "monospace" }}>{DEMO_EMAIL}</code>
                <br />
                Password: <code style={{ fontFamily: "monospace" }}>{DEMO_PASSWORD}</code>
              </Box>
              <Button
                variant="inline-link"
                onClick={() => {
                  setEmail(DEMO_EMAIL);
                  setPassword(DEMO_PASSWORD);
                  setActiveTab("root");
                }}
              >
                Auto-fill credentials
              </Button>
            </SpaceBetween>
          </div>

          {/* Footer */}
          <Box textAlign="center" color="text-body-secondary" fontSize="body-s">
            © 2024, Amazon Web Services, Inc. or its affiliates.
            <br />
            All rights reserved.
          </Box>
        </SpaceBetween>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={null}>
      <LoginForm />
    </Suspense>
  );
}
