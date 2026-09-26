export const PageHeader = ({ title, subtitle, action }) => (
  <div className="mb-6 flex flex-col gap-4 sm:mb-7 sm:flex-row sm:items-start sm:justify-between">
    <div className="min-w-0">
      <h1 className="font-display text-xl font-semibold text-ink-800 sm:text-2xl">{title}</h1>
      {subtitle ? <p className="mt-1.5 text-sm text-slate-500">{subtitle}</p> : null}
    </div>
    {action ? <div className="shrink-0 max-sm:[&>button]:w-full">{action}</div> : null}
  </div>
);
