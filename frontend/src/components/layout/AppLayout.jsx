import { Outlet } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import { NotificationBell } from './NotificationBell';
import { useAuth } from '../../context/AuthContext';

export const AppLayout = () => {
  const { role } = useAuth();

  return (
    <div className="flex h-screen overflow-hidden bg-parchment">
      <Sidebar />
      <div className="flex min-w-0 flex-1 flex-col">
        <header className="flex h-16 shrink-0 items-center justify-end border-b border-slate-200 bg-white/80 px-6 backdrop-blur-sm">
          {role === 'student' ? <NotificationBell /> : null}
        </header>
        <main className="flex-1 overflow-y-auto px-8 py-8">
          <div className="mx-auto max-w-6xl">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
};
