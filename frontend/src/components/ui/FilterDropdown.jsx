import { useEffect, useRef, useState } from 'react';
import { ChevronDown } from 'lucide-react';
import { cn } from '../../lib/cn';

// Generic filter-button-with-popover, shared by the Skills / Role Type / Sort By
// filters - each one just supplies its own panel content via `children`.
export const FilterDropdown = ({ label, active, align = 'left', children }) => {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    const onClickOutside = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener('mousedown', onClickOutside);
    return () => document.removeEventListener('mousedown', onClickOutside);
  }, []);

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className={cn(
          'flex items-center gap-1.5 whitespace-nowrap rounded-lg border px-3.5 py-2 text-sm font-medium transition-colors',
          active
            ? 'border-forest-700 bg-forest-50 text-forest-700'
            : 'border-slate-200 bg-white text-slate-600 hover:border-slate-300'
        )}
      >
        {label}
        <ChevronDown size={14} className={cn('transition-transform', open && 'rotate-180')} />
      </button>

      {open ? (
        <div
          className={cn(
            'absolute top-full z-20 mt-2 min-w-52 rounded-xl border border-slate-200 bg-white p-1.5 shadow-lg',
            align === 'right' ? 'right-0' : 'left-0'
          )}
        >
          {typeof children === 'function' ? children({ close: () => setOpen(false) }) : children}
        </div>
      ) : null}
    </div>
  );
};

export const DropdownOption = ({ active, onClick, children }) => (
  <button
    type="button"
    onClick={onClick}
    className={cn(
      'w-full rounded-lg px-3 py-2 text-left text-sm transition-colors',
      active ? 'bg-forest-50 font-medium text-forest-700' : 'text-slate-600 hover:bg-slate-50'
    )}
  >
    {children}
  </button>
);
