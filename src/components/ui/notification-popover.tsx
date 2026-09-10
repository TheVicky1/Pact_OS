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
  Settings,
  X,
  Sliders,
} from 'lucide-react';

export interface NotificationItem {
  id: string;
  type: 'daily_plan' | 'deadline' | 'consequence' | 'waiver_reset';
  title: string;
  description: string;
  timestamp: string;
  isRead: boolean;
  actionHref?: string;
}

const INITIAL_NOTIFICATIONS: NotificationItem[] = [
  {
    id: 'notif-1',
    type: 'daily_plan',
    title: 'Daily Horizon Available',
    description:
      'Your daily plan and commitment schedule for today are ready for execution.',
    timestamp: 'Today',
    isRead: false,
    actionHref: '/app/planner',
  },
  {
    id: 'notif-2',
    type: 'waiver_reset',
    title: 'Waiver Quota Refreshed',
    description:
      'Your 3/3 weekly waiver quota is fully available for intentional life exceptions.',
    timestamp: 'This Week',
    isRead: false,
    actionHref: '/app/accountability',
  },
];

export interface NotificationPopoverProps {
  isOpen: boolean;
  onClose: () => void;
}

export function NotificationPopover({ isOpen, onClose }: NotificationPopoverProps) {
  const [notifications, setNotifications] = useState<NotificationItem[]>(
    INITIAL_NOTIFICATIONS
  );
  const popoverRef = useRef<HTMLDivElement>(null);

  const unreadCount = notifications.filter((n) => !n.isRead).length;

  const markAllAsRead = () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
  };

  const markSingleAsRead = (id: string) => {
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, isRead: true } : n))
    );
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
      if (
        popoverRef.current &&
        !popoverRef.current.contains(e.target as Node)
      ) {
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

  const getNotificationIcon = (type: NotificationItem['type']) => {
    switch (type) {
      case 'daily_plan':
        return <Calendar className="w-4 h-4 text-[#d4af37]" />;
      case 'deadline':
        return <Clock className="w-4 h-4 text-amber-400" />;
      case 'consequence':
        return <ShieldAlert className="w-4 h-4 text-rose-400" />;
      case 'waiver_reset':
        return <Sparkles className="w-4 h-4 text-emerald-400" />;
      default:
        return <Bell className="w-4 h-4 text-zinc-400" />;
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
              <h3 className="text-sm font-semibold text-zinc-100">
                Notifications
              </h3>
              {unreadCount > 0 && (
                <span className="px-2 py-0.5 rounded-full bg-[#d4af37]/20 text-[#e2c056] border border-[#d4af37]/40 text-[10px] font-bold">
                  {unreadCount} new
                </span>
              )}
            </div>
            <span className="text-[11px] text-zinc-400">
              Factual account & horizon updates
            </span>
          </div>
        </div>

        <div className="flex items-center gap-1">
          {unreadCount > 0 && (
            <button
              type="button"
              onClick={markAllAsRead}
              className="text-[11px] font-medium text-zinc-400 hover:text-zinc-200 transition-colors px-2 py-1 rounded-lg hover:bg-white/[0.04] cursor-pointer"
            >
              Mark all read
            </button>
          )}
          <button
            type="button"
            onClick={onClose}
            aria-label="Close notification center"
            className="p-1.5 rounded-lg text-zinc-400 hover:text-zinc-200 hover:bg-white/[0.06] transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Notifications List */}
      <div className="max-h-80 overflow-y-auto divide-y divide-white/[0.04]">
        {notifications.length === 0 ? (
          <div className="p-8 text-center space-y-2">
            <CheckCircle2 className="w-8 h-8 text-emerald-400/60 mx-auto" />
            <p className="text-sm font-medium text-zinc-300">All caught up</p>
            <p className="text-xs text-zinc-500">
              No new notifications or pending alerts at this time.
            </p>
          </div>
        ) : (
          notifications.map((item) => (
            <div
              key={item.id}
              onClick={() => markSingleAsRead(item.id)}
              className={`p-4 transition-colors flex items-start gap-3.5 group cursor-pointer ${
                item.isRead
                  ? 'bg-transparent hover:bg-white/[0.02]'
                  : 'bg-[#14141c]/60 hover:bg-[#181822]/80'
              }`}
            >
              <div className="p-2 rounded-xl bg-zinc-900 border border-white/[0.06] shrink-0 mt-0.5">
                {getNotificationIcon(item.type)}
              </div>

              <div className="min-w-0 flex-1 space-y-1">
                <div className="flex items-center justify-between gap-2">
                  <span
                    className={`text-xs font-semibold truncate ${
                      item.isRead ? 'text-zinc-300' : 'text-zinc-100'
                    }`}
                  >
                    {item.title}
                  </span>
                  <span className="text-[10px] text-zinc-500 shrink-0">
                    {item.timestamp}
                  </span>
                </div>

                <p className="text-xs text-zinc-400 leading-relaxed line-clamp-2">
                  {item.description}
                </p>

                {item.actionHref && (
                  <div className="pt-1">
                    <Link
                      href={item.actionHref}
                      onClick={onClose}
                      className="text-[11px] font-medium text-[#e2c056] hover:underline inline-flex items-center gap-1"
                    >
                      <span>View details</span>
                      <span>→</span>
                    </Link>
                  </div>
                )}
              </div>

              {!item.isRead && (
                <span className="w-1.5 h-1.5 rounded-full bg-[#d4af37] shrink-0 mt-1.5 shadow-sm shadow-[#d4af37]" />
              )}
            </div>
          ))
        )}
      </div>

      {/* Popover Footer */}
      <div className="p-3 bg-[#09090b]/80 border-t border-white/[0.06] flex items-center justify-between text-xs text-zinc-400">
        <span className="text-[11px] flex items-center gap-1">
          <Sliders className="w-3 h-3 text-[#d4af37]" />
          Calm Delivery Mode
        </span>

        <Link
          href="/app/settings"
          onClick={onClose}
          className="text-[11px] text-zinc-300 hover:text-zinc-100 flex items-center gap-1 hover:underline"
        >
          <Settings className="w-3 h-3 text-zinc-400" />
          <span>Preferences</span>
        </Link>
      </div>
    </div>
  );
}
