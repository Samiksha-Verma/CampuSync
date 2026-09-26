import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { CalendarDays, Briefcase, Award, ListChecks, UserPlus } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { listEvents } from '../../api/events';
import { listOpportunities } from '../../api/opportunities';
import { listCertifications } from '../../api/certifications';
import { getFacultyRequests } from '../../api/auth';
import { Card } from '../../components/ui/Card';
import { deadlineMeta } from '../../lib/deadline';

export default function AdminDashboard() {
  const { user } = useAuth();

  const { data: events = [] } = useQuery({ queryKey: ['events', 'all'], queryFn: () => listEvents(true) });
  const { data: opportunities = [] } = useQuery({ queryKey: ['opportunities', 'all'], queryFn: () => listOpportunities({ includeExpired: true }) });
  const { data: certifications = [] } = useQuery({ queryKey: ['certifications', 'all'], queryFn: () => listCertifications({ includeExpired: true }) });
  const { data: pendingFaculty = [] } = useQuery({ queryKey: ['faculty-requests', 'pending'], queryFn: () => getFacultyRequests('pending') });

  const openCount = (list) => list.filter((item) => !deadlineMeta(item.deadline).expired).length;

  const stats = [
    { label: 'Open events', value: openCount(events), total: events.length, icon: CalendarDays, to: '/admin/events' },
    { label: 'Open openings', value: openCount(opportunities), total: opportunities.length, icon: Briefcase, to: '/admin/opportunities' },
    { label: 'Certifications', value: openCount(certifications), total: certifications.length, icon: Award, to: '/admin/certifications' },
  ];

  return (
    <div>
      <h1 className="font-display text-2xl font-semibold text-ink-800">Welcome, {user?.name}.</h1>
      <p className="mt-1.5 text-sm text-slate-500">An overview of everything posted across campus.</p>

      <div className="mt-6 grid gap-3 sm:mt-7 sm:grid-cols-2 sm:gap-4 lg:grid-cols-3">
        {stats.map(({ label, value, total, icon: Icon, to }) => (
          <Link key={label} to={to}>
            <Card className="transition-all hover:-translate-y-0.5 hover:shadow-md">
              <div className="flex h-9 w-9 items-center justify-center rounded-full bg-forest-50 text-forest-700">
                <Icon size={16} strokeWidth={1.9} />
              </div>
              <p className="mt-3 font-mono text-2xl font-semibold tabular-nums text-ink-800">{value}</p>
              <p className="mt-0.5 text-sm text-slate-500">{label} <span className="text-slate-400">· {total} total</span></p>
            </Card>
          </Link>
        ))}
      </div>

      <div className="mt-6 grid gap-4 sm:grid-cols-2">
        <Card>
          <div className="flex items-center gap-4">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-brass-50 text-brass-700">
              <ListChecks size={20} strokeWidth={1.9} />
            </div>
            <div className="flex-1">
              <h3 className="font-display text-base font-semibold text-ink-800">Mock Test Bank</h3>
              <p className="mt-0.5 text-sm text-slate-500">Add practice questions for students.</p>
            </div>
            <Link to="/admin/mocktest" className="shrink-0 py-2 text-sm font-medium text-forest-700 hover:text-forest-800">
              Add →
            </Link>
          </div>
        </Card>
        <Card>
          <div className="flex items-center gap-4">
            <div className="relative flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-forest-50 text-forest-700">
              <UserPlus size={20} strokeWidth={1.9} />
              {pendingFaculty.length > 0 ? (
                <span className="absolute -right-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-brass-500 px-1 font-mono text-[10px] font-semibold text-ink-900">
                  {pendingFaculty.length}
                </span>
              ) : null}
            </div>
            <div className="flex-1">
              <h3 className="font-display text-base font-semibold text-ink-800">Faculty Accounts</h3>
              <p className="mt-0.5 text-sm text-slate-500">
                {pendingFaculty.length > 0
                  ? `${pendingFaculty.length} application${pendingFaculty.length === 1 ? '' : 's'} awaiting review.`
                  : 'No pending applications right now.'}
              </p>
            </div>
            <Link to="/admin/faculty" className="shrink-0 py-2 text-sm font-medium text-forest-700 hover:text-forest-800">
              Review →
            </Link>
          </div>
        </Card>
      </div>
    </div>
  );
}
