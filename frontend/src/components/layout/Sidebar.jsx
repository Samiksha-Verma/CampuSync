import { useEffect } from 'react';
import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  CalendarDays,
  Briefcase,
  Award,
  FolderLock,
  Sparkles,
  ListChecks,
  User,
  Settings,
  UserPlus,
  LogOut,
  X,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { cn } from '../../lib/cn';
import { Logo } from '../ui/Logo';

const STUDENT_NAV = [
  { to: '/student', label: 'Dashboard', icon: LayoutDashboard, end: true },
  { to: '/student/events', label: 'Events', icon: CalendarDays },
  { to: '/student/opportunities', label: 'Internships & Jobs', icon: Briefcase },
  { to: '/student/certifications', label: 'Certification Hub', icon: Award },
  { to: '/student/vault', label: 'Document Vault', icon: FolderLock },
  { to: '/student/ai', label: 'AI Tools', icon: Sparkles },
  { to: '/student/mocktest', label: 'Mock Test', icon: ListChecks },
];

const FACULTY_NAV = [
  { to: '/faculty', label: 'Dashboard', icon: LayoutDashboard, end: true },
  { to: '/faculty/events', label: 'Events', icon: CalendarDays },
  { to: '/faculty/opportunities', label: 'Internships & Jobs', icon: Briefcase },
  { to: '/faculty/certifications', label: 'Certifications', icon: Award },
  { to: '/faculty/mocktest', label: 'Mock Test Bank', icon: ListChecks },
];

const ADMIN_NAV = [
  { to: '/admin', label: 'Dashboard', icon: LayoutDashboard, end: true },
  { to: '/admin/events', label: 'Events', icon: CalendarDays },
  { to: '/admin/opportunities', label: 'Internships & Jobs', icon: Briefcase },
  { to: '/admin/certifications', label: 'Certifications', icon: Award },
  { to: '/admin/mocktest', label: 'Mock Test Bank', icon: ListChecks },
  { to: '/admin/faculty', label: 'Faculty Accounts', icon: UserPlus },
];

const NAV_BY_ROLE = { student: STUDENT_NAV, faculty: FACULTY_NAV, admin: ADMIN_NAV };

const NavItem = ({ to, end, icon: Icon, onNavigate, children }) => (
  <NavLink
    to={to}
    end={end}
    onClick={onNavigate}
    className={({ isActive }) =>
      cn(
        'flex items-center gap-3 rounded-lg px-3 py-3 text-sm font-medium transition-colors lg:py-2.5',
        isActive ? 'bg-white/10 text-white' : 'text-ink-200 hover:bg-white/5 hover:text-white'
      )
    }
  >
    <Icon size={17} strokeWidth={1.9} />
    {children}
  </NavLink>
);

// Static column on desktop (lg+); an off-canvas drawer below that, opened from the
// header's hamburger. Picking a link or the backdrop closes it.
export const Sidebar = ({ open = false, onClose = () => {} }) => {
  const { role, user, logout } = useAuth();
  const nav = NAV_BY_ROLE[role] || [];

  useEffect(() => {
    if (!open) return;
    const onKey = (e) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  return (
    <>
      <div
        aria-hidden="true"
        onClick={onClose}
        className={cn(
          'fixed inset-0 z-40 bg-ink-900/50 backdrop-blur-[2px] transition-opacity lg:hidden',
          open ? 'opacity-100' : 'pointer-events-none opacity-0'
        )}
      />
      <aside
        id="app-sidebar"
        className={cn(
          'fixed inset-y-0 left-0 z-50 flex h-dvh w-72 max-w-[85vw] flex-col bg-ink-800 text-ink-100 transition-[transform,visibility] duration-200',
          'lg:static lg:z-auto lg:w-64 lg:max-w-none lg:shrink-0 lg:translate-x-0 lg:visible',
          open ? 'translate-x-0 visible' : '-translate-x-full invisible'
        )}
      >
        <div className="flex items-center justify-between px-6 py-6">
          <Logo markSize={32} textClassName="text-lg text-white" />
          <button
            type="button"
            onClick={onClose}
            aria-label="Close menu"
            className="-mr-2 flex h-10 w-10 items-center justify-center rounded-lg text-ink-300 transition-colors hover:bg-white/10 hover:text-white lg:hidden"
          >
            <X size={20} />
          </button>
        </div>

        <nav className="flex-1 overflow-y-auto px-3 py-2">
          <ul className="flex flex-col gap-0.5">
            {nav.map(({ to, label, icon, end }) => (
              <li key={to}>
                <NavItem to={to} end={end} icon={icon} onNavigate={onClose}>
                  {label}
                </NavItem>
              </li>
            ))}
          </ul>

          {role === 'student' ? (
            <>
              <p className="mb-1 mt-6 px-3 text-xs font-medium uppercase tracking-wider text-ink-400">You</p>
              <ul className="flex flex-col gap-0.5">
                <li>
                  <NavItem to="/student/profile" icon={User} onNavigate={onClose}>
                    Profile
                  </NavItem>
                </li>
                <li>
                  <NavItem to="/student/settings" icon={Settings} onNavigate={onClose}>
                    Settings
                  </NavItem>
                </li>
              </ul>
            </>
          ) : (
            <ul className="mt-6 flex flex-col gap-0.5">
              <li>
                <NavItem to={`/${role}/profile`} icon={User} onNavigate={onClose}>
                  Profile
                </NavItem>
              </li>
            </ul>
          )}
        </nav>

        <div className="border-t border-white/10 px-3 py-4">
          <div className="flex items-center gap-3 rounded-lg px-3 py-2">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-forest-600 text-xs font-semibold text-white">
              {(user?.name || user?.collegeId || '?').slice(0, 1).toUpperCase()}
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium text-white">{user?.name || user?.collegeId}</p>
              <p className="truncate text-xs capitalize text-ink-300">{role}</p>
            </div>
            <button
              onClick={logout}
              title="Sign out"
              aria-label="Sign out"
              className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg text-ink-300 transition-colors hover:bg-white/10 hover:text-white lg:h-8 lg:w-8"
            >
              <LogOut size={16} />
            </button>
          </div>
        </div>
      </aside>
    </>
  );
};
