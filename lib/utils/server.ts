'use server'

import { auth } from '@/lib/auth'
import { db } from '@/lib/db'
import { familyMembers } from '@/lib/db/schema'
import { eq } from 'drizzle-orm'
import { headers } from 'next/headers'

export async function getUserId() {
  const session = await auth.api.getSession({ headers: await headers() })
  if (!session?.user) throw new Error('Unauthorized')
  return session.user.id
}

export async function getUser() {
  const session = await auth.api.getSession({ headers: await headers() })
  if (!session?.user) throw new Error('Unauthorized')
  return session.user
}

export async function getUserFamily() {
  const userId = await getUserId()
  const result = await db
    .select()
    .from(familyMembers)
    .where(eq(familyMembers.userId, userId))
    .limit(1)
  return result[0] || null
}
