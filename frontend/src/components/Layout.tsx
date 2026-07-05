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

// Sidebar is an icon rail from md, expanding with labels from xl.
const sideLinkClass = ({ isActive }: { isActive: boolean }) =>
  `flex items-center justify-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors xl:justify-start ${
    isActive
      ? 'bg-emerald-600/10 text-emerald-700 dark:bg-emerald-400/10 dark:text-emerald-400'
      : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-slate-100'
  }`;

const mobileLinkClass = ({ isActive }: { isActive: boolean }) =>
  `flex flex-1 flex-col items-center gap-1 rounded-md px-2 py-1.5 text-xs font-medium transition-colors ${
    isActive
      ? 'text-emerald-700 dark:text-emerald-400'
      : 'text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-100'
  }`;

export default function Layout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login', { replace: true });
  };

  return (
    <div className="min-h-screen">
      {/* Sidebar: icon rail from md, full width with labels from xl */}
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-16 flex-col border-r border-slate-200 bg-white px-2 py-5 md:flex xl:w-60 xl:px-4 dark:border-slate-800 dark:bg-slate-900">
        <div className="mb-8 flex items-center justify-center gap-2.5 xl:justify-start xl:px-2">
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-emerald-600 text-white">
            <WalletIcon />
          </span>
          <div className="hidden min-w-0 xl:block">
            <h1 className="truncate text-sm font-semibold tracking-tight">Expense Tracker</h1>
            <p className="truncate text-xs text-slate-400 dark:text-slate-500">Personal finance</p>
          </div>
        </div>

        <nav className="flex flex-1 flex-col gap-1">
          {NAV_ITEMS.map(({ to, label, icon: Icon, end }) => (
            <NavLink key={to} to={to} end={end} className={sideLinkClass} title={label}>
              <Icon className="shrink-0" />
              <span className="hidden xl:inline">{label}</span>
            </NavLink>
          ))}
        </nav>

        <div className="border-t border-slate-200 pt-3 dark:border-slate-800">
          <div className="hidden xl:block xl:px-2">
            <p className="truncate text-sm font-medium">{user?.displayName}</p>
            <p className="truncate text-xs text-slate-400 dark:text-slate-500">{user?.email}</p>
          </div>
          <div className="mt-2 flex flex-col items-center gap-1 xl:flex-row xl:justify-between xl:px-2">
            <ThemeToggle />
            <button
              type="button"
              onClick={handleLogout}
              aria-label="Log out"
              title="Log out"
              className="rounded-md p-2 text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-slate-100"
            >
              <LogOutIcon />
            </button>
          </div>
        </div>
      </aside>

      {/* Mobile top bar */}
      <header className="sticky top-0 z-40 flex items-center justify-between border-b border-slate-200 bg-white/95 px-4 py-3 backdrop-blur md:hidden dark:border-slate-800 dark:bg-slate-900/95">
        <div className="flex items-center gap-2">
          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-600 text-white">
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
            className="rounded-md p-2 text-slate-500 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800"
          >
            <LogOutIcon />
          </button>
        </div>
      </header>

      <main className="min-w-0 px-4 pb-24 pt-6 sm:px-6 md:ml-16 md:pb-10 lg:px-8 xl:ml-60">
        <div className="mx-auto max-w-6xl">
          <Outlet />
        </div>
      </main>

      {/* Mobile bottom nav */}
      <nav className="fixed inset-x-0 bottom-0 z-40 flex gap-1 border-t border-slate-200 bg-white/95 px-2 py-1.5 backdrop-blur md:hidden dark:border-slate-800 dark:bg-slate-900/95">
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
