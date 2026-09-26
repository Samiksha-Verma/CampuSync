import { useState } from 'react';
import { Outlet } from 'react-router-dom';
import { Menu } from 'lucide-react';
import { Sidebar } from './Sidebar';
import { NotificationBell } from './NotificationBell';
import { Logo } from '../ui/Logo';
import { useAuth } from '../../context/AuthContext';

export const AppLayout = () => {
  const { role } = useAuth();
  const [navOpen, setNavOpen] = useState(false);

  return (
    <div className="flex h-dvh overflow-hidden bg-parchment">
      <Sidebar open={navOpen} onClose={() => setNavOpen(false)} />
      <div className="flex min-w-0 flex-1 flex-col">
        <header className="flex h-16 shrink-0 items-center gap-3 border-b border-slate-200 bg-white/80 px-4 backdrop-blur-sm sm:px-6">
          <div className="flex items-center gap-2 lg:hidden">
            <button
              type="button"
              onClick={() => setNavOpen(true)}
              aria-label="Open menu"
              aria-expanded={navOpen}
              aria-controls="app-sidebar"
              className="-ml-2 flex h-11 w-11 items-center justify-center rounded-lg text-ink-700 transition-colors hover:bg-slate-100"
            >
              <Menu size={22} />
            </button>
            <Logo markSize={28} textClassName="text-base text-ink-800" />
          </div>
          <div className="ml-auto">{role === 'student' ? <NotificationBell /> : null}</div>
        </header>
        <main className="flex-1 overflow-y-auto px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
          <div className="mx-auto max-w-6xl">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
};
