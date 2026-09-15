export const EmptyState = ({ icon: Icon, title, description, action }) => (
  <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-slate-200 bg-white/60 px-6 py-16 text-center">
    {Icon ? (
      <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-forest-50 text-forest-600">
        <Icon size={22} strokeWidth={1.75} />
      </div>
    ) : null}
    <h3 className="font-display text-lg font-semibold text-ink-800">{title}</h3>
    {description ? <p className="mt-1.5 max-w-sm text-sm text-slate-500">{description}</p> : null}
    {action ? <div className="mt-5">{action}</div> : null}
  </div>
);
