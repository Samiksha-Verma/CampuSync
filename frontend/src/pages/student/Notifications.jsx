import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Bell, CalendarDays, Briefcase, Award, Sparkles } from 'lucide-react';
import { format, isToday, isYesterday } from 'date-fns';
import { getMyNotifications, markNotificationRead } from '../../api/notifications';
import { PageHeader } from '../../components/ui/PageHeader';
import { FilterChips } from '../../components/ui/FilterChips';
import { Card } from '../../components/ui/Card';
import { EmptyState } from '../../components/ui/EmptyState';
import { ListSkeleton } from '../../components/ui/Skeleton';
import { cn } from '../../lib/cn';

const ICONS = { event: CalendarDays, opportunity: Briefcase, certification: Award };
const iconFor = (type) => ICONS[Object.keys(ICONS).find((k) => type.startsWith(k))] || Sparkles;

const dayLabel = (date) => {
  if (isToday(date)) return 'Today';
  if (isYesterday(date)) return 'Yesterday';
  return format(date, 'MMMM d, yyyy');
};

const FILTERS = [
  { value: 'all', label: 'All' },
  { value: 'unread', label: 'Unread' },
];

export default function Notifications() {
  const [filter, setFilter] = useState('all');
  const queryClient = useQueryClient();

  const { data: notifications = [], isLoading } = useQuery({
    queryKey: ['notifications'],
    queryFn: getMyNotifications,
  });

  const markRead = useMutation({
    mutationFn: markNotificationRead,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['notifications'] }),
  });

  const filtered = filter === 'unread' ? notifications.filter((n) => !n.isRead) : notifications;

  const groups = filtered.reduce((acc, n) => {
    const label = dayLabel(new Date(n.createdAt));
    (acc[label] ||= []).push(n);
    return acc;
  }, {});

  return (
    <div className="mx-auto max-w-2xl">
      <PageHeader title="Notifications" subtitle="Everything posted by Faculty and Admin, in one place." />

      <div className="mb-6">
        <FilterChips options={FILTERS} value={filter} onChange={setFilter} />
      </div>

      {isLoading ? (
        <ListSkeleton count={4} />
      ) : filtered.length === 0 ? (
        <EmptyState
          icon={Bell}
          title={filter === 'unread' ? "You're all caught up" : 'No notifications yet'}
          description="New events, postings, and updates from Faculty and Admin will show up here the moment they're posted."
        />
      ) : (
        <div className="flex flex-col gap-6">
          {Object.entries(groups).map(([label, items]) => (
            <div key={label}>
              <p className="mb-2.5 text-xs font-medium uppercase tracking-wider text-slate-400">{label}</p>
              <Card className="divide-y divide-slate-100 p-0">
                {items.map((n) => {
                  const Icon = iconFor(n.type);
                  return (
                    <button
                      key={n._id}
                      onClick={() => !n.isRead && markRead.mutate(n._id)}
                      className={cn(
                        'flex w-full items-start gap-3 px-4 py-3.5 text-left transition-colors hover:bg-slate-50',
                        !n.isRead && 'bg-forest-50/40'
                      )}
                    >
                      <div
                        className={cn(
                          'mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-full',
                          !n.isRead ? 'bg-forest-100 text-forest-700' : 'bg-slate-100 text-slate-400'
                        )}
                      >
                        <Icon size={15} />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className={cn('text-sm leading-snug', !n.isRead ? 'font-medium text-ink-800' : 'text-slate-500')}>
                          {n.message}
                        </p>
                        <p className="mt-0.5 text-xs text-slate-400">{format(new Date(n.createdAt), 'h:mm a')}</p>
                      </div>
                      {!n.isRead ? <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-brass-500" /> : null}
                    </button>
                  );
                })}
              </Card>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
