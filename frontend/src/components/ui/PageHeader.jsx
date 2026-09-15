export const PageHeader = ({ title, subtitle, action }) => (
  <div className="mb-7 flex items-start justify-between gap-4">
    <div>
      <h1 className="font-display text-2xl font-semibold text-ink-800">{title}</h1>
      {subtitle ? <p className="mt-1.5 text-sm text-slate-500">{subtitle}</p> : null}
    </div>
    {action}
  </div>
);
