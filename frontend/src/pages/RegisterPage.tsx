import { useState, type FormEvent } from 'react';
import { motion } from 'framer-motion';
import { Link, useNavigate } from 'react-router-dom';
import { loginWithGoogle, register } from '../api/auth';
import { extractApiError } from '../api/client';
import GoogleSignInButton from '../components/GoogleSignInButton';
import { WalletIcon } from '../components/Icons';
import { useAuth } from '../hooks/useAuth';

interface FormValues {
  displayName: string;
  email: string;
  password: string;
}

// Mirrors the backend's RegisterRequest validation rules.
function validate(values: FormValues): Record<string, string> {
  const errors: Record<string, string> = {};
  if (!values.displayName.trim()) errors.displayName = 'Display name is required';
  else if (values.displayName.length > 100)
    errors.displayName = 'Display name must be at most 100 characters';
  if (!values.email.trim()) errors.email = 'Email is required';
  else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(values.email.trim()))
    errors.email = 'Email must be valid';
  if (!values.password) errors.password = 'Password is required';
  else if (values.password.length < 8 || values.password.length > 72)
    errors.password = 'Password must be between 8 and 72 characters';
  return errors;
}

export default function RegisterPage() {
  const auth = useAuth();
  const navigate = useNavigate();

  const [values, setValues] = useState<FormValues>({ displayName: '', email: '', password: '' });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const setField = (field: keyof FormValues, value: string) => {
    setValues((prev) => ({ ...prev, [field]: value }));
    setErrors((prev) => ({ ...prev, [field]: '' }));
  };

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setSubmitError(null);
    const validationErrors = validate(values);
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }
    setSubmitting(true);
    try {
      const response = await register({
        displayName: values.displayName.trim(),
        email: values.email.trim(),
        password: values.password,
      });
      auth.login(response);
      navigate('/', { replace: true });
    } catch (err) {
      const apiError = extractApiError(err);
      if (apiError?.fieldErrors) {
        setErrors(apiError.fieldErrors);
      } else {
        setSubmitError(apiError?.message ?? 'Registration failed. Is the backend running?');
      }
    } finally {
      setSubmitting(false);
    }
  };

  const handleGoogleCredential = async (idToken: string) => {
    setSubmitError(null);
    try {
      const response = await loginWithGoogle(idToken);
      auth.login(response);
      navigate('/', { replace: true });
    } catch (err) {
      setSubmitError(
        extractApiError(err)?.message ?? 'Google sign-in failed. Is the backend running?',
      );
    }
  };

  const inputClass = (field: string) =>
    `w-full rounded-md border px-3 py-2 text-sm shadow-sm transition focus:outline-none focus:ring-2 dark:bg-gray-800 ${
      errors[field]
        ? 'border-red-300 focus:ring-red-200 dark:border-red-700'
        : 'border-gray-300 focus:border-indigo-500 focus:ring-indigo-200 dark:border-gray-700 dark:focus:ring-indigo-900'
    }`;

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
          <h1 className="text-2xl font-semibold tracking-tight">Create your account</h1>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            Start tracking your expenses in minutes
          </p>
        </div>

        <form
          onSubmit={handleSubmit}
          className="space-y-4 rounded-2xl border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-800 dark:bg-gray-900"
          noValidate
        >
          <div>
            <label htmlFor="displayName" className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
              Display name
            </label>
            <input
              id="displayName"
              type="text"
              autoComplete="name"
              value={values.displayName}
              onChange={(event) => setField('displayName', event.target.value)}
              className={inputClass('displayName')}
              placeholder="Abishek"
            />
            {errors.displayName && (
              <p className="mt-1 text-xs text-red-600">{errors.displayName}</p>
            )}
          </div>

          <div>
            <label htmlFor="email" className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
              Email
            </label>
            <input
              id="email"
              type="email"
              autoComplete="email"
              value={values.email}
              onChange={(event) => setField('email', event.target.value)}
              className={inputClass('email')}
              placeholder="you@example.com"
            />
            {errors.email && <p className="mt-1 text-xs text-red-600">{errors.email}</p>}
          </div>

          <div>
            <label htmlFor="password" className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
              Password
            </label>
            <input
              id="password"
              type="password"
              autoComplete="new-password"
              value={values.password}
              onChange={(event) => setField('password', event.target.value)}
              className={inputClass('password')}
              placeholder="At least 8 characters"
            />
            {errors.password && <p className="mt-1 text-xs text-red-600">{errors.password}</p>}
          </div>

          {submitError && (
            <p className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-700 dark:bg-red-950/60 dark:text-red-300">{submitError}</p>
          )}

          <button
            type="submit"
            disabled={submitting}
            className="w-full rounded-md bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 disabled:opacity-60"
          >
            {submitting ? 'Creating account…' : 'Create account'}
          </button>

          <GoogleSignInButton
            onCredential={handleGoogleCredential}
            onError={(message) => setSubmitError(message)}
          />

          <p className="text-center text-sm text-gray-500 dark:text-gray-400">
            Already have an account?{' '}
            <Link to="/login" className="font-medium text-indigo-600 hover:text-indigo-800 dark:text-indigo-400">
              Sign in
            </Link>
          </p>
        </form>
      </motion.div>
    </div>
  );
}
