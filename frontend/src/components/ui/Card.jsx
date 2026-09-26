import { cn } from '../../lib/cn';

// Default padding is tighter on phones; skipped entirely when the caller sets its own
// (cn() doesn't resolve conflicting utilities, so both would otherwise be applied).
const hasOwnPadding = (className) => /(^|\s)p-\d/.test(className || '');

export const Card = ({ className, children, ...props }) => (
  <div
    className={cn(
      'rounded-2xl border border-slate-200 bg-white shadow-[0_1px_2px_rgba(22,36,29,0.04)]',
      !hasOwnPadding(className) && 'p-4 sm:p-6',
      className
    )}
    {...props}
  >
    {children}
  </div>
);

export const CardHeader = ({ title, subtitle, action, className }) => (
  <div className={cn('mb-5 flex items-start justify-between gap-4', className)}>
    <div>
      <h3 className="font-display text-lg font-semibold text-ink-800">{title}</h3>
      {subtitle ? <p className="mt-0.5 text-sm text-slate-500">{subtitle}</p> : null}
    </div>
    {action}
  </div>
);
