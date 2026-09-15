import { cn } from '../../lib/cn';

const VARIANTS = {
  primary: 'bg-forest-700 text-white hover:bg-forest-800 active:bg-forest-900 shadow-sm',
  secondary: 'bg-white text-ink-800 border border-slate-200 hover:border-slate-300 hover:bg-slate-50',
  brass: 'bg-brass-500 text-ink-900 hover:bg-brass-600 shadow-sm',
  ghost: 'text-ink-700 hover:bg-slate-100',
  danger: 'bg-white text-danger border border-danger/30 hover:bg-danger-bg',
};

const SIZES = {
  sm: 'px-3 py-1.5 text-sm rounded-lg gap-1.5',
  md: 'px-4 py-2.5 text-sm rounded-lg gap-2',
  lg: 'px-5 py-3 text-base rounded-xl gap-2',
};

export const Button = ({
  variant = 'primary',
  size = 'md',
  className,
  disabled,
  loading,
  children,
  type = 'button',
  ...props
}) => (
  <button
    type={type}
    disabled={disabled || loading}
    className={cn(
      'inline-flex items-center justify-center font-medium transition-all duration-150 cursor-pointer',
      'disabled:cursor-not-allowed disabled:opacity-50',
      VARIANTS[variant],
      SIZES[size],
      className
    )}
    {...props}
  >
    {loading ? (
      <span className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
    ) : null}
    {children}
  </button>
);
