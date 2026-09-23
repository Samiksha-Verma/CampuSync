import { CalendarDays, Clock, User, Phone } from 'lucide-react';
import { format } from 'date-fns';
import { Card } from './ui/Card';
import { Badge } from './ui/Badge';
import { deadlineMeta } from '../lib/deadline';

// Shared between the student Events page and Admin/Faculty's ManageEvents so both
// stay visually identical - `footer` is the one thing that differs (a Register
// button for students, Edit/Delete for management).
export const EventCard = ({ event, footer }) => {
  const dl = deadlineMeta(event.deadline);

  return (
    <Card className="flex flex-col overflow-hidden p-0 transition-all hover:-translate-y-0.5 hover:shadow-md">
      <div className="h-36 w-full shrink-0 bg-gradient-to-br from-forest-600 via-forest-500 to-brass-500">
        {event.bannerImageUrl ? (
          <img src={event.bannerImageUrl} alt="" className="h-full w-full object-cover" />
        ) : (
          <div className="flex h-full items-center justify-center">
            <CalendarDays size={36} className="text-white/80" strokeWidth={1.5} />
          </div>
        )}
      </div>

      <div className="flex flex-1 flex-col p-6">
        <div className="mb-3 flex items-center justify-between gap-3">
          <Badge variant="forest">{event.organizingClub}</Badge>
          <Badge variant={dl.variant}>{dl.label}</Badge>
        </div>

        <h3 className="font-display text-lg font-semibold leading-snug text-ink-800">{event.name}</h3>
        {event.description ? (
          <p className="mt-2.5 line-clamp-2 text-sm text-slate-500">{event.description}</p>
        ) : null}

        <div className="mt-4 flex flex-col gap-1.5 text-xs text-slate-500">
          <span className="flex items-center gap-1.5">
            <CalendarDays size={13} />
            <span className="font-medium text-ink-700">Event:</span>{' '}
            {event.eventDate ? format(new Date(event.eventDate), 'MMM d, yyyy') : 'Date TBA'}
          </span>
          <span className="flex items-center gap-1.5">
            <Clock size={13} />
            <span className="font-medium text-ink-700">Register by:</span> {format(new Date(event.deadline), 'MMM d, yyyy')}
          </span>
          {event.coordinatorName ? (
            <span className="flex items-center gap-1.5">
              <User size={13} /> {event.coordinatorName}
            </span>
          ) : null}
          {event.contactInfo ? (
            <span className="flex items-center gap-1.5">
              <Phone size={13} /> {event.contactInfo}
            </span>
          ) : null}
        </div>

        {footer ? <div className="mt-5 flex gap-2 border-t border-slate-100 pt-4">{footer}</div> : null}
      </div>
    </Card>
  );
};
