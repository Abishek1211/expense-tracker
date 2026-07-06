import { useState, type FormEvent } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { login } from '../api/auth';
import { extractApiError } from '../api/client';
import { WalletIcon } from '../components/Icons';
import { useAuth } from '../hooks/useAuth';

const DEMO_EMAIL = 'demo@expensetracker.app';
const DEMO_PASSWORD = 'demo-password-123';

const inputClass =
  'w-full rounded-md border border-slate-300 px-3 py-2 text-sm shadow-sm transition-colors focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-600/20 dark:border-slate-700 dark:bg-slate-800';

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

  return (
    <div className="flex min-h-screen items-center justify-center px-4">
      <div className="w-full max-w-sm">
        <div className="mb-6 text-center">
          <span className="mx-auto mb-3 flex h-11 w-11 items-center justify-center rounded-lg bg-emerald-600 text-white">
            <WalletIcon width={20} height={20} />
          </span>
          <h1 className="text-xl font-semibold tracking-tight">Welcome back</h1>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
            Sign in to your expense tracker
          </p>
        </div>

        <form
          onSubmit={handleSubmit}
          className="space-y-4 rounded-lg border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900"
          noValidate
        >
          <div>
            <label
              htmlFor="email"
              className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-300"
            >
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
            <label
              htmlFor="password"
              className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-300"
            >
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
            <p className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-700 dark:bg-red-950/50 dark:text-red-300">
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={submitting || demoLoading}
            className="w-full rounded-md bg-emerald-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-emerald-700 disabled:opacity-60"
          >
            {submitting ? 'Signing in…' : 'Sign in'}
          </button>

          <div className="relative text-center">
            <span className="relative z-10 bg-white px-2 text-xs text-slate-400 dark:bg-slate-900 dark:text-slate-500">
              or
            </span>
            <span className="absolute inset-x-0 top-1/2 h-px bg-slate-200 dark:bg-slate-800" />
          </div>

          <button
            type="button"
            onClick={handleDemo}
            disabled={submitting || demoLoading}
            className="w-full rounded-md border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-50 disabled:opacity-60 dark:border-slate-700 dark:bg-transparent dark:text-slate-300 dark:hover:bg-slate-800"
          >
            {demoLoading ? 'Loading demo…' : 'Try the demo — no signup needed'}
          </button>

          <p className="text-center text-sm text-slate-500 dark:text-slate-400">
            No account?{' '}
            <Link
              to="/register"
              className="font-medium text-emerald-700 hover:underline dark:text-emerald-400"
            >
              Create one
            </Link>
          </p>
        </form>
      </div>
    </div>
  );
}
