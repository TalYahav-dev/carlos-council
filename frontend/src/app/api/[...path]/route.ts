import { NextRequest } from 'next/server';

const BACKEND_BASE_URL =
  process.env.COUNCIL_BACKEND_URL ?? 'http://127.0.0.1:8000';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

async function proxyRequest(
  request: NextRequest,
  context: { params: Promise<{ path?: string[] }> },
) {
  const { path = [] } = await context.params;
  const upstreamUrl = new URL(`/api/${path.join('/')}`, BACKEND_BASE_URL);
  upstreamUrl.search = request.nextUrl.search;

  const requestHeaders = new Headers(request.headers);
  requestHeaders.delete('host');
  requestHeaders.delete('connection');
  requestHeaders.delete('content-length');

  const body =
    request.method === 'GET' || request.method === 'HEAD'
      ? undefined
      : await request.arrayBuffer();

  const upstreamResponse = await fetch(upstreamUrl, {
    method: request.method,
    headers: requestHeaders,
    body,
    redirect: 'manual',
    cache: 'no-store',
  });

  const responseHeaders = new Headers(upstreamResponse.headers);
  responseHeaders.set('x-council-proxy', 'nextjs');

  return new Response(upstreamResponse.body, {
    status: upstreamResponse.status,
    statusText: upstreamResponse.statusText,
    headers: responseHeaders,
  });
}

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ path?: string[] }> },
) {
  return proxyRequest(request, context);
}

export async function POST(
  request: NextRequest,
  context: { params: Promise<{ path?: string[] }> },
) {
  return proxyRequest(request, context);
}

export async function PUT(
  request: NextRequest,
  context: { params: Promise<{ path?: string[] }> },
) {
  return proxyRequest(request, context);
}

export async function OPTIONS(
  request: NextRequest,
  context: { params: Promise<{ path?: string[] }> },
) {
  return proxyRequest(request, context);
}
