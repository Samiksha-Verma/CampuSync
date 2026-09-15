import { cn } from '../../lib/cn';

const tone = (score) => {
  if (score >= 75) return { bar: 'bg-success', text: 'text-success' };
  if (score >= 50) return { bar: 'bg-warning', text: 'text-warning' };
  return { bar: 'bg-danger', text: 'text-danger' };
};

export const ScoreBar = ({ label, score }) => {
  const t = tone(score);
  return (
    <div>
      <div className="mb-1.5 flex items-baseline justify-between">
        <span className="text-sm font-medium text-ink-700">{label}</span>
        <span className={cn('font-mono text-sm font-semibold tabular-nums', t.text)}>{Math.round(score)}</span>
      </div>
      <div className="h-2 w-full overflow-hidden rounded-full bg-slate-100">
        <div className={cn('h-full rounded-full transition-all', t.bar)} style={{ width: `${Math.min(100, Math.max(0, score))}%` }} />
      </div>
    </div>
  );
};
