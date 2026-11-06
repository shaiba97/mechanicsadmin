export const API_URL = (
  process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000"
).replace(/\/+$/, "");

export class ApiError extends Error {
  readonly status: number;

  constructor(status: number, message: string) {
    super(message);
    this.status = status;
  }
}

export type ApiListResponse<T> = {
  count: number;
  next: string | null;
  previous: string | null;
  results: T[];
};

async function toApiError(response: Response): Promise<ApiError> {
  const fallback = `Request failed (${response.status})`;
  let message = fallback;
  try {
    const body = (await response.json()) as { error?: { message?: string } };
    if (body?.error?.message) {
      message = body.error.message;
    }
  } catch {
    message = fallback;
  }
  return new ApiError(response.status, message);
}

async function toResponse(path: string, init?: RequestInit): Promise<Response> {
  const response = await fetch(`${API_URL}${path}`, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...(init?.headers ?? {}),
    },
  });
  if (!response.ok) {
    throw await toApiError(response);
  }
  return response;
}

export const api = {
  async get<T>(path: string): Promise<T> {
    const response = await toResponse(path);
    return (await response.json()) as T;
  },
  async post<T>(path: string, body: unknown): Promise<T> {
    const response = await toResponse(path, {
      method: "POST",
      body: JSON.stringify(body),
    });
    return (await response.json()) as T;
  },
  async patch<T>(path: string, body: unknown): Promise<T> {
    const response = await toResponse(path, {
      method: "PATCH",
      body: JSON.stringify(body),
    });
    return (await response.json()) as T;
  },
  async delete(path: string): Promise<void> {
    await toResponse(path, { method: "DELETE" });
  },
};
