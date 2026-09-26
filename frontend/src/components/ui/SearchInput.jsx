import { Search } from 'lucide-react';

export const SearchInput = ({ value, onChange, placeholder = 'Search…', className = '' }) => (
  <div className={`relative ${className}`}>
    <Search size={16} className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
    <input
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      className="w-full rounded-lg border border-slate-200 bg-white py-2.5 pl-10 pr-3.5 text-base text-ink-800 sm:text-sm placeholder:text-slate-400 transition-colors focus:border-forest-500 focus:outline-none focus:ring-2 focus:ring-forest-500/30"
    />
  </div>
);
