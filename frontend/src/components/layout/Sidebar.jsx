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

export const Sidebar = () => {
  const { role, user, logout } = useAuth();
  const nav = NAV_BY_ROLE[role] || [];
  const profilePath = `/${role}/profile`;
  const settingsPath = `/${role}/settings`;

  return (
    <aside className="flex h-screen w-64 shrink-0 flex-col bg-ink-800 text-ink-100">
      <div className="px-6 py-6">
        <Logo markSize={32} textClassName="text-lg text-white" />
      </div>

      <nav className="flex-1 overflow-y-auto px-3 py-2">
        <ul className="flex flex-col gap-0.5">
          {nav.map(({ to, label, icon: Icon, end }) => (
            <li key={to}>
              <NavLink
                to={to}
                end={end}
                className={({ isActive }) =>
                  cn(
                    'flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors',
                    isActive ? 'bg-white/10 text-white' : 'text-ink-200 hover:bg-white/5 hover:text-white'
                  )
                }
              >
                <Icon size={17} strokeWidth={1.9} />
                {label}
              </NavLink>
            </li>
          ))}
        </ul>

        {role === 'student' ? (
          <>
            <p className="mt-6 mb-1 px-3 text-xs font-medium uppercase tracking-wider text-ink-400">You</p>
            <ul className="flex flex-col gap-0.5">
              <li>
                <NavLink
                  to={profilePath}
                  className={({ isActive }) =>
                    cn(
                      'flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors',
                      isActive ? 'bg-white/10 text-white' : 'text-ink-200 hover:bg-white/5 hover:text-white'
                    )
                  }
                >
                  <User size={17} strokeWidth={1.9} />
                  Profile
                </NavLink>
              </li>
              <li>
                <NavLink
                  to={settingsPath}
                  className={({ isActive }) =>
                    cn(
                      'flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors',
                      isActive ? 'bg-white/10 text-white' : 'text-ink-200 hover:bg-white/5 hover:text-white'
                    )
                  }
                >
                  <Settings size={17} strokeWidth={1.9} />
                  Settings
                </NavLink>
              </li>
            </ul>
          </>
        ) : (
          <ul className="mt-6 flex flex-col gap-0.5">
            <li>
              <NavLink
                to={profilePath}
                className={({ isActive }) =>
                  cn(
                    'flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors',
                    isActive ? 'bg-white/10 text-white' : 'text-ink-200 hover:bg-white/5 hover:text-white'
                  )
                }
              >
                <User size={17} strokeWidth={1.9} />
                Profile
              </NavLink>
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
            className="shrink-0 rounded-lg p-1.5 text-ink-300 transition-colors hover:bg-white/10 hover:text-white"
          >
            <LogOut size={16} />
          </button>
        </div>
      </div>
    </aside>
  );
};
