import { parseApiError } from "./errors";

let inMemoryAccessToken: string | null = null;

export function getAccessToken(): string | null {
  return inMemoryAccessToken;
}

export function setAccessToken(token: string | null): void {
  inMemoryAccessToken = token;
}

export async function refreshAccessToken(): Promise<string | null> {
  try {
    const res = await fetch("/api/auth/refresh", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
    });

    if (!res.ok) {
      setAccessToken(null);
      return null;
    }

    const data = (await res.json()) as { accessToken?: string };
    if (data.accessToken) {
      setAccessToken(data.accessToken);
      return data.accessToken;
    }

    setAccessToken(null);
    return null;
  } catch {
    setAccessToken(null);
    return null;
  }
}

export interface RequestOptions extends RequestInit {
  skipAuth?: boolean;
}

export function resolveApiUrl(endpoint: string): string {
  if (endpoint.startsWith("http://") || endpoint.startsWith("https://")) {
    return endpoint;
  }
  const normalized = endpoint.startsWith("/") ? endpoint : `/${endpoint}`;
  if (normalized === "/api/v1" || normalized.startsWith("/api/v1/")) {
    return normalized;
  }
  return `/api/v1${normalized}`;
}

export async function apiClient<T>(endpoint: string, options: RequestOptions = {}): Promise<T> {
  const { skipAuth = false, headers: customHeaders, ...rest } = options;

  const url = resolveApiUrl(endpoint);

  const headers = new Headers(customHeaders);
  if (!headers.has("Content-Type") && rest.body) {
    headers.set("Content-Type", "application/json");
  }

  const token = getAccessToken();
  if (!skipAuth && token) {
    headers.set("Authorization", `Bearer ${token}`);
  }

  let response = await fetch(url, {
    ...rest,
    headers,
  });

  if (response.status === 401 && !skipAuth) {
    const refreshedToken = await refreshAccessToken();
    if (refreshedToken) {
      const retryHeaders = new Headers(headers);
      retryHeaders.set("Authorization", `Bearer ${refreshedToken}`);
      response = await fetch(url, {
        ...rest,
        headers: retryHeaders,
      });
    }
  }

  if (response.status === 204) {
    return {} as T;
  }

  let rawText = "";
  if (typeof response.text === "function") {
    rawText = await response.text();
  } else if (typeof response.json === "function") {
    const jsonVal = await response.json();
    rawText = typeof jsonVal === "string" ? jsonVal : JSON.stringify(jsonVal);
  }

  let parsedBody: unknown = null;
  if (rawText) {
    try {
      parsedBody = JSON.parse(rawText);
    } catch {
      parsedBody = rawText;
    }
  }

  if (!response.ok) {
    throw parseApiError(response.status, parsedBody);
  }

  return (parsedBody ?? ({} as T)) as T;
}
