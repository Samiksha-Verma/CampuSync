import { useState, useRef, useEffect, useLayoutEffect } from 'react';
import { createPortal } from 'react-dom';
import { useQuery, useQueryClient, useMutation } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { Bell, CalendarDays, Briefcase, Award, Sparkles } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { getMyNotifications, markNotificationRead } from '../../api/notifications';
import { cn } from '../../lib/cn';

const ICONS = {
  event: CalendarDays,
  opportunity: Briefcase,
  certification: Award,
};

const iconFor = (type) => {
  const key = Object.keys(ICONS).find((k) => type.startsWith(k));
  return ICONS[key] || Sparkles;
};

export const NotificationBell = () => {
  const [open, setOpen] = useState(false);
  const [panelPos, setPanelPos] = useState(null);
  const triggerRef = useRef(null);
  const panelRef = useRef(null);
  const queryClient = useQueryClient();

  const { data: notifications = [], isLoading } = useQuery({
    queryKey: ['notifications'],
    queryFn: getMyNotifications,
  });

  const markRead = useMutation({
    mutationFn: markNotificationRead,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['notifications'] }),
  });

  const unreadCount = notifications.filter((n) => !n.isRead).length;

  // The header uses backdrop-blur, which makes it a CSS containing block for
  // fixed-position descendants - so the panel is portaled to <body> and its
  // position computed from the trigger button's own viewport rect instead of
  // relying on CSS `absolute`/`fixed` offsets nested inside the header.
  useLayoutEffect(() => {
    if (!open || !triggerRef.current) return;
    const rect = triggerRef.current.getBoundingClientRect();
    setPanelPos({ top: rect.bottom + 8, right: Math.max(12, window.innerWidth - rect.right) });
  }, [open]);

  useEffect(() => {
    const onClickOutside = (e) => {
      if (triggerRef.current?.contains(e.target)) return;
      if (panelRef.current?.contains(e.target)) return;
      setOpen(false);
    };
    document.addEventListener('mousedown', onClickOutside);
    return () => document.removeEventListener('mousedown', onClickOutside);
  }, []);

  return (
    <div className="relative">
      <button
        ref={triggerRef}
        onClick={() => setOpen((o) => !o)}
        className="relative rounded-lg p-2.5 text-slate-500 lg:p-2 transition-colors hover:bg-slate-100 hover:text-ink-700"
        aria-label="Notifications"
      >
        <Bell size={19} strokeWidth={1.9} />
        {unreadCount > 0 ? (
          <span className="absolute -right-0.5 -top-0.5 flex h-4.5 min-w-4.5 items-center justify-center rounded-full bg-brass-500 px-1 font-mono text-[10px] font-semibold text-ink-900">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        ) : null}
      </button>

      {open && panelPos
        ? createPortal(
            <>
              <div className="fixed inset-0 z-30 bg-ink-900/10" aria-hidden="true" onClick={() => setOpen(false)} />
              <div
                ref={panelRef}
                style={{ top: panelPos.top, right: panelPos.right }}
                className="fixed z-40 w-[min(24rem,calc(100vw-1.5rem))] rounded-2xl border border-slate-200 bg-white shadow-xl"
              >
                <div className="flex items-center justify-between border-b border-slate-100 px-4 py-3">
                  <p className="font-display text-sm font-semibold text-ink-800">Notifications</p>
                  {unreadCount > 0 ? (
                    <span className="text-xs text-slate-400">{unreadCount} unread</span>
                  ) : null}
                </div>

                <div className="max-h-96 overflow-y-auto">
                  {isLoading ? (
                    <div className="px-4 py-8 text-center text-sm text-slate-400">Loading…</div>
                  ) : notifications.length === 0 ? (
                    <div className="px-4 py-10 text-center">
                      <p className="text-sm text-slate-500">
                        Nothing yet. New events, postings, and updates from Faculty and Admin will show up here the
                        moment they're posted.
                      </p>
                    </div>
                  ) : (
                    <ul>
                      {notifications.map((n) => {
                        const Icon = iconFor(n.type);
                        return (
                          <li key={n._id}>
                            <button
                              onClick={() => !n.isRead && markRead.mutate(n._id)}
                              className={cn(
                                'flex w-full items-start gap-3 px-4 py-3 text-left transition-colors hover:bg-slate-50',
                                !n.isRead && 'bg-forest-50/50'
                              )}
                            >
                              <div
                                className={cn(
                                  'mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full',
                                  !n.isRead ? 'bg-forest-100 text-forest-700' : 'bg-slate-100 text-slate-400'
                                )}
                              >
                                <Icon size={14} />
                              </div>
                              <div className="min-w-0 flex-1">
                                <p className={cn('text-sm leading-snug', !n.isRead ? 'font-medium text-ink-800' : 'text-slate-500')}>
                                  {n.message}
                                </p>
                                <p className="mt-0.5 text-xs text-slate-400">
                                  {formatDistanceToNow(new Date(n.createdAt), { addSuffix: true })}
                                </p>
                              </div>
                              {!n.isRead ? <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-brass-500" /> : null}
                            </button>
                          </li>
                        );
                      })}
                    </ul>
                  )}
                </div>

                <Link
                  to="/student/notifications"
                  onClick={() => setOpen(false)}
                  className="block border-t border-slate-100 px-4 py-2.5 text-center text-sm font-medium text-forest-700 transition-colors hover:bg-slate-50"
                >
                  View all notifications
                </Link>
              </div>
            </>,
            document.body
          )
        : null}
    </div>
  );
};
