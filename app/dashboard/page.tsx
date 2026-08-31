import { redirect } from 'next/navigation'
import { headers } from 'next/headers'
import { auth } from '@/lib/auth'
import { db } from '@/lib/db'
import { familyMembers, families as familiesTable } from '@/lib/db/schema'
import { eq } from 'drizzle-orm'
import { DashboardClient } from './dashboard-client'

export const metadata = {
  title: 'Dashboard | Family Expense Tracker',
  description: 'View your family expenses and budget overview',
}

export default async function DashboardPage() {
  const session = await auth.api.getSession({ headers: await headers() })

  if (!session?.user) {
    redirect('/sign-in')
  }

  // Get user's families
  const userFamilies = await db
    .select()
    .from(familyMembers)
    .where(eq(familyMembers.userId, session.user.id))

  if (userFamilies.length === 0) {
    redirect('/onboarding')
  }

  // Get first family (for now)
  const familyMembership = userFamilies[0]
  const family = await db
    .select()
    .from(familiesTable)
    .where(eq(familiesTable.id, familyMembership.familyId))

  if (!family[0]) {
    redirect('/onboarding')
  }

  const allMembers = await db
    .select()
    .from(familyMembers)
    .where(eq(familyMembers.familyId, family[0].id))

  return (
    <DashboardClient 
      user={session.user} 
      family={family[0]} 
      membership={familyMembership}
      memberCount={allMembers.length}
    />
  )
}
