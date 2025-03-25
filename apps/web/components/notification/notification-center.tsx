'use client';

import { useState } from 'react';
import { Bell, X, Check, Info, AlertTriangle, Clock } from 'lucide-react';

/**
 * NotificationCenter component implementing the Notification System from section 15
 * - Supports different notification types (system alerts, user-specific notifications)
 * - Offers clear message presentation with actionable items
 * - Provides notification management
 */
export function NotificationCenter() {
  const [isOpen, setIsOpen] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([
    {
      id: '1',
      title: 'System Update',
      message: 'The system will be undergoing maintenance on Sunday at 2 AM EST.',
      type: 'system',
      read: false,
      createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
    },
    {
      id: '2',
      title: 'New Appointment',
      message: 'Alice Johnson has scheduled an appointment for tomorrow at 3 PM.',
      type: 'appointment',
      read: false,
      createdAt: new Date(Date.now() - 5 * 60 * 60 * 1000).toISOString(),
    },
    {
      id: '3',
      title: 'Payment Received',
      message: 'Payment of $120.00 received from Bob Smith.',
      type: 'payment',
      read: true,
      createdAt: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
    },
  ]);

  // Count unread notifications
  const unreadCount = notifications.filter(notification => !notification.read).length;

  // Mark a notification as read
  const markAsRead = (id: string) => {
    setNotifications(
      notifications.map(notification =>
        notification.id === id ? { ...notification, read: true } : notification
      )
    );
  };

  // Mark all notifications as read
  const markAllAsRead = () => {
    setNotifications(
      notifications.map(notification => ({ ...notification, read: true }))
    );
  };

  // Remove a notification
  const removeNotification = (id: string) => {
    setNotifications(notifications.filter(notification => notification.id !== id));
  };

  // Get icon based on notification type
  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'system':
        return <Info className="h-6 w-6 text-blue-500" />;
      case 'appointment':
        return <Clock className="h-6 w-6 text-purple-500" />;
      case 'payment':
        return <Check className="h-6 w-6 text-green-500" />;
      case 'alert':
        return <AlertTriangle className="h-6 w-6 text-yellow-500" />;
      default:
        return <Info className="h-6 w-6 text-gray-500" />;
    }
  };

  // Format relative time
  const getRelativeTime = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);
    
    if (diffInSeconds < 60) {
      return 'just now';
    } else if (diffInSeconds < 3600) {
      const minutes = Math.floor(diffInSeconds / 60);
      return `${minutes} ${minutes === 1 ? 'minute' : 'minutes'} ago`;
    } else if (diffInSeconds < 86400) {
      const hours = Math.floor(diffInSeconds / 3600);
      return `${hours} ${hours === 1 ? 'hour' : 'hours'} ago`;
    } else {
      const days = Math.floor(diffInSeconds / 86400);
      return `${days} ${days === 1 ? 'day' : 'days'} ago`;
    }
  };

  return (
    <div className="relative">
      {/* Notification Bell */}
      <button
        className="relative rounded-full p-1 text-gray-400 hover:text-gray-500 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:ring-offset-2"
        onClick={() => setIsOpen(!isOpen)}
      >
        <span className="sr-only">View notifications</span>
        <Bell className="h-6 w-6" />
        {unreadCount > 0 && (
          <span className="absolute top-0 right-0 block h-2 w-2 rounded-full bg-red-500 ring-2 ring-white" />
        )}
      </button>

      {/* Notification Panel */}
      {isOpen && (
        <div className="absolute right-0 mt-2 w-80 sm:w-96 origin-top-right bg-white rounded-md shadow-lg ring-1 ring-black ring-opacity-5 z-50">
          <div className="py-1 border-b border-gray-200">
            <div className="flex justify-between px-4 py-2">
              <h3 className="text-sm font-medium text-gray-900">Notifications</h3>
              {unreadCount > 0 && (
                <button
                  className="text-xs text-teal-600 hover:text-teal-500"
                  onClick={markAllAsRead}
                >
                  Mark all as read
                </button>
              )}
            </div>
          </div>

          <div className="max-h-80 overflow-y-auto">
            {notifications.length === 0 ? (
              <div className="py-8 text-center">
                <p className="text-sm text-gray-500">No notifications yet</p>
              </div>
            ) : (
              <ul className="divide-y divide-gray-200">
                {notifications.map((notification) => (
                  <li
                    key={notification.id}
                    className={`px-4 py-3 ${!notification.read ? 'bg-teal-50' : ''}`}
                  >
                    <div className="flex items-start">
                      <div className="flex-shrink-0 mt-0.5">
                        {getNotificationIcon(notification.type)}
                      </div>
                      <div className="ml-3 w-0 flex-1">
                        <div className="flex justify-between">
                          <p className="text-sm font-medium text-gray-900">{notification.title}</p>
                          <div className="ml-2 flex flex-shrink-0">
                            <button
                              className="inline-flex text-gray-400 hover:text-gray-500"
                              onClick={() => removeNotification(notification.id)}
                            >
                              <span className="sr-only">Close</span>
                              <X className="h-4 w-4" />
                            </button>
                          </div>
                        </div>
                        <p className="text-sm text-gray-500 mt-1">{notification.message}</p>
                        <div className="mt-2 flex justify-between">
                          <p className="text-xs text-gray-500">
                            {getRelativeTime(notification.createdAt)}
                          </p>
                          {!notification.read && (
                            <button
                              className="text-xs text-teal-600 hover:text-teal-500"
                              onClick={() => markAsRead(notification.id)}
                            >
                              Mark as read
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>

          <div className="py-1 border-t border-gray-200">
            <a
              href="/notifications"
              className="block px-4 py-2 text-sm text-center text-teal-600 hover:text-teal-500"
            >
              View all notifications
            </a>
          </div>
        </div>
      )}
    </div>
  );
}

// Types
interface Notification {
  id: string;
  title: string;
  message: string;
  type: 'system' | 'appointment' | 'payment' | 'alert' | string;
  read: boolean;
  createdAt: string;
}
