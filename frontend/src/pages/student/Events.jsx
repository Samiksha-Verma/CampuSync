import { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { CalendarDays, ExternalLink } from 'lucide-react';
import { listEvents } from '../../api/events';
import { PageHeader } from '../../components/ui/PageHeader';
import { SearchInput } from '../../components/ui/SearchInput';
import { FilterChips } from '../../components/ui/FilterChips';
import { Button } from '../../components/ui/Button';
import { EmptyState } from '../../components/ui/EmptyState';
import { ListSkeleton } from '../../components/ui/Skeleton';
import { EventCard } from '../../components/EventCard';
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
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((event) => {
            const dl = deadlineMeta(event.deadline);
            return (
              <EventCard
                key={event._id}
                event={event}
                footer={
                  <a href={event.registrationLink} target="_blank" rel="noreferrer" className="w-full">
                    <Button size="sm" variant={dl.expired ? 'secondary' : 'primary'} disabled={dl.expired} className="w-full">
                      {dl.expired ? 'Registration closed' : 'Register'}
                      {!dl.expired && <ExternalLink size={14} />}
                    </Button>
                  </a>
                }
              />
            );
          })}
        </div>
      )}
    </div>
  );
}
