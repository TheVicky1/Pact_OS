'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import Link from 'next/link';
import {
  Bell,
  Calendar,
  Clock,
  ShieldAlert,
  Sparkles,
  CheckCircle2,
  X,
  CheckCheck,
  Loader2,
  AlertCircle,
  ExternalLink,
  Info,
} from 'lucide-react';
import { PersistentNotification, NotificationType } from '@/types/notifications';
import {
  markNotificationReadAction,
  markAllNotificationsReadAction,
  dismissNotificationAction,
  fetchNotificationsAction,
} from '@/features/notifications/actions';
import { createClient } from '@/lib/supabase/client';

export interface NotificationPopoverProps {
  isOpen: boolean;
  onClose: () => void;
  onUnreadCountChange?: (count: number) => void;
}

function formatRelativeTime(isoString: string): string {
  try {
    const diffMs = new Date().getTime() - new Date(isoString).getTime();
    const diffSec = Math.floor(diffMs / 1000);
    const diffMin = Math.floor(diffSec / 60);
    const diffHr = Math.floor(diffMin / 60);
    const diffDay = Math.floor(diffHr / 24);

    if (diffSec < 60) return 'Just now';
    if (diffMin < 60) return `${diffMin}m ago`;
    if (diffHr < 24) return `${diffHr}h ago`;
    if (diffDay === 1) return 'Yesterday';
    if (diffDay < 7) return `${diffDay}d ago`;
    return new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric' }).format(
      new Date(isoString)
    );
  } catch {
    return 'Recently';
  }
}

