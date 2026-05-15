import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";

const hopByHopHeaders = new Set([
  "connection",
  "content-encoding",
  "content-length",
  "host",
  "keep-alive",
  "proxy-authenticate",
  "proxy-authorization",
  "te",
  "trailer",
  "transfer-encoding",
  "upgrade"
]);

function apiTarget() {
  const configured = process.env.API_PROXY_TARGET?.trim().replace(/\/+$/, "") || (process.env.NODE_ENV === "production" ? "" : "http://127.0.0.1:5000");
  if (!configured) return undefined;
  return configured.endsWith("/api") ? configured : `${configured}/api`;
}

function forwardedHeaders(request: NextRequest) {
  const headers = new Headers();

  request.headers.forEach((value, key) => {
    if (!hopByHopHeaders.has(key.toLowerCase())) {
      headers.set(key, value);
    }
  });

  headers.set("x-forwarded-host", request.headers.get("host") ?? "");
  headers.set("x-forwarded-proto", request.nextUrl.protocol.replace(":", ""));
  return headers;
}

async function proxy(request: NextRequest, context: { params: Promise<{ path?: string[] }> }) {
  const target = apiTarget();

  if (!target) {
    return NextResponse.json(
      {
        message: "API proxy target is not configured. Set API_PROXY_TARGET on the frontend service to the backend Railway URL."
      },
      { status: 503 }
    );
  }

  const { path = [] } = await context.params;
  const targetUrl = new URL(`${target}/${path.map(encodeURIComponent).join("/")}`);
  targetUrl.search = request.nextUrl.search;

  if (targetUrl.host === request.nextUrl.host) {
    return NextResponse.json({ message: "API proxy target points back to the frontend service." }, { status: 503 });
  }

  const response = await fetch(targetUrl, {
    method: request.method,
    headers: forwardedHeaders(request),
    body: ["GET", "HEAD"].includes(request.method) ? undefined : await request.arrayBuffer(),
    redirect: "manual"
  }).catch((error: unknown) => {
    const message = error instanceof Error ? error.message : "Unknown proxy error";
    return NextResponse.json(
      {
        message: "Backend API is unreachable from the frontend proxy.",
        targetOrigin: targetUrl.origin,
        detail: message
      },
      { status: 502 }
    );
  });

  const responseHeaders = new Headers(response.headers);
  hopByHopHeaders.forEach((header) => responseHeaders.delete(header));

  return new NextResponse(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers: responseHeaders
  });
}

export const GET = proxy;
export const POST = proxy;
export const PUT = proxy;
export const PATCH = proxy;
export const DELETE = proxy;
export const OPTIONS = proxy;
