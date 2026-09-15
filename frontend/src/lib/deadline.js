import { differenceInHours, differenceInDays, format, isPast } from 'date-fns';

// Turns a raw deadline into a badge label/variant pair - used everywhere a card
// shows how urgent (or closed) an opportunity/event/certification is.
export const deadlineMeta = (rawDate) => {
  const date = new Date(rawDate);
  const expired = isPast(date);

  if (expired) {
    return { label: `Closed ${format(date, 'MMM d')}`, variant: 'neutral', expired: true };
  }

  const hours = differenceInHours(date, new Date());
  if (hours <= 48) {
    return { label: hours <= 24 ? 'Closes today' : 'Closes tomorrow', variant: 'danger', expired: false };
  }

  const days = differenceInDays(date, new Date());
  if (days <= 7) {
    return { label: `Closes in ${days}d`, variant: 'warning', expired: false };
  }

  return { label: `Closes ${format(date, 'MMM d')}`, variant: 'info', expired: false };
};
