import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { CalendarDays, Briefcase, Award, ListChecks } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { listEvents } from '../../api/events';
import { listOpportunities } from '../../api/opportunities';
import { listCertifications } from '../../api/certifications';
import { Card } from '../../components/ui/Card';
import { deadlineMeta } from '../../lib/deadline';

export default function FacultyDashboard() {
  const { user } = useAuth();

  const { data: events = [] } = useQuery({ queryKey: ['events', 'all'], queryFn: () => listEvents(true) });
  const { data: opportunities = [] } = useQuery({ queryKey: ['opportunities', 'all'], queryFn: () => listOpportunities({ includeExpired: true }) });
  const { data: certifications = [] } = useQuery({ queryKey: ['certifications', 'all'], queryFn: () => listCertifications({ includeExpired: true }) });

  const mine = (list) => list.filter((item) => item.createdBy === user.id);
  const openCount = (list) => mine(list).filter((item) => !deadlineMeta(item.deadline).expired).length;

  const stats = [
    { label: 'Your open events', value: openCount(events), total: mine(events).length, icon: CalendarDays, to: '/faculty/events' },
    { label: 'Your open openings', value: openCount(opportunities), total: mine(opportunities).length, icon: Briefcase, to: '/faculty/opportunities' },
    { label: 'Your certifications', value: openCount(certifications), total: mine(certifications).length, icon: Award, to: '/faculty/certifications' },
  ];

  return (
    <div>
      <h1 className="font-display text-2xl font-semibold text-ink-800">Welcome, {user?.name}.</h1>
      <p className="mt-1.5 text-sm text-slate-500">A look at what you've posted, and what's coming due.</p>

      <div className="mt-7 grid gap-4 sm:grid-cols-3">
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

      <Card className="mt-6">
        <div className="flex items-center gap-4">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-brass-50 text-brass-700">
            <ListChecks size={20} strokeWidth={1.9} />
          </div>
          <div className="flex-1">
            <h3 className="font-display text-base font-semibold text-ink-800">Mock Test Bank</h3>
            <p className="mt-0.5 text-sm text-slate-500">Add practice questions for students' aptitude, coding, and reasoning tests.</p>
          </div>
          <Link to="/faculty/mocktest" className="shrink-0 text-sm font-medium text-forest-700 hover:text-forest-800">
            Add questions →
          </Link>
        </div>
      </Card>
    </div>
  );
}
