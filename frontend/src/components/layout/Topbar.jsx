import { Bell, Menu, Moon, Search, Sun } from 'lucide-react';
import Input from '../ui/Input';
import Switch from '../ui/Switch';
import { useTheme } from '../../hooks/useTheme';
import { useAuth } from '../../hooks/useAuth';
import ProfileMenu from './ProfileMenu';

export default function Topbar({ onMenuClick, searchQuery = '', onSearchChange, showSearch = false }) {
  const { theme, toggleTheme } = useTheme();
  const { user, logout } = useAuth();

  return (
    <header className="sticky top-2 z-40 rounded-[26px] border border-[var(--line-soft)] bg-[color-mix(in_oklab,var(--surface-card)_88%,transparent)] p-4 shadow-[0_10px_36px_rgba(15,23,42,0.14)] backdrop-blur-xl lg:top-4">
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div className="flex items-center gap-3">
          <button
            type="button"
            className="rounded-xl border border-[var(--line-soft)] bg-[var(--surface-card)] p-2 text-[var(--text-secondary)] lg:hidden"
            onClick={onMenuClick}
            aria-label="Open sidebar"
          >
            <Menu className="h-4 w-4" />
          </button>
          <div>
            <p className="text-[11px] uppercase tracking-[0.24em] text-[var(--text-muted)]">Enterprise Feedback Platform</p>
            <h2 className="text-xl font-semibold tracking-tight text-[var(--text-primary)]">Welcome back, {user?.name || 'User'}</h2>
          </div>
        </div>

        <div className="flex flex-1 flex-wrap items-center justify-end gap-2">
          <div className={`order-last w-full md:order-none md:max-w-md ${showSearch ? 'block' : 'hidden'}`}>
            <label className="sr-only" htmlFor="dashboard-search">
              Search
            </label>
            <div className="relative">
              <Search className="pointer-events-none absolute left-3 top-3.5 h-4 w-4 text-[var(--text-muted)]" />
              <Input
                id="dashboard-search"
                placeholder="Search courses, forms, students..."
                value={searchQuery}
                onChange={(event) => onSearchChange?.(event.target.value)}
                className="pl-10"
              />
            </div>
          </div>
          <div className="flex items-center gap-2 rounded-2xl border border-[var(--line-soft)] bg-[var(--surface-card)] px-3 py-2">
            {theme === 'dark' ? <Moon className="h-4 w-4 text-[var(--brand-300)]" /> : <Sun className="h-4 w-4 text-amber-500" />}
            <Switch checked={theme === 'dark'} onChange={toggleTheme} />
          </div>
          <button
            type="button"
            className="relative rounded-xl border border-[var(--line-soft)] bg-[var(--surface-card)] p-2 text-[var(--text-secondary)] transition hover:scale-105 hover:shadow-lg"
            aria-label="Notifications"
          >
            <Bell className="h-4 w-4" />
            <span className="absolute -right-1 -top-1 h-2 w-2 rounded-full bg-[var(--danger-500)]" />
          </button>
          <ProfileMenu name={user?.name} role={user?.role} onLogout={logout} />
        </div>
      </div>
    </header>
  );
}
