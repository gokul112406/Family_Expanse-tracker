'use client'

import { useCallback, useEffect, useState } from 'react'
import {
  getUserNotifications,
  markNotificationAsRead,
  markAllAsRead,
} from '@/app/actions/notifications'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Bell } from 'lucide-react'

interface Notification {
  id: string
  title: string
  message: string | null
  isRead: boolean | null
  createdAt: Date
  type: string
}

export function NotificationsDropdown() {
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)

  const loadNotifications = useCallback(async () => {
    setLoading(true)
    try {
      const result = await getUserNotifications(20)
      setNotifications(result as Notification[])
    } catch {
      setNotifications([])
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    loadNotifications()
  }, [loadNotifications])

  useEffect(() => {
    if (open) {
      loadNotifications()
    }
  }, [open, loadNotifications])

  const unreadCount = notifications.filter((n) => !n.isRead).length

  const handleMarkRead = async (id: string) => {
    await markNotificationAsRead(id)
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, isRead: true } : n))
    )
  }

  const handleMarkAllRead = async () => {
    await markAllAsRead()
    setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })))
  }

  return (
    <DropdownMenu open={open} onOpenChange={setOpen}>
      <DropdownMenuTrigger>
        <div 
          className="relative inline-flex items-center justify-center rounded-lg p-2 hover:bg-muted transition-colors cursor-pointer"
          role="button"
          tabIndex={0}
          aria-label="Notifications"
        >
          <Bell className="w-5 h-5" />
          {unreadCount > 0 && (
            <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full" />
          )}
        </div>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-80">
        <DropdownMenuGroup>
          <div className="flex items-center justify-between px-2 py-1.5">
            <DropdownMenuLabel className="p-0">Notifications</DropdownMenuLabel>
            {unreadCount > 0 && (
              <button
                onClick={handleMarkAllRead}
                className="text-xs text-primary hover:underline"
              >
                Mark all read
              </button>
            )}
          </div>
        </DropdownMenuGroup>
        <DropdownMenuSeparator />
        {loading ? (
          <p className="px-3 py-4 text-sm text-muted-foreground text-center">
            Loading...
          </p>
        ) : notifications.length === 0 ? (
          <p className="px-3 py-4 text-sm text-muted-foreground text-center">
            No notifications yet
          </p>
        ) : (
          notifications.map((notification) => (
            <DropdownMenuItem
              key={notification.id}
              onClick={() => !notification.isRead && handleMarkRead(notification.id)}
              className={!notification.isRead ? 'bg-accent/50' : ''}
            >
              <div className="flex flex-col gap-0.5 w-full">
                <p className="text-sm font-medium">{notification.title}</p>
                {notification.message && (
                  <p className="text-xs text-muted-foreground line-clamp-2">
                    {notification.message}
                  </p>
                )}
                <p className="text-xs text-muted-foreground">
                  {new Date(notification.createdAt).toLocaleDateString()}
                </p>
              </div>
            </DropdownMenuItem>
          ))
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
