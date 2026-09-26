import { MapPin, AlarmClock } from 'lucide-react';
import { format } from 'date-fns';
import { Card } from './ui/Card';
import { Badge } from './ui/Badge';
import { CompanyLogo } from './CompanyLogo';
import { cn } from '../lib/cn';
import { deadlineMeta } from '../lib/deadline';

const MAX_VISIBLE_SKILLS = 4;

const DEADLINE_TEXT = {
  danger: 'text-danger',
  warning: 'text-warning',
  info: 'text-ink-800',
  neutral: 'text-slate-400',
};

// Shared between the student Opportunities page and Admin/Faculty's
// ManageOpportunities - `footer` differs (Apply Now vs Edit/Delete). Fixed
// height so every card in the grid stays the same size regardless of how many
// skills or how long the company/role names are.
export const OpportunityCard = ({ opportunity, footer }) => {
  const dl = deadlineMeta(opportunity.deadline);
  const urgent = !dl.expired && dl.variant === 'danger';
  const skills = opportunity.skillsRequired || [];
  const shownSkills = skills.slice(0, MAX_VISIBLE_SKILLS);
  const extraSkills = skills.length - shownSkills.length;

  return (
    <Card className="relative flex h-full w-full min-w-0 flex-col overflow-hidden p-5 transition-all hover:-translate-y-0.5 hover:shadow-md">
      {urgent ? (
        <div className="absolute right-0 top-0 flex items-center gap-1 rounded-bl-xl bg-danger px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wide text-white">
          <AlarmClock size={11} /> {dl.label}
        </div>
      ) : null}

      <div className={cn('flex items-start gap-3', urgent && 'pt-3')}>
        <CompanyLogo name={opportunity.companyName} website={opportunity.companyWebsite} />
        <div className="min-w-0 flex-1">
          <h3 title={opportunity.role} className="line-clamp-2 font-display text-base font-semibold leading-snug text-ink-800">
            {opportunity.role}
          </h3>
          <div className="mt-0.5 flex min-w-0 items-center gap-1.5 text-sm text-slate-500">
            <span className="max-w-[55%] shrink-0 truncate font-medium text-forest-700">
              {opportunity.companyName}
            </span>
            <span className="shrink-0 text-slate-300">•</span>
            <MapPin size={12} className="shrink-0" />
            <span className="min-w-0 truncate">{opportunity.location || 'Remote'}</span>
          </div>
        </div>
      </div>

      {opportunity.roleType ? (
        <div className="mt-3">
          <Badge variant="forest">{opportunity.roleType}</Badge>
        </div>
      ) : null}

      {skills.length ? (
        <div className="mt-3 max-h-[72px] overflow-hidden">
          <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-400">Skills required</p>
          <div className="mt-1.5 flex flex-wrap gap-1.5">
            {shownSkills.map((s) => (
              <span key={s} className="rounded-md bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-600">
                {s}
              </span>
            ))}
            {extraSkills > 0 ? (
              <span className="rounded-md bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-400">
                +{extraSkills}
              </span>
            ) : null}
          </div>
        </div>
      ) : null}

      <div className="mb-3 mt-3 flex items-end justify-between gap-3">
        <div className="min-w-0">
          <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-400">Stipend / Salary</p>
          <p className="mt-0.5 truncate text-sm font-semibold text-ink-800">
            {opportunity.stipendOrSalary || 'Not disclosed'}
          </p>
        </div>
        <div className="shrink-0 text-right">
          <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-400">Deadline</p>
          <p className={cn('mt-0.5 text-sm font-semibold', DEADLINE_TEXT[dl.variant])}>
            {format(new Date(opportunity.deadline), 'MMM d')}
          </p>
        </div>
      </div>

      {footer ? <div className="mt-auto flex gap-2 border-t border-slate-100 pt-3">{footer}</div> : null}
    </Card>
  );
};
