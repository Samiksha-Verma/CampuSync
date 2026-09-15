import { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Award, ExternalLink } from 'lucide-react';
import { listCertifications } from '../../api/certifications';
import { PageHeader } from '../../components/ui/PageHeader';
import { SearchInput } from '../../components/ui/SearchInput';
import { FilterChips } from '../../components/ui/FilterChips';
import { Card } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import { EmptyState } from '../../components/ui/EmptyState';
import { ListSkeleton } from '../../components/ui/Skeleton';
import { deadlineMeta } from '../../lib/deadline';

export default function Certifications() {
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('all');

  const { data: certifications = [], isLoading } = useQuery({
    queryKey: ['certifications', 'all'],
    queryFn: () => listCertifications({ includeExpired: true }),
  });

  const categoryOptions = useMemo(() => {
    const unique = [...new Set(certifications.map((c) => c.category).filter(Boolean))];
    return [{ value: 'all', label: 'All' }, ...unique.map((c) => ({ value: c, label: c }))];
  }, [certifications]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return certifications
      .filter((c) => (category === 'all' ? true : c.category === category))
      .filter((c) =>
        q ? c.courseName.toLowerCase().includes(q) || c.platform.toLowerCase().includes(q) : true
      )
      .sort((a, b) => new Date(a.deadline) - new Date(b.deadline));
  }, [certifications, search, category]);

  return (
    <div>
      <PageHeader
        title="Certification Hub"
        subtitle="Curated courses and certifications worth adding to your profile, picked by Faculty and Admin."
      />

      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <FilterChips options={categoryOptions} value={category} onChange={setCategory} />
        <SearchInput value={search} onChange={setSearch} placeholder="Search course or platform…" className="sm:w-72" />
      </div>

      {isLoading ? (
        <ListSkeleton count={4} />
      ) : filtered.length === 0 ? (
        <EmptyState
          icon={Award}
          title={search ? 'No certifications match your search' : 'No certifications listed yet'}
          description="Recommended courses from Faculty and Admin will appear here as they're added."
        />
      ) : (
        <div className="grid gap-4 lg:grid-cols-2">
          {filtered.map((cert) => {
            const dl = deadlineMeta(cert.deadline);
            return (
              <Card key={cert._id} className="flex flex-col">
                <div className="mb-3 flex items-start justify-between gap-3">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-forest-50 text-forest-700">
                    <Award size={18} strokeWidth={1.9} />
                  </div>
                  <div className="flex items-center gap-2">
                    {cert.category ? <Badge variant="neutral">{cert.category}</Badge> : null}
                    <Badge variant={dl.variant}>{dl.label}</Badge>
                  </div>
                </div>
                <h3 className="font-display text-lg font-semibold leading-snug text-ink-800">{cert.courseName}</h3>
                <p className="mt-0.5 text-sm font-medium text-forest-700">
                  {cert.platform}
                  {cert.companyName ? ` · ${cert.companyName}` : ''}
                </p>
                {cert.description ? (
                  <p className="mt-2.5 line-clamp-2 text-sm text-slate-500">{cert.description}</p>
                ) : null}
                <div className="mt-5 border-t border-slate-100 pt-4">
                  <a href={cert.externalLink} target="_blank" rel="noreferrer">
                    <Button size="sm" variant={dl.expired ? 'secondary' : 'primary'} disabled={dl.expired} className="w-full">
                      {dl.expired ? 'Enrollment closed' : 'View & enroll'}
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
