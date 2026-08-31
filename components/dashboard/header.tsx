'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { authClient } from '@/lib/auth-client'
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
import { Menu, LogOut, Settings, User } from 'lucide-react'
import { NotificationsDropdown } from '@/components/dashboard/notifications-dropdown'

interface DashboardHeaderProps {
  family: {
    id: string
    name: string
  }
  user: {
    id: string
    name?: string | null
    email: string
  }
  onMenuClick: () => void
}

export function DashboardHeader({
  family,
  user,
  onMenuClick,
}: DashboardHeaderProps) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)

  const handleLogout = async () => {
    setLoading(true)
    await authClient.signOut({
      fetchOptions: {
        onSuccess: () => {
          router.push('/sign-in')
          router.refresh()
        },
      },
    })
  }

  return (
    <header className="border-b bg-background px-6 py-4 flex items-center justify-between">
      <div className="flex items-center gap-4">
        <button
          onClick={onMenuClick}
          className="p-2 hover:bg-accent rounded-lg md:hidden"
        >
          <Menu className="w-5 h-5" />
        </button>
        <div>
          <h2 className="font-semibold text-foreground hidden sm:block">{family.name}</h2>
        </div>
      </div>

      <div className="flex items-center gap-4">
        <NotificationsDropdown />

        {/* User Menu */}
        <DropdownMenu>
          <DropdownMenuTrigger>
            <div 
              className="inline-flex items-center justify-center rounded-lg p-2 hover:bg-muted transition-colors cursor-pointer"
              role="button"
              tabIndex={0}
              aria-label="User menu"
            >
              <User className="w-5 h-5" />
            </div>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <DropdownMenuGroup>
              <DropdownMenuLabel>
                <div>
                  <p className="font-semibold">{user.name || 'User'}</p>
                  <p className="text-xs text-muted-foreground">{user.email}</p>
                </div>
              </DropdownMenuLabel>
            </DropdownMenuGroup>
            <DropdownMenuSeparator />
            <DropdownMenuItem render={<Link href="/dashboard/settings" />}>
              <Settings className="w-4 h-4 mr-2" />
              Settings
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onClick={handleLogout}
              disabled={loading}
              variant="destructive"
            >
              <LogOut className="w-4 h-4 mr-2" />
              {loading ? 'Signing out...' : 'Sign out'}
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  )
}
