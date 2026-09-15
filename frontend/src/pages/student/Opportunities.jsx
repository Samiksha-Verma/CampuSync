import { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Briefcase, Wallet, ExternalLink } from 'lucide-react';
import { listOpportunities } from '../../api/opportunities';
import { PageHeader } from '../../components/ui/PageHeader';
import { SearchInput } from '../../components/ui/SearchInput';
import { FilterChips } from '../../components/ui/FilterChips';
import { Card } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import { EmptyState } from '../../components/ui/EmptyState';
import { ListSkeleton } from '../../components/ui/Skeleton';
import { deadlineMeta } from '../../lib/deadline';

const TYPE_FILTERS = [
  { value: 'all', label: 'All' },
  { value: 'internship', label: 'Internships' },
  { value: 'job', label: 'Jobs' },
];

export default function Opportunities() {
  const [search, setSearch] = useState('');
  const [type, setType] = useState('all');
  const [openOnly, setOpenOnly] = useState(true);

  const { data: opportunities = [], isLoading } = useQuery({
    queryKey: ['opportunities', 'all'],
    queryFn: () => listOpportunities({ includeExpired: true }),
  });

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return opportunities
      .filter((o) => (type === 'all' ? true : o.type === type))
      .filter((o) => (openOnly ? !deadlineMeta(o.deadline).expired : true))
      .filter((o) =>
        q
          ? o.companyName.toLowerCase().includes(q) ||
            o.role.toLowerCase().includes(q) ||
            o.skillsRequired?.some((s) => s.toLowerCase().includes(q))
          : true
      )
      .sort((a, b) => new Date(a.deadline) - new Date(b.deadline));
  }, [opportunities, search, type, openOnly]);

  return (
    <div>
      <PageHeader
        title="Internships & Jobs"
        subtitle="Openings shared by Faculty and Admin, matched to what's happening on campus right now."
      />

      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-wrap items-center gap-2">
          <FilterChips options={TYPE_FILTERS} value={type} onChange={setType} />
          <button
            onClick={() => setOpenOnly((v) => !v)}
            className={`rounded-full border px-3.5 py-1.5 text-sm font-medium transition-colors ${
              openOnly
                ? 'border-brass-500 bg-brass-50 text-brass-800'
                : 'border-slate-200 bg-white text-slate-500 hover:border-slate-300'
            }`}
          >
            Open only
          </button>
        </div>
        <SearchInput value={search} onChange={setSearch} placeholder="Search role, company, or skill…" className="sm:w-72" />
      </div>

      {isLoading ? (
        <ListSkeleton count={4} />
      ) : filtered.length === 0 ? (
        <EmptyState
          icon={Briefcase}
          title={search ? 'No openings match your search' : 'No openings right now'}
          description="New internships and jobs from Faculty and Admin land here the moment they're posted — check back soon."
        />
      ) : (
        <div className="grid gap-4 lg:grid-cols-2">
          {filtered.map((opp) => {
            const dl = deadlineMeta(opp.deadline);
            return (
              <Card key={opp._id} className="flex flex-col">
                <div className="mb-3 flex items-start justify-between gap-3">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-forest-50 text-forest-700">
                    <Briefcase size={18} strokeWidth={1.9} />
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant={opp.type === 'internship' ? 'brass' : 'forest'}>{opp.type}</Badge>
                    <Badge variant={dl.variant}>{dl.label}</Badge>
                  </div>
                </div>
                <h3 className="font-display text-lg font-semibold leading-snug text-ink-800">{opp.role}</h3>
                <p className="mt-0.5 text-sm font-medium text-forest-700">{opp.companyName}</p>
                {opp.description ? (
                  <p className="mt-2.5 line-clamp-2 text-sm text-slate-500">{opp.description}</p>
                ) : null}
                {opp.skillsRequired?.length ? (
                  <div className="mt-3 flex flex-wrap gap-1.5">
                    {opp.skillsRequired.map((s) => (
                      <span key={s} className="rounded-md bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-600">
                        {s}
                      </span>
                    ))}
                  </div>
                ) : null}
                {opp.stipendOrSalary ? (
                  <p className="mt-3 flex items-center gap-1.5 text-sm text-ink-700">
                    <Wallet size={14} className="text-slate-400" /> {opp.stipendOrSalary}
                  </p>
                ) : null}
                <div className="mt-5 border-t border-slate-100 pt-4">
                  <a href={opp.applicationLink} target="_blank" rel="noreferrer">
                    <Button size="sm" variant={dl.expired ? 'secondary' : 'primary'} disabled={dl.expired} className="w-full">
                      {dl.expired ? 'Applications closed' : 'Apply now'}
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
