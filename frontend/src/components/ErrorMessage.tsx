import { errorMessage } from '../api/client';

interface ErrorMessageProps {
  error: unknown;
  onRetry?: () => void;
}

export default function ErrorMessage({ error, onRetry }: ErrorMessageProps) {
  return (
    <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-6 text-center dark:border-red-900 dark:bg-red-950/50">
      <p className="text-sm font-medium text-red-800 dark:text-red-300">{errorMessage(error)}</p>
      {onRetry && (
        <button
          type="button"
          onClick={onRetry}
          className="mt-3 rounded-md bg-red-600 px-3 py-1.5 text-sm font-medium text-white transition hover:bg-red-700"
        >
          Try again
        </button>
      )}
    </div>
  );
}
