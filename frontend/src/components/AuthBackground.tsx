import { useEffect, useRef } from 'react';

/**
 * Ambient WebGL backdrop for the auth screens — a domain-warped noise field
 * tinted with the app's slate/emerald palette.
 *
 * The scene lives in `lib/authBackgroundScene` and is pulled in with a dynamic
 * import, so `three` lands in its own chunk that is fetched only on /login and
 * /register and never touches the dashboard bundle. Failure is silent by
 * design: if the chunk or the WebGL context is unavailable, the plain CSS
 * background simply stays.
 */
export default function AuthBackground() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    let disposed = false;
    let teardown: (() => void) | undefined;

    import('../lib/authBackgroundScene')
      .then(({ createAuthBackground }) => {
        if (disposed) return;
        teardown = createAuthBackground(canvas);
      })
      .catch(() => {
        /* no WebGL or chunk failed to load — nothing to surface to the user */
      });

    return () => {
      disposed = true;
      teardown?.();
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      aria-hidden="true"
      className="pointer-events-none fixed inset-0 -z-10 h-full w-full"
    />
  );
}
