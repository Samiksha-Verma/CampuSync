import { cn } from '../../lib/cn';

const VARIANTS = {
  neutral: 'bg-slate-100 text-slate-600',
  forest: 'bg-forest-50 text-forest-700',
  brass: 'bg-brass-100 text-brass-800',
  success: 'bg-success-bg text-success',
  warning: 'bg-warning-bg text-warning',
  danger: 'bg-danger-bg text-danger',
  info: 'bg-info-bg text-info',
};

export const Badge = ({ variant = 'neutral', className, children }) => (
  <span
    className={cn(
      'inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-medium tracking-wide',
      VARIANTS[variant],
      className
    )}
  >
    {children}
  </span>
);
