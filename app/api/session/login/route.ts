import { NextRequest } from "next/server";

const BACKEND_BASE = (
  process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000"
).replace(/\/+$/, "");

const MAX_BODY_LENGTH = 16 * 1024;
const UPSTREAM_TIMEOUT_MS = 10000;

function jsonError(status: number, message: string): Response {
  return Response.json(
    { message },
    { status, headers: { "cache-control": "no-store" } },
  );
}

export async function POST(request: NextRequest): Promise<Response> {
  const raw = await request.text();
  if (!raw || raw.length > MAX_BODY_LENGTH) {
    return jsonError(400, "Invalid request body.");
  }
  let body: unknown;
  try {
    body = JSON.parse(raw);
  } catch {
    return jsonError(400, "Invalid JSON body.");
  }

  try {
    const upstream = await fetch(`${BACKEND_BASE}/auth/admin-login`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(body),
      signal: AbortSignal.timeout(UPSTREAM_TIMEOUT_MS),
      cache: "no-store",
    });
    return new Response(upstream.body, {
      status: upstream.status,
      statusText: upstream.statusText,
      headers: {
        "cache-control": "no-store",
        "content-type": upstream.headers.get("content-type") ?? "application/json",
      },
    });
  } catch {
    return jsonError(502, "Authentication service unavailable.");
  }
}
