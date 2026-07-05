import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { BrowserRouter } from 'react-router-dom';
import { Toaster } from 'sonner';
import App from './App';
import AuthProvider from './components/AuthProvider';
import ErrorBoundary from './components/ErrorBoundary';
import { reportError } from './lib/logger';
import { initTheme } from './lib/theme';
import './index.css';

initTheme();

// Catch errors React's error boundary can't see: async code, event handlers,
// and rejected promises that nobody awaited.
window.addEventListener('error', (event) => {
  reportError(event.error ?? event.message, { source: 'window.onerror' });
});
window.addEventListener('unhandledrejection', (event) => {
  reportError(event.reason, { source: 'unhandledrejection' });
});

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      staleTime: 30_000,
    },
  },
});

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <AuthProvider>
          <BrowserRouter>
            <App />
            <Toaster richColors closeButton position="top-right" />
          </BrowserRouter>
        </AuthProvider>
      </QueryClientProvider>
    </ErrorBoundary>
  </StrictMode>,
);
