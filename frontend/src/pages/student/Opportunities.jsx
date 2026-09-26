import { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Briefcase, ExternalLink } from 'lucide-react';
import { listOpportunities } from '../../api/opportunities';
import { PageHeader } from '../../components/ui/PageHeader';
import { SearchInput } from '../../components/ui/SearchInput';
import { FilterChips } from '../../components/ui/FilterChips';
import { FilterDropdown, DropdownOption } from '../../components/ui/FilterDropdown';
import { Button } from '../../components/ui/Button';
import { EmptyState } from '../../components/ui/EmptyState';
import { ListSkeleton } from '../../components/ui/Skeleton';
import { OpportunityCard } from '../../components/OpportunityCard';
import { deadlineMeta } from '../../lib/deadline';

const ROLE_TYPES = ['Remote', 'Full-time', 'Internship'];

const SORT_OPTIONS = [
  { value: 'deadline', label: 'Deadline: soonest' },
  { value: 'newest', label: 'Newest posted' },
  { value: 'company', label: 'Company: A–Z' },
];

const SORTERS = {
  deadline: (a, b) => new Date(a.deadline) - new Date(b.deadline),
  newest: (a, b) => new Date(b.createdAt) - new Date(a.createdAt),
  company: (a, b) => a.companyName.localeCompare(b.companyName),
};

export default function Opportunities() {
  const [search, setSearch] = useState('');
  const [roleType, setRoleType] = useState('all');
  const [skills, setSkills] = useState([]);
  const [sortBy, setSortBy] = useState('deadline');

  const { data: opportunities = [], isLoading } = useQuery({
    queryKey: ['opportunities', 'all'],
    queryFn: () => listOpportunities({ includeExpired: true }),
  });

  const allSkills = useMemo(() => {
    const set = new Set();
    opportunities.forEach((o) => (o.skillsRequired || []).forEach((s) => set.add(s)));
    return [...set].sort();
  }, [opportunities]);

  const toggleSkill = (s) => setSkills((prev) => (prev.includes(s) ? prev.filter((x) => x !== s) : [...prev, s]));

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return opportunities
      .filter((o) => (roleType === 'all' ? true : o.roleType === roleType))
      .filter((o) => (skills.length ? skills.some((s) => o.skillsRequired?.includes(s)) : true))
      .filter((o) =>
        q
          ? o.role.toLowerCase().includes(q) ||
            o.companyName.toLowerCase().includes(q) ||
            o.location?.toLowerCase().includes(q) ||
            o.skillsRequired?.some((s) => s.toLowerCase().includes(q))
          : true
      )
      .sort(SORTERS[sortBy]);
  }, [opportunities, search, roleType, skills, sortBy]);

  return (
    <div>
      <PageHeader
        title="Internships & Jobs"
        subtitle="Openings shared by Faculty and Admin, matched to what's happening on campus right now."
      />

      <div className="mb-5 flex flex-col gap-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-[0_1px_2px_rgba(22,36,29,0.04)]">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <SearchInput
            value={search}
            onChange={setSearch}
            placeholder="Search by role, company, or keywords…"
            className="sm:flex-1"
          />
          <div className="flex flex-wrap gap-2">
            <FilterDropdown label={skills.length ? `Skills (${skills.length})` : 'Skills'} active={skills.length > 0}>
              {() => (
                <div className="flex max-h-64 flex-col gap-0.5 overflow-y-auto">
                  {allSkills.length === 0 ? (
                    <p className="px-3 py-2 text-sm text-slate-400">No skills listed yet</p>
                  ) : (
                    allSkills.map((s) => (
                      <label
                        key={s}
                        className="flex cursor-pointer items-center gap-2 rounded-lg px-3 py-2 text-sm text-slate-600 hover:bg-slate-50"
                      >
                        <input
                          type="checkbox"
                          checked={skills.includes(s)}
                          onChange={() => toggleSkill(s)}
                          className="h-3.5 w-3.5 rounded border-slate-300 text-forest-600 focus:ring-2 focus:ring-forest-500/30"
                        />
                        {s}
                      </label>
                    ))
                  )}
                  {skills.length > 0 ? (
                    <button
                      type="button"
                      onClick={() => setSkills([])}
                      className="mt-1 border-t border-slate-100 px-3 py-2 text-left text-sm font-medium text-forest-700 hover:bg-slate-50"
                    >
                      Clear skills
                    </button>
                  ) : null}
                </div>
              )}
            </FilterDropdown>

            <FilterDropdown label={roleType === 'all' ? 'Role Type' : roleType} active={roleType !== 'all'}>
              {({ close }) => (
                <div className="flex flex-col gap-0.5">
                  <DropdownOption active={roleType === 'all'} onClick={() => { setRoleType('all'); close(); }}>
                    All role types
                  </DropdownOption>
                  {ROLE_TYPES.map((rt) => (
                    <DropdownOption key={rt} active={roleType === rt} onClick={() => { setRoleType(rt); close(); }}>
                      {rt}
                    </DropdownOption>
                  ))}
                </div>
              )}
            </FilterDropdown>

            <FilterDropdown
              label={SORT_OPTIONS.find((o) => o.value === sortBy).label}
              active={sortBy !== 'deadline'}
              align="right"
            >
              {({ close }) => (
                <div className="flex flex-col gap-0.5">
                  {SORT_OPTIONS.map((o) => (
                    <DropdownOption key={o.value} active={sortBy === o.value} onClick={() => { setSortBy(o.value); close(); }}>
                      {o.label}
                    </DropdownOption>
                  ))}
                </div>
              )}
            </FilterDropdown>
          </div>
        </div>

        <FilterChips
          options={ROLE_TYPES.map((rt) => ({ value: rt, label: rt }))}
          value={roleType}
          onChange={(v) => setRoleType((prev) => (prev === v ? 'all' : v))}
        />
      </div>

      {isLoading ? (
        <ListSkeleton count={4} />
      ) : filtered.length === 0 ? (
        <EmptyState
          icon={Briefcase}
          title={search || roleType !== 'all' || skills.length ? 'No openings match your filters' : 'No openings right now'}
          description="New internships and jobs from Faculty and Admin land here the moment they're posted — check back soon."
        />
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((opp) => {
            const dl = deadlineMeta(opp.deadline);
            return (
              <OpportunityCard
                key={opp._id}
                opportunity={opp}
                footer={
                  <a href={opp.applicationLink} target="_blank" rel="noreferrer" className="w-full">
                    <Button size="sm" variant={dl.expired ? 'secondary' : 'primary'} disabled={dl.expired} className="w-full">
                      {dl.expired ? 'Applications closed' : 'Apply now'}
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
