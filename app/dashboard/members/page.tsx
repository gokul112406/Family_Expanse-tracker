import { redirect } from 'next/navigation'
import { headers } from 'next/headers'
import { auth } from '@/lib/auth'
import { db } from '@/lib/db'
import { familyMembers, families as familiesTable, user } from '@/lib/db/schema'
import { eq } from 'drizzle-orm'
import { MembersClient } from './members-client'
import { getFamilyPendingInvites, getPendingInvitesForUser } from '@/app/actions/families'

export const metadata = {
  title: 'Members | Family Expense Tracker',
  description: 'Manage family members',
}

export default async function MembersPage() {
  const session = await auth.api.getSession({ headers: await headers() })

  if (!session?.user) {
    redirect('/sign-in')
  }

  // Get user's family
  const userFamilies = await db
    .select()
    .from(familyMembers)
    .where(eq(familyMembers.userId, session.user.id))

  if (userFamilies.length === 0) {
    redirect('/onboarding')
  }

  const familyMembership = userFamilies[0]
  const family = await db
    .select()
    .from(familiesTable)
    .where(eq(familiesTable.id, familyMembership.familyId))

  if (!family[0]) {
    redirect('/onboarding')
  }

  // Get all family members with user info
  const members = await db
    .select()
    .from(familyMembers)
    .where(eq(familyMembers.familyId, family[0].id))

  const memberUsers = await db
    .select()
    .from(user)

  const membersWithUsers = members.map(member => {
    const memberUser = memberUsers.find(u => u.id === member.userId)
    return {
      ...member,
      user: memberUser
    }
  })

  let pendingInvites: any[] = []
  let userInvites: any[] = []
  
  try {
    pendingInvites = await getFamilyPendingInvites(family[0].id)
    userInvites = await getPendingInvitesForUser()
  } catch (error) {
    console.error('Error loading invites (table may not exist):', error)
    // Return empty arrays if table doesn't exist yet
  }

  return (
    <MembersClient 
      family={family[0]}
      currentUser={session.user}
      currentMembership={familyMembership}
      members={membersWithUsers}
      pendingInvites={pendingInvites}
      userInvites={userInvites}
    />
  )
}
