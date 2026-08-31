'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import {
  removeFamilyMember,
  addFamilyMember,
  cancelFamilyInvite,
  acceptFamilyInvite,
} from '@/app/actions/families'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { DashboardHeader } from '@/components/dashboard/header'
import { DashboardSidebar } from '@/components/dashboard/sidebar'
import { Trash2, UserPlus, Mail, X } from 'lucide-react'

interface User {
  id: string
  name?: string | null
  email: string
}

interface FamilyMember {
  id: string
  familyId: string
  userId: string
  role: string
  user?: User
}

interface PendingInvite {
  id: string
  familyId: string
  email: string
  invitedBy: string
  status: string
  createdAt: Date
}

interface UserInvite {
  id: string
  familyId: string
  email: string
  familyName: string
}

interface Family {
  id: string
  name: string
  currency: string
}

interface Membership {
  id: string
  familyId: string
  userId: string
  role: string
}

export function MembersClient({
  family,
  currentUser,
  currentMembership,
  members,
  pendingInvites,
  userInvites,
}: {
  family: Family
  currentUser: User
  currentMembership: Membership
  members: FamilyMember[]
  pendingInvites: PendingInvite[]
  userInvites: UserInvite[]
}) {
  const router = useRouter()
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [inviteEmail, setInviteEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const isAdmin = currentMembership.role === 'admin'

  const handleAddMember = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!inviteEmail.trim()) {
      setError('Email is required')
      return
    }

    setLoading(true)
    setError(null)
    setSuccess(null)

    try {
      const result = await addFamilyMember(family.id, inviteEmail)
      if (result.type === 'invited') {
        setSuccess(`Invite sent to ${inviteEmail}. They can join once they sign up.`)
      } else {
        setSuccess('Member added successfully')
      }
      setInviteEmail('')
      router.refresh()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to send invite')
    } finally {
      setLoading(false)
    }
  }

  const handleRemoveMember = async (memberId: string) => {
    if (!confirm('Are you sure you want to remove this member?')) return

    try {
      await removeFamilyMember(family.id, memberId)
      setSuccess('Member removed')
      router.refresh()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to remove member')
    }
  }

  const handleCancelInvite = async (inviteId: string) => {
    try {
      await cancelFamilyInvite(inviteId)
      setSuccess('Invite cancelled')
      router.refresh()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to cancel invite')
    }
  }

  const handleAcceptInvite = async (inviteId: string) => {
    try {
      await acceptFamilyInvite(inviteId)
      setSuccess('Invite accepted! You have joined the family.')
      router.refresh()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to accept invite')
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
          <div className="p-6 max-w-4xl mx-auto">
            <h1 className="text-3xl font-bold text-foreground mb-2">Family Members</h1>
            <p className="text-muted-foreground mb-8">
              Manage members in {family.name}
            </p>

            {userInvites.length > 0 && (
              <Card className="p-6 mb-8 border-primary/30">
                <h2 className="text-xl font-semibold text-foreground mb-4">Pending Invites for You</h2>
                <div className="space-y-2">
                  {userInvites.map((invite) => (
                    <div key={invite.id} className="flex items-center justify-between p-3 bg-accent rounded-lg">
                      <div>
                        <p className="font-medium text-foreground">{invite.familyName}</p>
                        <p className="text-sm text-muted-foreground">You have been invited to join this family</p>
                      </div>
                      <Button size="sm" onClick={() => handleAcceptInvite(invite.id)}>
                        Accept
                      </Button>
                    </div>
                  ))}
                </div>
              </Card>
            )}

            {isAdmin && (
              <Card className="p-6 mb-8">
                <h2 className="text-xl font-semibold text-foreground mb-4">Invite Member</h2>
                <p className="text-sm text-muted-foreground mb-4">
                  Enter a Gmail or email address. If they already have an account, they will be added immediately. Otherwise, an invite will be sent for when they sign up.
                </p>
                <form onSubmit={handleAddMember} className="flex gap-2">
                  <Input
                    type="email"
                    value={inviteEmail}
                    onChange={(e) => setInviteEmail(e.target.value)}
                    placeholder="Enter email address (e.g. user@gmail.com)"
                    disabled={loading}
                  />
                  <Button type="submit" disabled={loading} className="gap-2">
                    <UserPlus className="w-4 h-4" />
                    {loading ? 'Sending...' : 'Invite'}
                  </Button>
                </form>
                {error && (
                  <p className="text-sm text-destructive mt-2">{error}</p>
                )}
                {success && (
                  <p className="text-sm text-green-600 mt-2">{success}</p>
                )}
              </Card>
            )}

            {isAdmin && pendingInvites.length > 0 && (
              <div className="mb-8">
                <h2 className="text-xl font-semibold text-foreground mb-4">
                  Pending Invites ({pendingInvites.length})
                </h2>
                <div className="space-y-2">
                  {pendingInvites.map((invite) => (
                    <Card key={invite.id} className="p-4 flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <Mail className="w-4 h-4 text-muted-foreground" />
                        <div>
                          <p className="font-medium text-foreground">{invite.email}</p>
                          <p className="text-sm text-muted-foreground">
                            Invited {new Date(invite.createdAt).toLocaleDateString('en-US', { 
                              year: 'numeric', 
                              month: 'short', 
                              day: 'numeric' 
                            })}
                          </p>
                        </div>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleCancelInvite(invite.id)}
                        className="text-destructive hover:text-destructive"
                      >
                        <X className="w-4 h-4" />
                      </Button>
                    </Card>
                  ))}
                </div>
              </div>
            )}

            <div>
              <h2 className="text-xl font-semibold text-foreground mb-4">Members ({members.length})</h2>
              <div className="space-y-2">
                {members.map((member) => (
                  <Card key={member.id} className="p-4 flex items-center justify-between">
                    <div className="flex-1">
                      <p className="font-medium text-foreground">
                        {member.user?.name || member.user?.email || 'Unknown'}
                      </p>
                      <p className="text-sm text-muted-foreground">{member.user?.email}</p>
                      <div className="mt-1">
                        <span className="inline-block px-2 py-1 text-xs font-semibold bg-accent text-foreground rounded">
                          {member.role}
                        </span>
                      </div>
                    </div>
                    {isAdmin && member.userId !== currentUser.id && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleRemoveMember(member.id)}
                        className="text-destructive hover:text-destructive"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    )}
                  </Card>
                ))}
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  )
}
