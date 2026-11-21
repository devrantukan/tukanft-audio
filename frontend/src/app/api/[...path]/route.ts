import { NextRequest, NextResponse } from "next/server";

const BACKEND_URL = process.env.API_INTERNAL_URL || "http://127.0.0.1:8088";

export const dynamic = "force-dynamic";

async function proxyRequest(request: NextRequest, { params }: { params: Promise<{ path: string[] }> }) {
  const { path } = await params;
  const targetPath = path ? path.join("/") : "";
  const targetUrl = new URL(`/api/${targetPath}${request.nextUrl.search}`, BACKEND_URL);

  const reqHeaders = new Headers();
  request.headers.forEach((val, key) => {
    const k = key.toLowerCase();
    if (k !== "host" && k !== "connection") {
      reqHeaders.set(key, val);
    }
  });

  try {
    const fetchOptions: RequestInit = {
      method: request.method,
      headers: reqHeaders,
      cache: "no-store",
    };

    if (request.method !== "GET" && request.method !== "HEAD") {
      const bodyBytes = await request.arrayBuffer();
      if (bodyBytes.byteLength > 0) {
        fetchOptions.body = bodyBytes;
      }
    }

    const backendRes = await fetch(targetUrl.toString(), fetchOptions);

    const resHeaders = new Headers();
    backendRes.headers.forEach((val, key) => {
      const k = key.toLowerCase();
      if (k !== "content-encoding" && k !== "transfer-encoding") {
        resHeaders.set(key, val);
      }
    });

    return new NextResponse(backendRes.body, {
      status: backendRes.status,
      statusText: backendRes.statusText,
      headers: resHeaders,
    });
  } catch (error: any) {
    console.error(`[API Proxy] Error forwarding to ${targetUrl.toString()}:`, error);
    return NextResponse.json(
      { detail: `Backend proxy connection failed: ${error.message || error}` },
      { status: 502 }
    );
  }
}

export const GET = proxyRequest;
export const POST = proxyRequest;
export const PUT = proxyRequest;
export const DELETE = proxyRequest;
export const PATCH = proxyRequest;
export const HEAD = proxyRequest;
export const OPTIONS = proxyRequest;
