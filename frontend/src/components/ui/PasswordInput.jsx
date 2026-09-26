import { useState } from 'react';
import { Eye, EyeOff } from 'lucide-react';
import { cn } from '../../lib/cn';

// Same visual language as Input, plus a show/hide toggle - password fields are the
// one input type where mistyping is invisible until a failed submit, so this is
// worth the extra affordance everywhere a password is entered or set.
export const PasswordInput = ({ className, error, ...props }) => {
  const [visible, setVisible] = useState(false);

  return (
    <div className="relative w-full">
      <input
        type={visible ? 'text' : 'password'}
        className={cn(
          'w-full rounded-lg border bg-white px-3.5 py-2.5 pr-12 text-base text-ink-800 placeholder:text-slate-400 sm:text-sm',
          'transition-colors focus:outline-none focus:ring-2 focus:ring-forest-500/30 focus:border-forest-500',
          error ? 'border-danger' : 'border-slate-200',
          className
        )}
        {...props}
      />
      <button
        type="button"
        onClick={() => setVisible((v) => !v)}
        className="absolute right-0 top-1/2 flex h-11 w-11 -translate-y-1/2 items-center justify-center text-slate-400 transition-colors hover:text-ink-600"
        aria-label={visible ? 'Hide password' : 'Show password'}
      >
        {visible ? <EyeOff size={16} /> : <Eye size={16} />}
      </button>
    </div>
  );
};
