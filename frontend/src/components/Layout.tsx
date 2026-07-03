import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useAuth } from '../hooks/useAuth';
import { HomeIcon, ListIcon, LogOutIcon, RepeatIcon, TargetIcon, WalletIcon } from './Icons';
import ThemeToggle from './ThemeToggle';

const NAV_ITEMS = [
  { to: '/', label: 'Dashboard', icon: HomeIcon, end: true },
  { to: '/expenses', label: 'Expenses', icon: ListIcon, end: false },
  { to: '/budgets', label: 'Budgets', icon: TargetIcon, end: false },
  { to: '/recurring', label: 'Recurring', icon: RepeatIcon, end: false },
];

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
      <aside className="glass fixed inset-y-0 left-0 z-30 hidden w-60 flex-col rounded-none border-y-0 border-l-0 px-4 py-6 lg:flex">
        <div className="mb-8 flex items-center gap-2.5 px-2">
          <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-500 to-violet-600 text-white shadow-md shadow-indigo-500/30">
            <WalletIcon />
          </span>
          <div>
            <h1 className="text-sm font-semibold tracking-tight">Expense Tracker</h1>
            <p className="text-xs text-gray-400 dark:text-gray-500">Personal finance</p>
          </div>
        </div>

        <nav className="flex flex-1 flex-col gap-1">
          {NAV_ITEMS.map(({ to, label, icon: Icon, end }) => (
            <NavLink
              key={to}
              to={to}
              end={end}
              className="relative flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors"
            >
              {({ isActive }) => (
                <>
                  {isActive && (
                    <motion.span
                      layoutId="nav-active"
                      transition={{ type: 'spring', stiffness: 500, damping: 38 }}
                      className="absolute inset-0 rounded-lg bg-gradient-to-r from-indigo-600 to-violet-600 shadow-sm shadow-indigo-600/30"
                    />
                  )}
                  <span
                    className={`relative z-10 flex items-center gap-3 ${
                      isActive
                        ? 'text-white'
                        : 'text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-100'
                    }`}
                  >
                    <Icon />
                    {label}
                  </span>
                </>
              )}
            </NavLink>
          ))}
        </nav>

        <div className="border-t border-gray-200 pt-4 dark:border-white/10">
          <div className="flex items-center justify-between gap-2 px-2">
            <div className="flex min-w-0 items-center gap-2.5">
              <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-indigo-100 text-sm font-semibold text-indigo-700 dark:bg-indigo-500/20 dark:text-indigo-300">
                {user?.displayName?.charAt(0).toUpperCase() ?? '?'}
              </span>
              <div className="min-w-0">
                <p className="truncate text-sm font-medium">{user?.displayName}</p>
                <p className="truncate text-xs text-gray-400 dark:text-gray-500">{user?.email}</p>
              </div>
            </div>
          </div>
          <div className="mt-3 flex items-center justify-between px-2">
            <ThemeToggle />
            <button
              type="button"
              onClick={handleLogout}
              className="inline-flex items-center gap-1.5 rounded-md px-2 py-1.5 text-xs font-medium text-gray-500 transition-colors hover:bg-gray-100 hover:text-gray-900 dark:text-gray-400 dark:hover:bg-white/5 dark:hover:text-gray-100"
            >
              <LogOutIcon width={15} height={15} />
              Log out
            </button>
          </div>
        </div>
      </aside>

      {/* Mobile top bar */}
      <header className="glass sticky top-0 z-40 flex items-center justify-between rounded-none border-x-0 border-t-0 px-4 py-3 lg:hidden">
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
            className="rounded-md p-2 text-gray-500 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-white/5"
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
      <nav className="glass fixed inset-x-0 bottom-0 z-40 flex gap-1 rounded-none border-x-0 border-b-0 px-2 py-2 lg:hidden">
        {NAV_ITEMS.map(({ to, label, icon: Icon, end }) => (
          <NavLink
            key={to}
            to={to}
            end={end}
            className="relative flex flex-1 flex-col items-center gap-1 rounded-lg px-2 py-1.5 text-xs font-medium transition-colors"
          >
            {({ isActive }) => (
              <>
                {isActive && (
                  <motion.span
                    layoutId="mobile-nav-active"
                    transition={{ type: 'spring', stiffness: 500, damping: 38 }}
                    className="absolute inset-0 rounded-lg bg-indigo-50 dark:bg-indigo-500/15"
                  />
                )}
                <span
                  className={`relative z-10 flex flex-col items-center gap-1 ${
                    isActive
                      ? 'text-indigo-600 dark:text-indigo-400'
                      : 'text-gray-500 dark:text-gray-400'
                  }`}
                >
                  <Icon width={20} height={20} />
                  {label}
                </span>
              </>
            )}
          </NavLink>
        ))}
      </nav>
    </div>
  );
}
