/**
 * Best-effort client error reporting. Logs to the browser console always
 * (visible in DevTools), and — in production only — forwards a small
 * payload to /api/log-client-error, a Vercel serverless function whose
 * console output shows up in Vercel's Runtime Logs. A static SPA has no
 * other way to surface browser-side failures in Vercel's dashboard.
 *
 * Never throws: a failure to report must never crash the app it's reporting on.
 */

interface ErrorContext {
  [key: string]: string | number | boolean | undefined;
}

const MAX_FIELD_LENGTH = 2000;

function truncate(value: string): string {
  return value.length > MAX_FIELD_LENGTH ? `${value.slice(0, MAX_FIELD_LENGTH)}…` : value;
}

export function reportError(error: unknown, context: ErrorContext = {}): void {
  const message = error instanceof Error ? error.message : String(error);
  const stack = error instanceof Error ? error.stack : undefined;

  // Always visible locally via DevTools, regardless of environment.
  console.error('[reportError]', message, context, error);

  if (import.meta.env.DEV) return; // avoid noise/log spam while developing

  try {
    const payload = JSON.stringify({
      message: truncate(message),
      stack: stack ? truncate(stack) : undefined,
      url: window.location.href,
      userAgent: navigator.userAgent,
      context,
      timestamp: new Date().toISOString(),
    });

    // keepalive lets this survive a page unload (e.g. error during navigation).
    fetch('/api/log-client-error', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: payload,
      keepalive: true,
    }).catch(() => {
      // Swallow — reporting failures must never surface to the user.
    });
  } catch {
    // JSON.stringify or fetch construction failed; nothing more we can do.
  }
}
