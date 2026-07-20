const API_BASE = (import.meta as any).env.VITE_API_BASE_URL || "";

export class APIError extends Error {
  constructor(public status: number, public message: string, public code?: string, public details?: any) {
    super(message);
    this.name = "APIError";
  }
}

/**
 * Common fetch request wrapper which implements credentials-include
 * and robust, patterned JSON error parsing.
 */
async function request<T = any>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const url = endpoint.startsWith("http") ? endpoint : `${API_BASE}${endpoint}`;
  
  // Set credentials: include to send security httpOnly cookies automatically.
  options.credentials = "include";
  
  // Clean headers
  options.headers = {
    "Content-Type": "application/json",
    ...options.headers,
  } as any;

  if (options.body && typeof options.body !== "string" && !(options.body instanceof FormData)) {
    options.body = JSON.stringify(options.body);
  }

  // If it is FormData (like product image uploads), let the browser set the boundary header automatically
  if (options.body instanceof FormData) {
    delete (options.headers as any)["Content-Type"];
  }

  const res = await fetch(url, options);

  if (!res.ok) {
    let errorMsg = "A network error occurred. Please try again.";
    let errCode = "NETWORK_ERROR";
    let details: any = null;

    try {
      const errorJson = await res.json();
      errorMsg = errorJson.error || errorMsg;
      errCode = errorJson.code || errCode;
      details = errorJson.details || null;
    } catch {
      // Ignored if response is not JSON
    }

    throw new APIError(res.status, errorMsg, errCode, details);
  }

  // 204 No Content responses
  if (res.status === 204) {
    return {} as T;
  }

  return res.json() as Promise<T>;
}

export const api = {
  get: <T = any>(url: string, headers?: HeadersInit) => request<T>(url, { method: "GET", headers }),
  post: <T = any>(url: string, body?: any, headers?: HeadersInit) => request<T>(url, { method: "POST", body, headers }),
  put: <T = any>(url: string, body?: any, headers?: HeadersInit) => request<T>(url, { method: "PUT", body, headers }),
  delete: <T = any>(url: string, body?: any, headers?: HeadersInit) => request<T>(url, { method: "DELETE", body, headers }),
};
