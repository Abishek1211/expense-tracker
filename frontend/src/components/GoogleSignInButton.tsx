import { useEffect, useRef, useState } from 'react';

const GSI_SRC = 'https://accounts.google.com/gsi/client';
const CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID as string | undefined;

interface GoogleCredentialResponse {
  credential: string;
}

interface GoogleAccountsId {
  initialize: (config: {
    client_id: string;
    callback: (response: GoogleCredentialResponse) => void;
  }) => void;
  renderButton: (parent: HTMLElement, options: Record<string, unknown>) => void;
}

declare global {
  interface Window {
    google?: { accounts?: { id?: GoogleAccountsId } };
  }
}

let gsiScriptPromise: Promise<void> | null = null;

function loadGsiScript(): Promise<void> {
  if (window.google?.accounts?.id) return Promise.resolve();
  if (!gsiScriptPromise) {
    gsiScriptPromise = new Promise((resolve, reject) => {
      const script = document.createElement('script');
      script.src = GSI_SRC;
      script.async = true;
      script.onload = () => resolve();
      script.onerror = () => {
        gsiScriptPromise = null;
        reject(new Error('Failed to load the Google sign-in script'));
      };
      document.head.appendChild(script);
    });
  }
  return gsiScriptPromise;
}

interface GoogleSignInButtonProps {
  onCredential: (idToken: string) => void;
  onError: (message: string) => void;
}

/**
 * Renders Google's official "Sign in with Google" button and hands the
 * resulting ID token to `onCredential`. Renders nothing when
 * VITE_GOOGLE_CLIENT_ID is not configured.
 */
export default function GoogleSignInButton({ onCredential, onError }: GoogleSignInButtonProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [failed, setFailed] = useState(false);
  const callbacksRef = useRef({ onCredential, onError });
  callbacksRef.current = { onCredential, onError };

  useEffect(() => {
    if (!CLIENT_ID) return;
    let cancelled = false;
    loadGsiScript()
      .then(() => {
        const googleId = window.google?.accounts?.id;
        if (cancelled || !googleId || !containerRef.current) return;
        googleId.initialize({
          client_id: CLIENT_ID,
          callback: (response) => callbacksRef.current.onCredential(response.credential),
        });
        googleId.renderButton(containerRef.current, {
          type: 'standard',
          theme: 'outline',
          size: 'large',
          text: 'continue_with',
          width: containerRef.current.offsetWidth || 300,
        });
      })
      .catch((err: Error) => {
        if (cancelled) return;
        setFailed(true);
        callbacksRef.current.onError(err.message);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  if (!CLIENT_ID || failed) return null;

  return <div ref={containerRef} className="flex min-h-[40px] justify-center" />;
}
