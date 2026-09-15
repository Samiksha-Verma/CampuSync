import { cn } from '../../lib/cn';

export const Field = ({ label, error, hint, children, htmlFor }) => (
  <div className="flex flex-col gap-1.5">
    {label ? (
      <label htmlFor={htmlFor} className="text-sm font-medium text-ink-700">
        {label}
      </label>
    ) : null}
    {children}
    {error ? (
      <p className="text-sm text-danger">{error}</p>
    ) : hint ? (
      <p className="text-sm text-slate-500">{hint}</p>
    ) : null}
  </div>
);

export const Input = ({ className, error, ...props }) => (
  <input
    className={cn(
      'rounded-lg border bg-white px-3.5 py-2.5 text-sm text-ink-800 placeholder:text-slate-400',
      'transition-colors focus:outline-none focus:ring-2 focus:ring-forest-500/30 focus:border-forest-500',
      error ? 'border-danger' : 'border-slate-200',
      className
    )}
    {...props}
  />
);

export const Textarea = ({ className, error, ...props }) => (
  <textarea
    className={cn(
      'rounded-lg border bg-white px-3.5 py-2.5 text-sm text-ink-800 placeholder:text-slate-400',
      'transition-colors focus:outline-none focus:ring-2 focus:ring-forest-500/30 focus:border-forest-500',
      error ? 'border-danger' : 'border-slate-200',
      className
    )}
    {...props}
  />
);

export const Select = ({ className, error, children, ...props }) => (
  <select
    className={cn(
      'rounded-lg border bg-white px-3.5 py-2.5 text-sm text-ink-800',
      'transition-colors focus:outline-none focus:ring-2 focus:ring-forest-500/30 focus:border-forest-500',
      error ? 'border-danger' : 'border-slate-200',
      className
    )}
    {...props}
  >
    {children}
  </select>
);
