'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { updateFamily, leaveFamily } from '@/app/actions/families'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Separator } from '@/components/ui/separator'
import { DashboardHeader } from '@/components/dashboard/header'
import { DashboardSidebar } from '@/components/dashboard/sidebar'
import { Save, LogOut } from 'lucide-react'

interface User {
  id: string
  name?: string | null
  email: string
}

interface Family {
  id: string
  name: string
  description?: string | null
  currency: string
}

interface Membership {
  id: string
  familyId: string
  userId: string
  role: string
}

const CURRENCIES = ['USD', 'EUR', 'GBP', 'INR', 'CAD', 'AUD', 'JPY']

export function SettingsClient({
  family,
  currentUser,
  currentMembership,
}: {
  family: Family
  currentUser: User
  currentMembership: Membership
}) {
  const router = useRouter()
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [name, setName] = useState(family.name)
  const [description, setDescription] = useState(family.description ?? '')
  const [currency, setCurrency] = useState(family.currency)
  const [loading, setLoading] = useState(false)
  const [leaving, setLeaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  const isAdmin = currentMembership.role === 'admin'

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)
    setSuccess(null)

    try {
      await updateFamily(family.id, name, description || undefined, currency)
      setSuccess('Settings saved successfully')
      router.refresh()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save settings')
    } finally {
      setLoading(false)
    }
  }

  const handleLeave = async () => {
    if (!confirm('Are you sure you want to leave this family? This cannot be undone.')) {
      return
    }
    setLeaving(true)
    setError(null)

    try {
      await leaveFamily(family.id)
      router.push('/onboarding')
      router.refresh()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to leave family')
      setLeaving(false)
    }
  }

  return (
    <div className="flex h-screen bg-background">
      <DashboardSidebar
        family={family}
        user={currentUser}
        membership={currentMembership}
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
      />

      <div className="flex-1 flex flex-col overflow-hidden">
        <DashboardHeader
          family={family}
          user={currentUser}
          onMenuClick={() => setSidebarOpen(!sidebarOpen)}
        />

        <main className="flex-1 overflow-auto">
          <div className="p-6 max-w-3xl mx-auto">
            <h1 className="text-3xl font-bold text-foreground mb-2">Settings</h1>
            <p className="text-muted-foreground mb-8">
              Manage your family and account preferences
            </p>

            {/* Family Settings */}
            <Card className="p-6 mb-6">
              <h2 className="text-xl font-semibold text-foreground mb-4">Family Settings</h2>
              <form onSubmit={handleSave} className="flex flex-col gap-4">
                <div className="flex flex-col gap-2">
                  <Label htmlFor="familyName">Family Name</Label>
                  <Input
                    id="familyName"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    disabled={!isAdmin || loading}
                    required
                  />
                </div>

                <div className="flex flex-col gap-2">
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    disabled={!isAdmin || loading}
                    rows={3}
                    placeholder="Optional description"
                  />
                </div>

                <div className="flex flex-col gap-2">
                  <Label htmlFor="currency">Default Currency</Label>
                  <select
                    id="currency"
                    value={currency}
                    onChange={(e) => setCurrency(e.target.value)}
                    disabled={!isAdmin || loading}
                    className="w-full px-3 py-2 border border-input rounded-md bg-background text-foreground disabled:opacity-50"
                  >
                    {CURRENCIES.map((c) => (
                      <option key={c} value={c}>
                        {c}
                      </option>
                    ))}
                  </select>
                </div>

                {error && (
                  <p className="text-sm text-destructive bg-destructive/10 p-2 rounded" role="alert">
                    {error}
                  </p>
                )}
                {success && (
                  <p className="text-sm text-green-600 bg-green-600/10 p-2 rounded">
                    {success}
                  </p>
                )}

                {isAdmin ? (
                  <div>
                    <Button type="submit" disabled={loading} className="gap-2">
                      <Save className="w-4 h-4" />
                      {loading ? 'Saving...' : 'Save Changes'}
                    </Button>
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">
                    Only family admins can edit these settings.
                  </p>
                )}
              </form>
            </Card>

            {/* Account Info */}
            <Card className="p-6 mb-6">
              <h2 className="text-xl font-semibold text-foreground mb-4">Account</h2>
              <div className="flex flex-col gap-3">
                <div>
                  <p className="text-sm text-muted-foreground">Name</p>
                  <p className="font-medium text-foreground">{currentUser.name || 'Not set'}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Email</p>
                  <p className="font-medium text-foreground">{currentUser.email}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Role</p>
                  <p className="font-medium text-foreground capitalize">{currentMembership.role}</p>
                </div>
              </div>
            </Card>

            {/* Danger Zone */}
            <Card className="p-6 border-destructive/50">
              <h2 className="text-xl font-semibold text-foreground mb-1">Danger Zone</h2>
              <p className="text-sm text-muted-foreground mb-4">
                Leaving the family will remove your access to its expenses and reports.
              </p>
              <Separator className="mb-4" />
              <Button
                variant="outline"
                onClick={handleLeave}
                disabled={leaving}
                className="gap-2 text-destructive hover:text-destructive border-destructive/50"
              >
                <LogOut className="w-4 h-4" />
                {leaving ? 'Leaving...' : 'Leave Family'}
              </Button>
            </Card>
          </div>
        </main>
      </div>
    </div>
  )
}
