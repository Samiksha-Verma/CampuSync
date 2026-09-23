import { CalendarDays, Clock, User, Phone } from 'lucide-react';
import { format } from 'date-fns';
import { Card } from './ui/Card';
import { Badge } from './ui/Badge';
import { deadlineMeta } from '../lib/deadline';

// Word-count truncation (not just CSS line-clamp) so a very long description never
// pushes the fixed-height card taller - a short one and a long one render identically.
const truncateWords = (text, maxWords = 18) => {
  if (!text) return '';
  const words = text.trim().split(/\s+/);
  if (words.length <= maxWords) return text;
  return `${words.slice(0, maxWords).join(' ')}...`;
};

// Shared between the student Events page and Admin/Faculty's ManageEvents so both
// stay visually identical - `footer` is the one thing that differs (a Register
// button for students, Edit/Delete for management). Fixed width/height so every
// card in the grid is the same size regardless of content length.
export const EventCard = ({ event, footer }) => {
  const dl = deadlineMeta(event.deadline);

  return (
    <Card className="flex h-[420px] w-full flex-col overflow-hidden p-0 transition-all hover:-translate-y-0.5 hover:shadow-md">
      <div className="h-28 w-full shrink-0 bg-gradient-to-br from-forest-600 via-forest-500 to-brass-500">
        {event.bannerImageUrl ? (
          <img src={event.bannerImageUrl} alt="" className="h-full w-full object-cover" />
        ) : (
          <div className="flex h-full items-center justify-center">
            <CalendarDays size={28} className="text-white/80" strokeWidth={1.5} />
          </div>
        )}
      </div>

      <div className="flex flex-1 flex-col overflow-hidden p-4">
        <div className="mb-3.5 flex items-center justify-between gap-2">
          <Badge variant="forest" className="truncate">{event.organizingClub}</Badge>
          <Badge variant={dl.variant} className="shrink-0">{dl.label}</Badge>
        </div>

        <h3 className="line-clamp-1 font-display text-base font-semibold leading-snug text-ink-800">{event.name}</h3>
        <p className="mt-2 line-clamp-2 text-xs leading-relaxed text-slate-500">
          {truncateWords(event.description, 18)}
        </p>

        <div className="mt-4 grid grid-cols-2 gap-x-2 gap-y-2 text-xs text-slate-500">
          <span className="flex items-center gap-1.5 truncate" title="Event date">
            <CalendarDays size={12} className="shrink-0" />
            <span className="font-medium text-ink-700">Event</span>{' '}
            {event.eventDate ? format(new Date(event.eventDate), 'MMM d') : 'TBA'}
          </span>
          <span className="flex items-center gap-1.5 truncate" title="Registration deadline">
            <Clock size={12} className="shrink-0" />
            <span className="font-medium text-ink-700">Due</span> {format(new Date(event.deadline), 'MMM d')}
          </span>
          <span className="flex items-center gap-1.5 truncate">
            <User size={12} className="shrink-0" /> {event.coordinatorName || '—'}
          </span>
          <span className="flex items-center gap-1.5 truncate">
            <Phone size={12} className="shrink-0" /> {event.contactInfo || '—'}
          </span>
        </div>

        {footer ? <div className="mt-auto flex gap-2 border-t border-slate-100 pt-4">{footer}</div> : null}
      </div>
    </Card>
  );
};
