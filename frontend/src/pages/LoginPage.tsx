import { useState, type FormEvent } from 'react';
import { motion } from 'framer-motion';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { login, loginWithGoogle } from '../api/auth';
import { extractApiError } from '../api/client';
import GoogleSignInButton from '../components/GoogleSignInButton';
import { WalletIcon } from '../components/Icons';
import { useAuth } from '../hooks/useAuth';

const DEMO_EMAIL = 'demo@expensetracker.app';
const DEMO_PASSWORD = 'demo-password-123';

const inputClass =
  'w-full rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm transition focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-200 dark:border-gray-700 dark:bg-gray-800 dark:focus:ring-indigo-900';

export default function LoginPage() {
  const auth = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const from = (location.state as { from?: { pathname: string } } | null)?.from?.pathname ?? '/';

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [demoLoading, setDemoLoading] = useState(false);

  const signIn = async (credentials: { email: string; password: string }) => {
    setError(null);
    try {
      const response = await login(credentials);
      auth.login(response);
      navigate(from, { replace: true });
    } catch (err) {
      setError(extractApiError(err)?.message ?? 'Login failed. Is the backend running?');
    }
  };

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    if (!email.trim() || !password) {
      setError('Email and password are required');
      return;
    }
    setSubmitting(true);
    await signIn({ email: email.trim(), password });
    setSubmitting(false);
  };

  const handleDemo = async () => {
    setDemoLoading(true);
    await signIn({ email: DEMO_EMAIL, password: DEMO_PASSWORD });
    setDemoLoading(false);
  };

  const handleGoogleCredential = async (idToken: string) => {
    setError(null);
    try {
      const response = await loginWithGoogle(idToken);
      auth.login(response);
      navigate(from, { replace: true });
    } catch (err) {
      setError(extractApiError(err)?.message ?? 'Google sign-in failed. Is the backend running?');
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center px-4">
      <motion.div
        initial={{ opacity: 0, y: 14 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="w-full max-w-sm"
      >
        <div className="mb-6 text-center">
          <span className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-indigo-500 to-violet-600 text-white shadow-lg shadow-indigo-600/25">
            <WalletIcon width={22} height={22} />
          </span>
          <h1 className="text-2xl font-semibold tracking-tight">Welcome back</h1>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            Sign in to your expense tracker
          </p>
        </div>

        <form
          onSubmit={handleSubmit}
          className="space-y-4 rounded-2xl border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-800 dark:bg-gray-900"
          noValidate
        >
          <div>
            <label htmlFor="email" className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
              Email
            </label>
            <input
              id="email"
              type="email"
              autoComplete="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              className={inputClass}
              placeholder="you@example.com"
            />
          </div>

          <div>
            <label htmlFor="password" className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
              Password
            </label>
            <input
              id="password"
              type="password"
              autoComplete="current-password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              className={inputClass}
              placeholder="••••••••"
            />
          </div>

          {error && (
            <p className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-700 dark:bg-red-950/60 dark:text-red-300">
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={submitting || demoLoading}
            className="w-full rounded-md bg-indigo-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-indigo-700 disabled:opacity-60"
          >
            {submitting ? 'Signing in…' : 'Sign in'}
          </button>

          <div className="relative text-center">
            <span className="relative z-10 bg-white px-2 text-xs text-gray-400 dark:bg-gray-900 dark:text-gray-500">
              or
            </span>
            <span className="absolute inset-x-0 top-1/2 h-px bg-gray-200 dark:bg-gray-800" />
          </div>

          <GoogleSignInButton
            onCredential={handleGoogleCredential}
            onError={(message) => setError(message)}
          />

          <button
            type="button"
            onClick={handleDemo}
            disabled={submitting || demoLoading}
            className="w-full rounded-md border border-indigo-200 bg-indigo-50 px-4 py-2 text-sm font-medium text-indigo-700 transition hover:bg-indigo-100 disabled:opacity-60 dark:border-indigo-900 dark:bg-indigo-950/60 dark:text-indigo-300 dark:hover:bg-indigo-950"
          >
            {demoLoading ? 'Loading demo…' : 'Try the demo — no signup needed'}
          </button>

          <p className="text-center text-sm text-gray-500 dark:text-gray-400">
            No account?{' '}
            <Link to="/register" className="font-medium text-indigo-600 hover:text-indigo-800 dark:text-indigo-400">
              Create one
            </Link>
          </p>
        </form>
      </motion.div>
    </div>
  );
}
