import { redirect } from 'next/navigation'
import { headers } from 'next/headers'
import { auth } from '@/lib/auth'
import { db } from '@/lib/db'
import { familyMembers, families as familiesTable } from '@/lib/db/schema'
import { eq } from 'drizzle-orm'
import { ReportsClient } from './reports-client'

export const metadata = {
  title: 'Reports | Family Expense Tracker',
  description: 'View spending reports and analytics',
}

export default async function ReportsPage() {
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

  return (
    <ReportsClient 
      family={family[0]}
      currentUser={session.user}
      currentMembership={familyMembership}
    />
  )
}
