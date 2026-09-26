import { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Award, ArrowRight } from 'lucide-react';
import { listCertifications } from '../../api/certifications';
import { PageHeader } from '../../components/ui/PageHeader';
import { SearchInput } from '../../components/ui/SearchInput';
import { FilterDropdown, DropdownOption } from '../../components/ui/FilterDropdown';
import { Button } from '../../components/ui/Button';
import { EmptyState } from '../../components/ui/EmptyState';
import { ListSkeleton } from '../../components/ui/Skeleton';
import { CertificationCard } from '../../components/CertificationCard';
import { deadlineMeta } from '../../lib/deadline';

const SORT_OPTIONS = [
  { value: 'deadline', label: 'Deadline: soonest' },
  { value: 'newest', label: 'Newest posted' },
  { value: 'provider', label: 'Provider: A–Z' },
];

// Certifications with no provider sort after the ones that have one.
const providerKey = (c) => (c.companyName || '').toLowerCase() || '￿';

const SORTERS = {
  deadline: (a, b) => new Date(a.deadline) - new Date(b.deadline),
  newest: (a, b) => new Date(b.createdAt) - new Date(a.createdAt),
  provider: (a, b) => providerKey(a).localeCompare(providerKey(b)) || a.courseName.localeCompare(b.courseName),
};

export default function Certifications() {
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('all');
  const [platform, setPlatform] = useState('all');
  const [sortBy, setSortBy] = useState('deadline');

  const { data: certifications = [], isLoading } = useQuery({
    queryKey: ['certifications', 'all'],
    queryFn: () => listCertifications({ includeExpired: true }),
  });

  const categories = useMemo(
    () => [...new Set(certifications.map((c) => c.category).filter(Boolean))].sort(),
    [certifications]
  );
  const platforms = useMemo(
    () => [...new Set(certifications.map((c) => c.platform).filter(Boolean))].sort(),
    [certifications]
  );

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return certifications
      .filter((c) => (category === 'all' ? true : c.category === category))
      .filter((c) => (platform === 'all' ? true : c.platform === platform))
      .filter((c) =>
        q
          ? c.courseName.toLowerCase().includes(q) ||
            c.platform.toLowerCase().includes(q) ||
            c.companyName?.toLowerCase().includes(q) ||
            c.category?.toLowerCase().includes(q)
          : true
      )
      .sort(SORTERS[sortBy]);
  }, [certifications, search, category, platform, sortBy]);

  const filtering = Boolean(search) || category !== 'all' || platform !== 'all';

  return (
    <div>
      <PageHeader
        title="Certification Hub"
        subtitle="Curated courses and certifications worth adding to your profile, picked by Faculty and Admin."
      />

      <div className="mb-5 flex flex-col gap-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-[0_1px_2px_rgba(22,36,29,0.04)] sm:flex-row sm:items-center">
        <SearchInput
          value={search}
          onChange={setSearch}
          placeholder="Search by course, platform, or provider…"
          className="sm:flex-1"
        />
        <div className="flex flex-wrap gap-2">
          <FilterDropdown label={category === 'all' ? 'Category' : category} active={category !== 'all'}>
            {({ close }) => (
              <div className="flex max-h-64 flex-col gap-0.5 overflow-y-auto">
                <DropdownOption active={category === 'all'} onClick={() => { setCategory('all'); close(); }}>
                  All categories
                </DropdownOption>
                {categories.map((c) => (
                  <DropdownOption key={c} active={category === c} onClick={() => { setCategory(c); close(); }}>
                    {c}
                  </DropdownOption>
                ))}
              </div>
            )}
          </FilterDropdown>

          <FilterDropdown label={platform === 'all' ? 'Platform' : platform} active={platform !== 'all'}>
            {({ close }) => (
              <div className="flex max-h-64 flex-col gap-0.5 overflow-y-auto">
                <DropdownOption active={platform === 'all'} onClick={() => { setPlatform('all'); close(); }}>
                  All platforms
                </DropdownOption>
                {platforms.map((p) => (
                  <DropdownOption key={p} active={platform === p} onClick={() => { setPlatform(p); close(); }}>
                    {p}
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

      {isLoading ? (
        <ListSkeleton count={4} />
      ) : filtered.length === 0 ? (
        <EmptyState
          icon={Award}
          title={filtering ? 'No certifications match your filters' : 'No certifications listed yet'}
          description="Recommended courses from Faculty and Admin will appear here as they're added."
        />
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((cert) => {
            const dl = deadlineMeta(cert.deadline);
            return (
              <CertificationCard
                key={cert._id}
                certification={cert}
                footer={
                  <a href={cert.externalLink} target="_blank" rel="noreferrer" className="w-full">
                    <Button size="sm" variant={dl.expired ? 'secondary' : 'primary'} disabled={dl.expired} className="w-full">
                      {dl.expired ? 'Enrollment closed' : 'Go to Course'}
                      {!dl.expired && <ArrowRight size={14} />}
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
