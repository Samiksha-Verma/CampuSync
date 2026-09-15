import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { CalendarDays, Briefcase, Award, Bell, ArrowRight } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { listEvents } from '../../api/events';
import { listOpportunities } from '../../api/opportunities';
import { listCertifications } from '../../api/certifications';
import { getMyNotifications } from '../../api/notifications';
import { Card } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import { EmptyState } from '../../components/ui/EmptyState';
import { ListSkeleton } from '../../components/ui/Skeleton';
import { deadlineMeta } from '../../lib/deadline';
import { cn } from '../../lib/cn';

const TABS = [
  { value: 'events', label: 'Events', icon: CalendarDays },
  { value: 'opportunities', label: 'Internships & Jobs', icon: Briefcase },
  { value: 'certifications', label: 'Certifications', icon: Award },
];

export default function StudentDashboard() {
  const { user } = useAuth();
  const [tab, setTab] = useState('events');

  const { data: events = [], isLoading: eventsLoading } = useQuery({ queryKey: ['events', 'all'], queryFn: () => listEvents(true) });
  const { data: opportunities = [], isLoading: oppsLoading } = useQuery({
    queryKey: ['opportunities', 'all'],
    queryFn: () => listOpportunities({ includeExpired: true }),
  });
  const { data: certifications = [], isLoading: certsLoading } = useQuery({
    queryKey: ['certifications', 'all'],
    queryFn: () => listCertifications({ includeExpired: true }),
  });
  const { data: notifications = [] } = useQuery({ queryKey: ['notifications'], queryFn: getMyNotifications });

  const openEvents = useMemo(() => events.filter((e) => !deadlineMeta(e.deadline).expired), [events]);
  const openOpps = useMemo(() => opportunities.filter((o) => !deadlineMeta(o.deadline).expired), [opportunities]);
  const openCerts = useMemo(() => certifications.filter((c) => !deadlineMeta(c.deadline).expired), [certifications]);
  const unreadCount = notifications.filter((n) => !n.isRead).length;

  const stats = [
    { label: 'Open events', value: openEvents.length, icon: CalendarDays, to: '/student/events' },
    { label: 'Open internships & jobs', value: openOpps.length, icon: Briefcase, to: '/student/opportunities' },
    { label: 'Certifications available', value: openCerts.length, icon: Award, to: '/student/certifications' },
    { label: 'Unread notifications', value: unreadCount, icon: Bell, to: '/student/notifications' },
  ];

  const isLoading = eventsLoading || oppsLoading || certsLoading;

  return (
    <div>
      <h1 className="font-display text-2xl font-semibold text-ink-800">
        Welcome back, {user?.name?.split(' ')[0] || user?.collegeId}.
      </h1>
      <p className="mt-1.5 text-sm text-slate-500">Here's what's new since you last checked in.</p>

      <div className="mt-7 grid grid-cols-2 gap-4 lg:grid-cols-4">
        {stats.map(({ label, value, icon: Icon, to }) => (
          <Link key={label} to={to}>
            <Card className="transition-all hover:-translate-y-0.5 hover:shadow-md">
              <div className="flex items-start justify-between">
                <div className="flex h-9 w-9 items-center justify-center rounded-full bg-forest-50 text-forest-700">
                  <Icon size={16} strokeWidth={1.9} />
                </div>
              </div>
              <p className="mt-3 font-mono text-2xl font-semibold tabular-nums text-ink-800">{value}</p>
              <p className="mt-0.5 text-sm text-slate-500">{label}</p>
            </Card>
          </Link>
        ))}
      </div>

      <div className="mt-9">
        <div className="mb-5 flex items-center justify-between">
          <div className="flex gap-1.5 rounded-lg bg-slate-100 p-1">
            {TABS.map((t) => (
              <button
                key={t.value}
                onClick={() => setTab(t.value)}
                className={cn(
                  'flex items-center gap-1.5 rounded-md px-3.5 py-1.5 text-sm font-medium transition-colors',
                  tab === t.value ? 'bg-white text-ink-800 shadow-sm' : 'text-slate-500 hover:text-ink-700'
                )}
              >
                <t.icon size={14} /> {t.label}
              </button>
            ))}
          </div>
          <Link
            to={`/student/${tab}`}
            className="flex items-center gap-1 text-sm font-medium text-forest-700 hover:text-forest-800"
          >
            View all <ArrowRight size={14} />
          </Link>
        </div>

        {isLoading ? (
          <ListSkeleton count={3} />
        ) : (
          <DashboardTabContent tab={tab} events={openEvents} opportunities={openOpps} certifications={openCerts} />
        )}
      </div>
    </div>
  );
}

function DashboardTabContent({ tab, events, opportunities, certifications }) {
  if (tab === 'events') {
    if (events.length === 0) {
      return <EmptyState icon={CalendarDays} title="No open events" description="Nothing's on the calendar right now — check back soon." />;
    }
    return (
      <div className="flex flex-col gap-3">
        {events.slice(0, 5).map((e) => {
          const dl = deadlineMeta(e.deadline);
          return (
            <Card key={e._id} className="flex items-center justify-between gap-4 p-4">
              <div className="min-w-0">
                <p className="truncate text-sm font-medium text-ink-800">{e.name}</p>
                <p className="mt-0.5 text-xs text-slate-500">{e.organizingClub}</p>
              </div>
              <Badge variant={dl.variant}>{dl.label}</Badge>
            </Card>
          );
        })}
      </div>
    );
  }

  if (tab === 'opportunities') {
    if (opportunities.length === 0) {
      return <EmptyState icon={Briefcase} title="No open openings" description="New internships and jobs will show up here as they're posted." />;
    }
    return (
      <div className="flex flex-col gap-3">
        {opportunities.slice(0, 5).map((o) => {
          const dl = deadlineMeta(o.deadline);
          return (
            <Card key={o._id} className="flex items-center justify-between gap-4 p-4">
              <div className="min-w-0">
                <p className="truncate text-sm font-medium text-ink-800">{o.role}</p>
                <p className="mt-0.5 text-xs text-slate-500">{o.companyName}</p>
              </div>
              <div className="flex items-center gap-2">
                <Badge variant={o.type === 'internship' ? 'brass' : 'forest'}>{o.type}</Badge>
                <Badge variant={dl.variant}>{dl.label}</Badge>
              </div>
            </Card>
          );
        })}
      </div>
    );
  }

  if (certifications.length === 0) {
    return <EmptyState icon={Award} title="No certifications listed" description="Recommended courses from Faculty and Admin will appear here." />;
  }
  return (
    <div className="flex flex-col gap-3">
      {certifications.slice(0, 5).map((c) => {
        const dl = deadlineMeta(c.deadline);
        return (
          <Card key={c._id} className="flex items-center justify-between gap-4 p-4">
            <div className="min-w-0">
              <p className="truncate text-sm font-medium text-ink-800">{c.courseName}</p>
              <p className="mt-0.5 text-xs text-slate-500">{c.platform}</p>
            </div>
            <Badge variant={dl.variant}>{dl.label}</Badge>
          </Card>
        );
      })}
    </div>
  );
}
