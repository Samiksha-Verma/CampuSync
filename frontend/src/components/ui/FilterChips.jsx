import { cn } from '../../lib/cn';

export const FilterChips = ({ options, value, onChange }) => (
  <div className="flex flex-wrap gap-2">
    {options.map((opt) => (
      <button
        key={opt.value}
        onClick={() => onChange(opt.value)}
        className={cn(
          'rounded-full border px-3.5 py-1.5 text-sm font-medium transition-colors max-md:min-h-10',
          value === opt.value
            ? 'border-forest-700 bg-forest-700 text-white'
            : 'border-slate-200 bg-white text-slate-600 hover:border-slate-300 hover:text-ink-800'
        )}
      >
        {opt.label}
      </button>
    ))}
  </div>
);
