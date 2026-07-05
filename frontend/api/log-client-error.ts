// Vercel serverless function (Node.js runtime). Deployed automatically because
// it lives in /api at the project root Vercel builds from (frontend/).
// Its only job is to print client-side error reports to stdout so they show
// up under this deployment's "Runtime Logs" / "Functions" tab in the Vercel
// dashboard — a static SPA otherwise has no way to surface browser failures
// there. Deliberately dependency-free: no @vercel/node import needed since
// Vercel calls this with an (req, res) pair at runtime regardless of typing.

interface MinimalRequest {
  method?: string;
  body?: unknown;
}

interface MinimalResponse {
  status(code: number): MinimalResponse;
  json(body: unknown): MinimalResponse;
  end(): void;
}

interface ClientErrorReport {
  message?: unknown;
  stack?: unknown;
  url?: unknown;
  userAgent?: unknown;
  context?: unknown;
  timestamp?: unknown;
}

const MAX_STRING_LENGTH = 2000;

function safeString(value: unknown): string | undefined {
  if (typeof value !== 'string' || value.length === 0) return undefined;
  return value.length > MAX_STRING_LENGTH ? `${value.slice(0, MAX_STRING_LENGTH)}…` : value;
}

export default function handler(req: MinimalRequest, res: MinimalResponse): void {
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }

  const body = (req.body ?? {}) as ClientErrorReport;

  console.error('[client-error]', {
    message: safeString(body.message) ?? 'Unknown client error',
    stack: safeString(body.stack),
    url: safeString(body.url),
    userAgent: safeString(body.userAgent),
    context: body.context,
    timestamp: safeString(body.timestamp) ?? new Date().toISOString(),
  });

  res.status(204).end();
}
