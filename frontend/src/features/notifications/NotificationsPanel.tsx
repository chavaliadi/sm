import { useEffect, useState, useCallback, useRef } from "react";
import { Bell, Trash2, RefreshCw, AlertCircle, Inbox } from "lucide-react";
import { getNotifications, deleteNotification } from "./api";
import type { NotificationRead } from "./types";

export function NotificationsPanel() {
  const [isOpen, setIsOpen] = useState(false);
  const [notifications, setNotifications] = useState<NotificationRead[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const fetchNotifications = useCallback(async (showLoading = false) => {
    if (showLoading) setLoading(true);
    setError(null);
    try {
      const res = await getNotifications();
      setNotifications(res.data || []);
    } catch (err: any) {
      console.error("Failed to load notifications:", err);
      setError(
        err.response?.data?.error?.message ||
          (err instanceof Error ? err.message : "Failed to load notifications.")
      );
    } finally {
      if (showLoading) setLoading(false);
    }
  }, []);

  useEffect(() => {
    void fetchNotifications(true);
    // 30s background polling interval per RFP specification
    const interval = setInterval(() => {
      void fetchNotifications(false);
    }, 30000);
    return () => clearInterval(interval);
  }, [fetchNotifications]);

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleDismiss = async (id: number, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      await deleteNotification(id);
      setNotifications((prev) => prev.filter((n) => n.id !== id));
    } catch (err: any) {
      console.error("Failed to dismiss notification:", err);
      alert(
        err.response?.data?.error?.message ||
          (err instanceof Error ? err.message : "Failed to dismiss notification")
      );
    }
  };

  const unreadCount = notifications.filter((n) => !n.read).length;

  return (
    <div className="relative inline-block text-left" ref={dropdownRef}>
      {/* Bell Button with Badge */}
      <button
        type="button"
        onClick={() => {
          setIsOpen((prev) => !prev);
          if (!isOpen) {
            void fetchNotifications(false);
          }
        }}
        className="relative rounded-full p-2 text-gray-500 hover:bg-gray-100 hover:text-gray-700 focus:outline-none focus:ring-2 focus:ring-sky-500 focus:ring-offset-2"
        aria-label="Open Notifications"
      >
        <Bell className="h-5 w-5" />
        {unreadCount > 0 && (
          <span className="absolute top-1 right-1 flex h-4 w-4 items-center justify-center rounded-full bg-red-600 text-[10px] font-bold text-white shadow-sm">
            {unreadCount}
          </span>
        )}
      </button>

      {/* Notifications Popover Dropdown */}
      {isOpen && (
        <div className="absolute right-0 mt-2 w-80 sm:w-96 rounded-xl border border-gray-200 bg-white shadow-xl z-50 overflow-hidden">
          {/* Header */}
          <div className="flex items-center justify-between border-b border-gray-100 px-4 py-3 bg-gray-50">
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-semibold text-gray-900">Notifications</h3>
              {notifications.length > 0 && (
                <span className="rounded-full bg-sky-100 px-2 py-0.5 text-[10px] font-semibold text-sky-800">
                  {notifications.length} total
                </span>
              )}
            </div>
            <button
              type="button"
              onClick={() => void fetchNotifications(true)}
              className="text-gray-400 hover:text-gray-600 transition-colors p-1"
              title="Refresh notifications"
            >
              <RefreshCw className={`h-3.5 w-3.5 ${loading ? "animate-spin" : ""}`} />
            </button>
          </div>

          {/* List Content */}
          <div className="max-h-80 overflow-y-auto divide-y divide-gray-100">
            {loading ? (
              <div className="flex h-32 items-center justify-center text-xs text-gray-500">
                Loading notifications…
              </div>
            ) : error ? (
              <div className="p-4 text-center text-xs text-red-600">
                <AlertCircle className="mx-auto h-5 w-5 mb-1 text-red-500" />
                <p className="font-medium">{error}</p>
                <button
                  type="button"
                  onClick={() => void fetchNotifications(true)}
                  className="mt-2 text-[11px] font-semibold text-sky-700 underline hover:text-sky-900"
                >
                  Retry
                </button>
              </div>
            ) : notifications.length === 0 ? (
              <div className="p-6 text-center text-xs text-gray-500">
                <Inbox className="mx-auto h-6 w-6 mb-1 text-gray-400" />
                <p className="font-semibold text-gray-700">No Notifications</p>
                <p className="mt-0.5 text-[11px] text-gray-400">
                  You are all caught up! System alerts will appear here.
                </p>
              </div>
            ) : (
              notifications.map((item) => (
                <div
                  key={item.id}
                  className={`p-3 text-xs transition-colors hover:bg-gray-50 ${
                    !item.read ? "bg-sky-50/40" : "bg-white"
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1">
                      <div className="flex items-center gap-1.5">
                        {!item.read && (
                          <span className="h-1.5 w-1.5 rounded-full bg-sky-600 shrink-0" />
                        )}
                        <p className="font-semibold text-gray-900">{item.title}</p>
                      </div>
                      <p className="mt-1 text-gray-600 leading-snug">{item.message}</p>
                      <p className="mt-1 text-[10px] text-gray-400">
                        {new Date(item.created_at).toLocaleString("en-IN", {
                          dateStyle: "medium",
                          timeStyle: "short",
                        })}
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={(e) => void handleDismiss(item.id, e)}
                      className="text-gray-400 hover:text-red-600 p-1 transition-colors"
                      title="Dismiss notification"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
