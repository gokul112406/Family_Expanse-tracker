import { redirect } from 'next/navigation'
import { headers } from 'next/headers'
import { auth } from '@/lib/auth'
import { db } from '@/lib/db'
import { familyMembers, families as familiesTable } from '@/lib/db/schema'
import { eq } from 'drizzle-orm'
import { SettingsClient } from './settings-client'

export const metadata = {
  title: 'Settings | Family Expense Tracker',
  description: 'Manage your family and account settings',
}

export default async function SettingsPage() {
  const session = await auth.api.getSession({ headers: await headers() })

  if (!session?.user) {
    redirect('/sign-in')
  }

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
    <SettingsClient
      family={family[0]}
      currentUser={session.user}
      currentMembership={familyMembership}
    />
  )
}