export function NotificationPopover({
  isOpen,
  onClose,
  onUnreadCountChange,
}: NotificationPopoverProps) {
  const [notifications, setNotifications] = useState<PersistentNotification[]>([]);
  const [unreadCount, setUnreadCount] = useState<number>(0);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isMutating, setIsMutating] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const popoverRef = useRef<HTMLDivElement>(null);

  // Load persistent notifications
  const loadNotifications = useCallback(async () => {
    try {
      setErrorMessage(null);
      const res = await fetchNotificationsAction(25);
      if (res.success && res.data) {
        setNotifications(res.data.notifications);
        setUnreadCount(res.data.unreadCount);
        if (onUnreadCountChange) {
          onUnreadCountChange(res.data.unreadCount);
        }
      } else if (res.error) {
        setErrorMessage(res.error);
      }
    } catch {
      setErrorMessage('Failed to load notifications.');
    } finally {
      setIsLoading(false);
    }
  }, [onUnreadCountChange]);

  useEffect(() => {
    let isMounted = true;
    void (async () => {
      try {
        const res = await fetchNotificationsAction(25);
        if (isMounted) {
          if (res.success && res.data) {
            setNotifications(res.data.notifications);
            setUnreadCount(res.data.unreadCount);
            onUnreadCountChange?.(res.data.unreadCount);
          } else if (res.error) {
            setErrorMessage(res.error);
          }
          setIsLoading(false);
        }
      } catch {
        if (isMounted) {
          setErrorMessage('Failed to load notifications.');
          setIsLoading(false);
        }
      }
    })();

    return () => {
      isMounted = false;
    };
  }, [onUnreadCountChange]);

  // Set up Supabase Realtime subscription for live incoming notifications
  useEffect(() => {
    const supabase = createClient();

    const channel = supabase
      .channel('public:notifications')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'notifications',
        },
        () => {
          // Re-fetch notifications whenever database rows mutate
          loadNotifications();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [loadNotifications]);

  // Optimistic Mark Single as Read
  const handleMarkAsRead = async (id: string) => {
    // Optimistic UI update
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, is_read: true, read_at: new Date().toISOString() } : n))
    );
    setUnreadCount((prev) => {
      const next = Math.max(0, prev - 1);
      if (onUnreadCountChange) onUnreadCountChange(next);
      return next;
    });

    try {
      await markNotificationReadAction(id);
    } catch {
      loadNotifications();
    }
  };

  // Optimistic Mark All as Read
  const handleMarkAllAsRead = async () => {
    if (unreadCount === 0 || isMutating) return;
    setIsMutating(true);

    const prevList = [...notifications];
    const prevCount = unreadCount;

    setNotifications((prev) =>
      prev.map((n) => ({ ...n, is_read: true, read_at: new Date().toISOString() }))
    );
    setUnreadCount(0);
    if (onUnreadCountChange) onUnreadCountChange(0);

    try {
      const res = await markAllNotificationsReadAction();
      if (!res.success) {
        setNotifications(prevList);
        setUnreadCount(prevCount);
        if (onUnreadCountChange) onUnreadCountChange(prevCount);
      }
    } catch {
      setNotifications(prevList);
      setUnreadCount(prevCount);
      if (onUnreadCountChange) onUnreadCountChange(prevCount);
    } finally {
      setIsMutating(false);
    }
  };

  // Optimistic Dismiss
  const handleDismiss = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();

    const target = notifications.find((n) => n.id === id);
    const wasUnread = target ? !target.is_read : false;

    setNotifications((prev) => prev.filter((n) => n.id !== id));
    if (wasUnread) {
      setUnreadCount((prev) => {
        const next = Math.max(0, prev - 1);
        if (onUnreadCountChange) onUnreadCountChange(next);
        return next;
      });
    }

    try {
      await dismissNotificationAction(id);
    } catch {
      loadNotifications();
    }
  };

  // Close on Click Outside or Escape Key
  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    },
    [isOpen, onClose]
  );

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (popoverRef.current && !popoverRef.current.contains(e.target as Node)) {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      window.addEventListener('keydown', handleKeyDown);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, onClose, handleKeyDown]);

  if (!isOpen) return null;

  const getNotificationIcon = (type: NotificationType) => {
    switch (type) {
      case 'accountability_activated':
      case 'verification_required':
        return <ShieldAlert className="w-4 h-4 text-rose-400" />;
      case 'task_missed':
      case 'task_deadline_approaching':
        return <Clock className="w-4 h-4 text-amber-400" />;
      case 'verification_completed':
      case 'waiver_reset':
        return <Sparkles className="w-4 h-4 text-emerald-400" />;
      case 'weekly_review':
        return <Calendar className="w-4 h-4 text-[#d4af37]" />;
      default:
        return <Info className="w-4 h-4 text-zinc-400" />;
    }
  };

  return (
    <div
      ref={popoverRef}
      role="dialog"
      aria-modal="true"
      aria-label="Notification Center"
      className="absolute right-0 top-14 w-80 sm:w-96 rounded-3xl bg-[#0e0e14]/95 backdrop-blur-2xl border border-white/[0.1] shadow-2xl shadow-black/80 z-50 overflow-hidden animate-in fade-in slide-in-from-top-2 duration-150"
    >
      {/* Popover Header */}
      <div className="p-4 sm:p-5 border-b border-white/[0.06] flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-xl bg-[#d4af37]/15 text-[#e2c056] border border-[#d4af37]/30">
            <Bell className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-semibold text-zinc-100">Notifications</h3>
              {unreadCount > 0 && (
                <span className="px-2 py-0.5 rounded-full bg-[#d4af37]/20 text-[#e2c056] border border-[#d4af37]/40 text-[10px] font-bold">
                  {unreadCount} new
                </span>
              )}
            </div>
            <span className="text-[11px] text-zinc-400">Authoritative persistent alerts</span>
          </div>
        </div>

        <div className="flex items-center gap-1">
          {unreadCount > 0 && (
            <button
              type="button"
              onClick={handleMarkAllAsRead}
              disabled={isMutating}
              title="Mark all as read"
              aria-label="Mark all as read"
              className="p-1.5 rounded-lg hover:bg-white/[0.06] text-zinc-400 hover:text-zinc-200 transition-colors cursor-pointer text-xs flex items-center gap-1"
            >
              <CheckCheck className="w-3.5 h-3.5" />
              <span className="text-[11px] hidden sm:inline">Mark read</span>
            </button>
          )}

          <button
            type="button"
            onClick={onClose}
            aria-label="Close notification center"
            className="p-1.5 rounded-lg hover:bg-white/[0.06] text-zinc-400 hover:text-zinc-100 transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Popover Content */}
      <div className="max-h-[380px] overflow-y-auto divide-y divide-white/[0.04]">
        {isLoading ? (
          <div className="p-8 text-center space-y-3">
            <Loader2 className="w-6 h-6 animate-spin text-[#d4af37] mx-auto" />
            <p className="text-xs text-zinc-400">Loading notifications...</p>
          </div>
        ) : errorMessage ? (
          <div className="p-6 text-center space-y-2">
            <AlertCircle className="w-5 h-5 text-rose-400 mx-auto" />
            <p className="text-xs text-rose-300">{errorMessage}</p>
            <button
              type="button"
              onClick={loadNotifications}
              className="text-xs text-[#e2c056] hover:underline cursor-pointer"
            >
              Retry
            </button>
          </div>
        ) : notifications.length === 0 ? (
          <div className="p-8 text-center space-y-2.5">
            <div className="w-10 h-10 rounded-2xl bg-white/[0.04] border border-white/[0.06] flex items-center justify-center mx-auto text-zinc-500">
              <CheckCircle2 className="w-5 h-5" />
            </div>
            <div className="space-y-0.5">
              <p className="text-sm font-medium text-zinc-200">Zero Unresolved Alerts</p>
              <p className="text-xs text-zinc-500">
                You are completely up to date with your discipline horizon.
              </p>
            </div>
          </div>
        ) : (
          notifications.map((n) => {
            const isUnread = !n.is_read;

            return (
              <div
                key={n.id}
                onClick={() => isUnread && handleMarkAsRead(n.id)}
                className={`p-4 transition-all flex items-start justify-between gap-3 group relative cursor-pointer ${
                  isUnread
                    ? 'bg-[#d4af37]/[0.04] hover:bg-[#d4af37]/[0.08]'
                    : 'hover:bg-white/[0.03] opacity-85'
                }`}
              >
                {/* Unread Accent Indicator Dot */}
                {isUnread && (
                  <span
                    aria-hidden="true"
                    className="absolute left-1.5 top-1/2 -translate-y-1/2 w-1.5 h-1.5 rounded-full bg-[#d4af37] shadow-sm shadow-[#d4af37]"
                  />
                )}

                <div className="flex items-start gap-3 flex-1 min-w-0">
                  <div
                    className={`p-2 rounded-xl border shrink-0 mt-0.5 ${
                      isUnread
                        ? 'bg-zinc-900 border-white/[0.1]'
                        : 'bg-zinc-950 border-white/[0.04]'
                    }`}
                  >
                    {getNotificationIcon(n.type)}
                  </div>

                  <div className="space-y-1 min-w-0 flex-1">
                    <div className="flex items-center justify-between gap-2">
                      <h4
                        className={`text-xs font-semibold truncate ${
                          isUnread ? 'text-zinc-100' : 'text-zinc-300'
                        }`}
                      >
                        {n.title}
                      </h4>
                      <span className="text-[10px] text-zinc-400 shrink-0 font-mono">
                        {formatRelativeTime(n.created_at)}
                      </span>
                    </div>

                    <p className="text-[11px] text-zinc-300 leading-relaxed line-clamp-2">
                      {n.body}
                    </p>

                    {n.action_url && (
                      <Link
                        href={n.action_url}
                        onClick={onClose}
                        className="inline-flex items-center gap-1 text-[11px] text-[#e2c056] hover:underline font-medium pt-1"
                      >
                        <span>View Details</span>
                        <ExternalLink className="w-3 h-3" />
                      </Link>
                    )}
                  </div>
                </div>

                {/* Dismiss Button */}
                <button
                  type="button"
                  onClick={(e) => handleDismiss(n.id, e)}
                  aria-label="Dismiss notification"
                  className="opacity-0 group-hover:opacity-100 p-1 rounded-lg hover:bg-white/[0.08] text-zinc-400 hover:text-zinc-200 transition-all cursor-pointer shrink-0"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            );
          })
        )}
      </div>

      {/* Popover Footer */}
      <div className="p-3 bg-zinc-950/80 border-t border-white/[0.06] flex items-center justify-between text-xs text-zinc-400 px-4">
        <span>Persistent History</span>
        <Link
          href="/app/settings"
          onClick={onClose}
          className="text-[#e2c056] hover:underline text-[11px] font-medium"
        >
          Notification Settings
        </Link>
      </div>
    </div>
  );
}
