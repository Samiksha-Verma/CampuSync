import { Award, Clock } from 'lucide-react';
import { format } from 'date-fns';
import { Card } from './ui/Card';
import { Badge } from './ui/Badge';
import { cn } from '../lib/cn';
import { deadlineMeta } from '../lib/deadline';
import { truncateWords } from '../lib/truncateWords';

const DEADLINE_TEXT = {
  danger: 'text-danger',
  warning: 'text-warning',
  info: 'text-ink-800',
  neutral: 'text-slate-400',
};

// Shared between the student Certification Hub and Admin/Faculty's
// ManageCertifications - `footer` differs (Go to Course vs Edit/Delete).
export const CertificationCard = ({ certification, footer }) => {
  const dl = deadlineMeta(certification.deadline);

  return (
    <Card className="flex h-full w-full min-w-0 flex-col overflow-hidden p-0 transition-all hover:-translate-y-0.5 hover:shadow-md">
      <div className="relative h-32 w-full shrink-0 bg-gradient-to-br from-forest-600 via-forest-500 to-brass-500">
        {certification.bannerImageUrl ? (
          <img src={certification.bannerImageUrl} alt="" className="h-full w-full object-cover" />
        ) : (
          <div className="flex h-full items-center justify-center">
            <Award size={32} className="text-white/80" strokeWidth={1.5} />
          </div>
        )}
        {certification.category ? (
          <Badge variant="neutral" className="absolute left-3 top-3 bg-white/90 shadow-sm">
            {certification.category}
          </Badge>
        ) : null}
      </div>

      <div className="flex flex-1 flex-col p-4">
        <p className="truncate text-xs text-slate-500">
          {certification.platform}
          {certification.companyName ? ` • ${certification.companyName}` : ''}
        </p>
        <h3
          title={certification.courseName}
          className="mt-1 line-clamp-2 font-display text-base font-semibold leading-snug text-ink-800"
        >
          {certification.courseName}
        </h3>
        <p className="mt-2 line-clamp-3 text-xs leading-relaxed text-slate-500">
          {truncateWords(certification.description, 18)}
        </p>

        <div className="mb-4 mt-3 flex items-end justify-between gap-2">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-400">Deadline</p>
            <p className={cn('mt-0.5 flex items-center gap-1.5 text-sm font-semibold', DEADLINE_TEXT[dl.variant])}>
              <Clock size={13} className="shrink-0" />
              {format(new Date(certification.deadline), 'MMM d, yyyy')}
            </p>
          </div>
          <Badge variant={dl.variant} className="shrink-0">{dl.label}</Badge>
        </div>

        {footer ? <div className="mt-auto flex gap-2 border-t border-slate-100 pt-4">{footer}</div> : null}
      </div>
    </Card>
  );
};
