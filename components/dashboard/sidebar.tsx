'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import {
  Home,
  BarChart3,
  Wallet,
  Users,
  Settings,
  X,
} from 'lucide-react'

interface DashboardSidebarProps {
  family: {
    id: string
    name: string
  }
  user: {
    id: string
    name?: string | null
    email: string
  }
  membership: {
    id: string
    familyId: string
    userId: string
    role: string
  }
  isOpen: boolean
  onClose: () => void
}

export function DashboardSidebar({
  family,
  user,
  membership,
  isOpen,
  onClose,
}: DashboardSidebarProps) {
  const pathname = usePathname()

  const menuItems = [
    {
      icon: Home,
      label: 'Dashboard',
      href: '/dashboard',
    },
    {
      icon: Wallet,
      label: 'Expenses',
      href: '/dashboard/expenses',
    },
    {
      icon: BarChart3,
      label: 'Reports',
      href: '/dashboard/reports',
    },
    {
      icon: Users,
      label: 'Members',
      href: '/dashboard/members',
    },
  ]

  if (membership.role === 'admin') {
    menuItems.push({
      icon: Settings,
      label: 'Settings',
      href: '/dashboard/settings',
    })
  }

  const isActive = (href: string) => {
    if (href === '/dashboard') {
      return pathname === '/dashboard'
    }
    return pathname.startsWith(href)
  }

  return (
    <>
      {/* Mobile Overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 md:hidden"
          onClick={onClose}
        />
      )}

      {/* Sidebar */}
      <aside
        className={cn(
          'w-64 bg-accent border-r border-border flex flex-col',
          'fixed left-0 top-0 h-full z-50 md:z-0 md:relative md:translate-x-0 transition-transform',
          isOpen ? 'translate-x-0' : '-translate-x-full'
        )}
      >
        {/* Header */}
        <div className="p-6 border-b border-border">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <img 
                src="/logo.jpeg" 
                alt="Family Expense Tracker" 
                className="w-12 h-12 rounded-full object-cover shadow-md"
                style={{ minWidth: '48px', minHeight: '48px' }}
              />
              <h1 className="text-lg font-bold text-foreground">Family Expense</h1>
            </div>
            <button
              onClick={onClose}
              className="p-1 hover:bg-background rounded md:hidden"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
          <p className="text-sm font-semibold text-foreground">{family.name}</p>
          <p className="text-xs text-muted-foreground">{membership.role}</p>
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-4 space-y-2">
          {menuItems.map((item) => {
            const Icon = item.icon
            const active = isActive(item.href)

            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={onClose}
                className={cn(
                  "group/button inline-flex w-full shrink-0 items-center justify-start gap-3 rounded-lg border border-transparent bg-clip-padding px-2.5 h-8 text-sm font-medium whitespace-nowrap transition-all outline-none select-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50",
                  active
                    ? "bg-primary text-primary-foreground hover:bg-primary/80"
                    : "hover:bg-muted hover:text-foreground"
                )}
              >
                <Icon className="w-4 h-4" />
                {item.label}
              </Link>
            )
          })}
        </nav>

        {/* Footer */}
        <div className="p-4 border-t border-border">
          <p className="text-xs text-muted-foreground mb-2">
            Logged in as
          </p>
          <p className="text-sm font-medium text-foreground truncate">
            {user.name || user.email}
          </p>
        </div>
      </aside>
    </>
  )
}
