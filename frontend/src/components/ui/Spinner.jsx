export const Spinner = ({ size = 20, className = '' }) => (
  <div
    className={`animate-spin rounded-full border-2 border-slate-200 border-t-forest-600 ${className}`}
    style={{ width: size, height: size }}
  />
);

export const PageSpinner = () => (
  <div className="flex h-full min-h-[40vh] items-center justify-center">
    <Spinner size={28} />
  </div>
);
