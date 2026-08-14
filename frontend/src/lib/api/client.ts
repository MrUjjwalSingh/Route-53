import type { ApiErrorEnvelope } from "@/lib/types";

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:8000/api";

export class ApiError extends Error {
  code: string;
  field?: string;
  errors?: string[];
  status: number;

  constructor(status: number, envelope: ApiErrorEnvelope["error"]) {
    super(envelope.message);
    this.name = "ApiError";
    this.status = status;
    this.code = envelope.code;
    this.field = envelope.field;
    this.errors = envelope.errors;
  }
}

interface ApiFetchOptions {
  method?: "GET" | "POST" | "PATCH" | "DELETE" | "PUT";
  body?: unknown;
  query?: Record<string, string | number | boolean | undefined | null>;
}

// Paths whose own 401s are expected/routine and must NOT trigger the global
// "your session has expired" flow — they run before any session exists.
const AUTH_BOOTSTRAP_PATHS = ["/auth/me", "/auth/login"];

type UnauthorizedHandler = () => void;
let unauthorizedHandler: UnauthorizedHandler | null = null;

export function setUnauthorizedHandler(handler: UnauthorizedHandler | null): void {
  unauthorizedHandler = handler;
}

function buildUrl(path: string, query?: ApiFetchOptions["query"]): string {
  const url = new URL(`${API_BASE_URL}${path}`);
  if (query) {
    for (const [key, value] of Object.entries(query)) {
      if (value !== undefined && value !== null && value !== "") {
        url.searchParams.set(key, String(value));
      }
    }
  }
  return url.toString();
}

export async function apiFetch<T>(path: string, options: ApiFetchOptions = {}): Promise<T> {
  const { method = "GET", body, query } = options;

  const response = await fetch(buildUrl(path, query), {
    method,
    credentials: "include",
    headers: body !== undefined ? { "Content-Type": "application/json" } : undefined,
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });

  if (response.status === 204) {
    return undefined as T;
  }

  const isJson = response.headers.get("content-type")?.includes("application/json");
  const data = isJson ? await response.json() : undefined;

  if (!response.ok) {
    const envelope: ApiErrorEnvelope["error"] = data?.error ?? {
      code: "UnknownError",
      message: response.statusText || "Something went wrong.",
    };
    if (response.status === 401 && !AUTH_BOOTSTRAP_PATHS.includes(path)) {
      unauthorizedHandler?.();
    }
    throw new ApiError(response.status, envelope);
  }

  return data as T;
}
