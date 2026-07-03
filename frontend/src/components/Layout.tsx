import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { HomeIcon, ListIcon, LogOutIcon, RepeatIcon, TargetIcon, WalletIcon } from './Icons';
import ThemeToggle from './ThemeToggle';

const NAV_ITEMS = [
  { to: '/', label: 'Dashboard', icon: HomeIcon, end: true },
  { to: '/expenses', label: 'Expenses', icon: ListIcon, end: false },
  { to: '/budgets', label: 'Budgets', icon: TargetIcon, end: false },
  { to: '/recurring', label: 'Recurring', icon: RepeatIcon, end: false },
];

const linkClass = ({ isActive }: { isActive: boolean }) =>
  `flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
    isActive
      ? 'bg-indigo-600 text-white shadow-sm'
      : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900 dark:text-gray-400 dark:hover:bg-gray-800 dark:hover:text-gray-100'
  }`;

const mobileLinkClass = ({ isActive }: { isActive: boolean }) =>
  `flex flex-1 flex-col items-center gap-1 rounded-lg px-2 py-1.5 text-xs font-medium transition-colors ${
    isActive
      ? 'text-indigo-600 dark:text-indigo-400'
      : 'text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-100'
  }`;

export default function Layout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login', { replace: true });
  };

  return (
    <div className="min-h-screen lg:flex">
      {/* Desktop sidebar */}
      <aside className="fixed inset-y-0 left-0 hidden w-60 flex-col border-r border-gray-200 bg-white px-4 py-6 lg:flex dark:border-gray-800 dark:bg-gray-900">
        <div className="mb-8 flex items-center gap-2.5 px-2">
          <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-500 to-violet-600 text-white shadow-md">
            <WalletIcon />
          </span>
          <div>
            <h1 className="text-sm font-semibold tracking-tight">Expense Tracker</h1>
            <p className="text-xs text-gray-400 dark:text-gray-500">Personal finance</p>
          </div>
        </div>

        <nav className="flex flex-1 flex-col gap-1">
          {NAV_ITEMS.map(({ to, label, icon: Icon, end }) => (
            <NavLink key={to} to={to} end={end} className={linkClass}>
              <Icon />
              {label}
            </NavLink>
          ))}
        </nav>

        <div className="border-t border-gray-200 pt-4 dark:border-gray-800">
          <div className="flex items-center justify-between gap-2 px-2">
            <div className="min-w-0">
              <p className="truncate text-sm font-medium">{user?.displayName}</p>
              <p className="truncate text-xs text-gray-400 dark:text-gray-500">{user?.email}</p>
            </div>
            <div className="flex shrink-0 items-center">
              <ThemeToggle />
              <button
                type="button"
                onClick={handleLogout}
                aria-label="Log out"
                className="rounded-md p-2 text-gray-500 transition-colors hover:bg-gray-100 hover:text-gray-900 dark:text-gray-400 dark:hover:bg-gray-800 dark:hover:text-gray-100"
              >
                <LogOutIcon />
              </button>
            </div>
          </div>
        </div>
      </aside>

      {/* Mobile top bar */}
      <header className="sticky top-0 z-40 flex items-center justify-between border-b border-gray-200 bg-white/90 px-4 py-3 backdrop-blur lg:hidden dark:border-gray-800 dark:bg-gray-900/90">
        <div className="flex items-center gap-2">
          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-indigo-500 to-violet-600 text-white">
            <WalletIcon width={16} height={16} />
          </span>
          <h1 className="text-base font-semibold tracking-tight">Expense Tracker</h1>
        </div>
        <div className="flex items-center gap-1">
          <ThemeToggle />
          <button
            type="button"
            onClick={handleLogout}
            aria-label="Log out"
            className="rounded-md p-2 text-gray-500 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-800"
          >
            <LogOutIcon />
          </button>
        </div>
      </header>

      <main className="min-w-0 flex-1 px-4 pb-24 pt-6 sm:px-6 lg:ml-60 lg:px-10 lg:pb-10 lg:pt-8">
        <div className="mx-auto max-w-5xl">
          <Outlet />
        </div>
      </main>

      {/* Mobile bottom nav */}
      <nav className="fixed inset-x-0 bottom-0 z-40 flex gap-1 border-t border-gray-200 bg-white/95 px-2 py-2 backdrop-blur lg:hidden dark:border-gray-800 dark:bg-gray-900/95">
        {NAV_ITEMS.map(({ to, label, icon: Icon, end }) => (
          <NavLink key={to} to={to} end={end} className={mobileLinkClass}>
            <Icon width={20} height={20} />
            {label}
          </NavLink>
        ))}
      </nav>
    </div>
  );
}
