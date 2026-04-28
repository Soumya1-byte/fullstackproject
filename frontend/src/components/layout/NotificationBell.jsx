import { useEffect, useMemo, useRef, useState } from 'react';
import { Bell, CheckCheck } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { notificationService } from '../../services/notificationService';

function formatTime(value) {
  if (!value) return 'Just now';
  const date = new Date(value);
  const diffMinutes = Math.round((Date.now() - date.getTime()) / 60000);
  if (diffMinutes <= 1) return 'Just now';
  if (diffMinutes < 60) return `${diffMinutes}m ago`;
  const diffHours = Math.round(diffMinutes / 60);
  if (diffHours < 24) return `${diffHours}h ago`;
  return date.toLocaleDateString();
}

export default function NotificationBell() {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const containerRef = useRef(null);
  const navigate = useNavigate();

  const loadNotifications = async () => {
    const data = await notificationService.list();
    setNotifications(data.items || []);
    setUnreadCount(Number(data.unreadCount || 0));
  };

  useEffect(() => {
    let active = true;

    loadNotifications()
      .catch(() => {
        if (!active) return;
        setNotifications([]);
        setUnreadCount(0);
      })
      .finally(() => {
        if (active) {
          setLoading(false);
        }
      });

    const intervalId = window.setInterval(() => {
      loadNotifications().catch(() => {});
    }, 30000);

    return () => {
      active = false;
      window.clearInterval(intervalId);
    };
  }, []);

  useEffect(() => {
    const onPointerDown = (event) => {
      if (containerRef.current && !containerRef.current.contains(event.target)) {
        setOpen(false);
      }
    };

    document.addEventListener('mousedown', onPointerDown);
    return () => document.removeEventListener('mousedown', onPointerDown);
  }, []);

  const hasNotifications = notifications.length > 0;
  const unreadLabel = useMemo(() => (unreadCount > 99 ? '99+' : String(unreadCount)), [unreadCount]);

  const onOpenChange = async () => {
    const nextOpen = !open;
    setOpen(nextOpen);
    if (nextOpen) {
      try {
        await loadNotifications();
      } catch {
        // Keep last known notifications if refresh fails.
      }
    }
  };

  const onNotificationClick = async (notification) => {
    try {
      if (!notification.read) {
        await notificationService.markRead(notification._id);
        setNotifications((prev) => prev.map((item) => (item._id === notification._id ? { ...item, read: true } : item)));
        setUnreadCount((prev) => Math.max(0, prev - 1));
      }
    } catch {
      // Navigate even if read status fails to persist.
    }

    setOpen(false);
    if (notification.actionUrl) {
      navigate(notification.actionUrl);
    }
  };

  const onMarkAllRead = async () => {
    const data = await notificationService.markAllRead();
    setNotifications(data.items || []);
    setUnreadCount(Number(data.unreadCount || 0));
  };

  return (
    <div ref={containerRef} className="relative">
      <button
        type="button"
        className="relative rounded-xl border border-[var(--line-soft)] bg-[var(--surface-card)] p-2 text-[var(--text-secondary)] transition hover:scale-105 hover:shadow-lg"
        aria-label="Notifications"
        onClick={onOpenChange}
      >
        <Bell className="h-4 w-4" />
        {unreadCount > 0 ? (
          <span className="absolute -right-2 -top-2 min-w-5 rounded-full bg-[var(--danger-500)] px-1.5 py-0.5 text-[10px] font-semibold leading-none text-white">
            {unreadLabel}
          </span>
        ) : null}
      </button>

      {open ? (
        <div className="absolute right-0 top-12 z-50 w-[min(92vw,24rem)] rounded-[24px] border border-[var(--line-soft)] bg-[color-mix(in_oklab,var(--surface-card)_96%,transparent)] p-3 shadow-[0_22px_50px_rgba(15,23,42,0.18)] backdrop-blur-xl">
          <div className="mb-3 flex items-center justify-between gap-3 px-2">
            <div>
              <p className="text-sm font-semibold text-[var(--text-primary)]">Notifications</p>
              <p className="text-xs text-[var(--text-muted)]">{unreadCount} unread</p>
            </div>
            <button
              type="button"
              className="inline-flex items-center gap-1 rounded-xl px-2 py-1 text-xs font-medium text-[var(--brand-600)] transition hover:bg-[var(--surface-elevated)] disabled:cursor-not-allowed disabled:opacity-50"
              onClick={onMarkAllRead}
              disabled={!unreadCount}
            >
              <CheckCheck className="h-3.5 w-3.5" />
              Mark all read
            </button>
          </div>

          <div className="max-h-[24rem] space-y-2 overflow-y-auto pr-1">
            {!hasNotifications && !loading ? (
              <div className="rounded-2xl border border-dashed border-[var(--line-soft)] px-4 py-8 text-center text-sm text-[var(--text-muted)]">
                No notifications yet.
              </div>
            ) : null}

            {loading && !hasNotifications ? (
              <div className="rounded-2xl border border-[var(--line-soft)] px-4 py-8 text-center text-sm text-[var(--text-muted)]">
                Loading notifications...
              </div>
            ) : null}

            {notifications.map((notification) => (
              <button
                key={notification._id}
                type="button"
                onClick={() => onNotificationClick(notification)}
                className={`w-full rounded-2xl border px-4 py-3 text-left transition hover:border-[var(--brand-300)] hover:bg-[var(--surface-elevated)] ${
                  notification.read
                    ? 'border-[var(--line-soft)] bg-[var(--surface-card)]'
                    : 'border-[color-mix(in_oklab,var(--brand-500)_34%,var(--line-soft))] bg-[color-mix(in_oklab,var(--brand-500)_10%,var(--surface-card))]'
                }`}
              >
                <div className="flex items-start gap-3">
                  <span className={`mt-1 h-2.5 w-2.5 rounded-full ${notification.read ? 'bg-[var(--line-soft)]' : 'bg-[var(--brand-500)]'}`} />
                  <div className="min-w-0 flex-1 space-y-1">
                    <div className="flex items-start justify-between gap-3">
                      <p className="text-sm font-semibold text-[var(--text-primary)]">{notification.title}</p>
                      <span className="shrink-0 text-[11px] text-[var(--text-muted)]">{formatTime(notification.createdAt)}</span>
                    </div>
                    <p className="text-sm leading-relaxed text-[var(--text-secondary)]">{notification.message}</p>
                  </div>
                </div>
              </button>
            ))}
          </div>
        </div>
      ) : null}
    </div>
  );
}
