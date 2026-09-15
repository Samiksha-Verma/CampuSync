import { CheckCircle2, AlertCircle, XCircle, Radio, X } from 'lucide-react';
import { useToast } from '../../context/ToastContext';

const ICONS = {
  default: CheckCircle2,
  success: CheckCircle2,
  error: XCircle,
  warning: AlertCircle,
  live: Radio,
};

const ACCENTS = {
  default: 'text-forest-600',
  success: 'text-success',
  error: 'text-danger',
  warning: 'text-warning',
  live: 'text-brass-600',
};

export const ToastViewport = () => {
  const { toasts, dismiss } = useToast();

  if (!toasts.length) return null;

  return (
    <div className="fixed right-4 top-4 z-[100] flex w-full max-w-sm flex-col gap-2.5">
      {toasts.map((t) => {
        const Icon = ICONS[t.variant] || ICONS.default;
        return (
          <div
            key={t.id}
            className="animate-toast-in flex items-start gap-3 rounded-xl border border-slate-200 bg-white p-4 shadow-lg"
          >
            <Icon size={18} className={`mt-0.5 shrink-0 ${ACCENTS[t.variant] || ACCENTS.default}`} />
            <p className="flex-1 text-sm text-ink-800">{t.message}</p>
            <button
              onClick={() => dismiss(t.id)}
              className="shrink-0 text-slate-400 transition-colors hover:text-ink-600"
              aria-label="Dismiss"
            >
              <X size={16} />
            </button>
          </div>
        );
      })}
    </div>
  );
};
