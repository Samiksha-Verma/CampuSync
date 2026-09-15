import { useEffect, useState } from 'react';
import { Sparkles } from 'lucide-react';

// AI calls can take a while under load or retries (resume analysis especially). A
// bare spinner reads as broken past a few seconds, so this rotates through
// reassuring, stage-specific copy instead - it's decoration, not real progress tracking.
export const AiLoading = ({ messages }) => {
  const [index, setIndex] = useState(0);

  useEffect(() => {
    const id = setInterval(() => setIndex((i) => (i + 1) % messages.length), 2600);
    return () => clearInterval(id);
  }, [messages.length]);

  return (
    <div className="flex flex-col items-center justify-center rounded-2xl border border-slate-200 bg-white px-6 py-16 text-center">
      <div className="relative mb-5 flex h-12 w-12 items-center justify-center rounded-full bg-forest-50 text-forest-600">
        <Sparkles size={20} className="animate-pulse" strokeWidth={1.75} />
      </div>
      <p className="font-display text-base font-medium text-ink-800">{messages[index]}</p>
      <p className="mt-1.5 text-sm text-slate-400">This can take up to a minute — worth the wait.</p>
    </div>
  );
};
