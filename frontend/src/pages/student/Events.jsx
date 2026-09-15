import { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { CalendarDays, MapPin, ExternalLink, User } from 'lucide-react';
import { listEvents } from '../../api/events';
import { PageHeader } from '../../components/ui/PageHeader';
import { SearchInput } from '../../components/ui/SearchInput';
import { FilterChips } from '../../components/ui/FilterChips';
import { Card } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import { EmptyState } from '../../components/ui/EmptyState';
import { ListSkeleton } from '../../components/ui/Skeleton';
import { deadlineMeta } from '../../lib/deadline';

const FILTERS = [
  { value: 'open', label: 'Open' },
  { value: 'all', label: 'All' },
];

export default function Events() {
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('open');

  const { data: events = [], isLoading } = useQuery({
    queryKey: ['events', 'all'],
    queryFn: () => listEvents(true),
  });

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return events
      .filter((e) => (filter === 'open' ? !deadlineMeta(e.deadline).expired : true))
      .filter((e) =>
        q
          ? e.name.toLowerCase().includes(q) ||
            e.organizingClub.toLowerCase().includes(q) ||
            e.description?.toLowerCase().includes(q)
          : true
      )
      .sort((a, b) => new Date(a.deadline) - new Date(b.deadline));
  }, [events, search, filter]);

  return (
    <div>
      <PageHeader
        title="Campus Events"
        subtitle="Workshops, fests, and club activities happening around campus — register before the deadline."
      />

      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <FilterChips options={FILTERS} value={filter} onChange={setFilter} />
        <SearchInput value={search} onChange={setSearch} placeholder="Search events or clubs…" className="sm:w-72" />
      </div>

      {isLoading ? (
        <ListSkeleton count={4} />
      ) : filtered.length === 0 ? (
        <EmptyState
          icon={CalendarDays}
          title={search ? 'No events match your search' : 'No events right now'}
          description={
            search
              ? 'Try a different keyword, or clear the filter to see closed events too.'
              : "Nothing's been posted yet — check back soon, or switch to “All” to see past events."
          }
        />
      ) : (
        <div className="grid gap-4 lg:grid-cols-2">
          {filtered.map((event) => {
            const dl = deadlineMeta(event.deadline);
            return (
              <Card key={event._id} className="flex flex-col">
                <div className="mb-3 flex items-start justify-between gap-3">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-forest-50 text-forest-700">
                    <CalendarDays size={18} strokeWidth={1.9} />
                  </div>
                  <Badge variant={dl.variant}>{dl.label}</Badge>
                </div>
                <h3 className="font-display text-lg font-semibold leading-snug text-ink-800">{event.name}</h3>
                <p className="mt-0.5 text-sm font-medium text-forest-700">{event.organizingClub}</p>
                {event.description ? (
                  <p className="mt-2.5 line-clamp-2 text-sm text-slate-500">{event.description}</p>
                ) : null}
                <div className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-1.5 text-xs text-slate-500">
                  <span className="flex items-center gap-1.5">
                    <User size={13} /> {event.coordinatorName}
                  </span>
                  <span className="flex items-center gap-1.5">
                    <MapPin size={13} /> {event.contactInfo}
                  </span>
                </div>
                <div className="mt-5 border-t border-slate-100 pt-4">
                  <a href={event.registrationLink} target="_blank" rel="noreferrer">
                    <Button size="sm" variant={dl.expired ? 'secondary' : 'primary'} disabled={dl.expired} className="w-full">
                      {dl.expired ? 'Registration closed' : 'Register'}
                      {!dl.expired && <ExternalLink size={14} />}
                    </Button>
                  </a>
                </div>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
