'use server'

import { db } from '@/lib/db'
import { families, familyMembers, familyInvites, user } from '@/lib/db/schema'
import { createNotification } from '@/app/actions/notifications'
import { eq, and } from 'drizzle-orm'
import { revalidatePath } from 'next/cache'
import { getUserId } from '@/lib/utils/server'
import { generateId } from '@/lib/utils/client'

export async function createFamily(name: string, description?: string) {
  const userId = await getUserId()
  
  const familyId = generateId()
  
  // Create family
  await db.insert(families).values({
    id: familyId,
    name,
    description,
    ownerId: userId,
    currency: 'INR',
  })
  
  // Add creator as admin member
  const memberId = generateId()
  await db.insert(familyMembers).values({
    id: memberId,
    familyId,
    userId,
    role: 'admin',
  })
  
  revalidatePath('/dashboard')
  return { id: familyId, name }
}

export async function addFamilyMember(familyId: string, inviteeEmail: string) {
  const userId = await getUserId()
  const normalizedEmail = inviteeEmail.trim().toLowerCase()

  if (!normalizedEmail || !normalizedEmail.includes('@')) {
    throw new Error('Please enter a valid email address')
  }

  const membership = await db
    .select()
    .from(familyMembers)
    .where(
      and(
        eq(familyMembers.familyId, familyId),
        eq(familyMembers.userId, userId)
      )
    )

  if (!membership[0] || membership[0].role !== 'admin') {
    throw new Error('Only admins can add members')
  }

  const family = await db
    .select()
    .from(families)
    .where(eq(families.id, familyId))

  const familyName = family[0]?.name ?? 'your family'

  const existingInvite = await db
    .select()
    .from(familyInvites)
    .where(
      and(
        eq(familyInvites.familyId, familyId),
        eq(familyInvites.email, normalizedEmail),
        eq(familyInvites.status, 'pending')
      )
    )

  if (existingInvite[0]) {
    throw new Error('An invite has already been sent to this email')
  }

  const inviteeUser = await db
    .select()
    .from(user)
    .where(eq(user.email, normalizedEmail))

  if (inviteeUser[0]) {
    const existing = await db
      .select()
      .from(familyMembers)
      .where(
        and(
          eq(familyMembers.familyId, familyId),
          eq(familyMembers.userId, inviteeUser[0].id)
        )
      )

    if (existing[0]) {
      throw new Error('User is already a member')
    }

    const memberId = generateId()
    await db.insert(familyMembers).values({
      id: memberId,
      familyId,
      userId: inviteeUser[0].id,
      role: 'member',
    })

    await createNotification(
      inviteeUser[0].id,
      familyId,
      'member_joined',
      `You've been added to ${familyName}`,
      `An admin added you to the family "${familyName}".`
    )

    revalidatePath('/dashboard')
    revalidatePath('/dashboard/members')
    return { success: true, type: 'added' as const }
  }

  const inviteId = generateId()
  await db.insert(familyInvites).values({
    id: inviteId,
    familyId,
    email: normalizedEmail,
    invitedBy: userId,
    status: 'pending',
  })

  revalidatePath('/dashboard/members')
  return { success: true, type: 'invited' as const }
}

export async function getFamilyPendingInvites(familyId: string) {
  const userId = await getUserId()

  const membership = await db
    .select()
    .from(familyMembers)
    .where(
      and(
        eq(familyMembers.familyId, familyId),
        eq(familyMembers.userId, userId)
      )
    )

  if (!membership[0]) {
    throw new Error('Not a member of this family')
  }

  return db
    .select()
    .from(familyInvites)
    .where(
      and(
        eq(familyInvites.familyId, familyId),
        eq(familyInvites.status, 'pending')
      )
    )
}

export async function getPendingInvitesForUser() {
  const userId = await getUserId()

  const currentUser = await db
    .select()
    .from(user)
    .where(eq(user.id, userId))

  if (!currentUser[0]) return []

  const invites = await db
    .select()
    .from(familyInvites)
    .where(
      and(
        eq(familyInvites.email, currentUser[0].email.toLowerCase()),
        eq(familyInvites.status, 'pending')
      )
    )

  const invitesWithFamily = await Promise.all(
    invites.map(async (invite) => {
      const family = await db
        .select()
        .from(families)
        .where(eq(families.id, invite.familyId))
      return { ...invite, familyName: family[0]?.name ?? 'Unknown' }
    })
  )

  return invitesWithFamily
}

export async function acceptFamilyInvite(inviteId: string) {
  const userId = await getUserId()

  const currentUser = await db
    .select()
    .from(user)
    .where(eq(user.id, userId))

  if (!currentUser[0]) {
    throw new Error('User not found')
  }

  const invite = await db
    .select()
    .from(familyInvites)
    .where(eq(familyInvites.id, inviteId))

  if (!invite[0] || invite[0].status !== 'pending') {
    throw new Error('Invite not found or already processed')
  }

  if (invite[0].email !== currentUser[0].email.toLowerCase()) {
    throw new Error('This invite is not for your account')
  }

  const existing = await db
    .select()
    .from(familyMembers)
    .where(
      and(
        eq(familyMembers.familyId, invite[0].familyId),
        eq(familyMembers.userId, userId)
      )
    )

  if (!existing[0]) {
    const memberId = generateId()
    await db.insert(familyMembers).values({
      id: memberId,
      familyId: invite[0].familyId,
      userId,
      role: 'member',
    })
  }

  await db
    .update(familyInvites)
    .set({ status: 'accepted' })
    .where(eq(familyInvites.id, inviteId))

  revalidatePath('/dashboard')
  revalidatePath('/dashboard/members')
  return { success: true }
}

export async function cancelFamilyInvite(inviteId: string) {
  const userId = await getUserId()

  const membership = await db
    .select()
    .from(familyMembers)
    .where(eq(familyMembers.userId, userId))

  const isAdmin = membership.some((m) => m.role === 'admin')
  if (!isAdmin) {
    throw new Error('Only admins can cancel invites')
  }

  await db
    .update(familyInvites)
    .set({ status: 'cancelled' })
    .where(eq(familyInvites.id, inviteId))

  revalidatePath('/dashboard/members')
  return { success: true }
}

export async function removeFamilyMember(familyId: string, memberId: string) {
  const userId = await getUserId()
  
  // Check if user is admin
  const membership = await db
    .select()
    .from(familyMembers)
    .where(
      and(
        eq(familyMembers.familyId, familyId),
        eq(familyMembers.userId, userId)
      )
    )
  
  if (!membership[0] || membership[0].role !== 'admin') {
    throw new Error('Only admins can remove members')
  }
  
  await db.delete(familyMembers).where(eq(familyMembers.id, memberId))
  
  revalidatePath('/dashboard')
  revalidatePath('/dashboard/members')
  return { success: true }
}

export async function leaveFamily(familyId: string) {
  const userId = await getUserId()
  
  const membership = await db
    .select()
    .from(familyMembers)
    .where(
      and(
        eq(familyMembers.familyId, familyId),
        eq(familyMembers.userId, userId)
      )
    )
  
  if (!membership[0]) {
    throw new Error('Not a member of this family')
  }
  
  await db.delete(familyMembers).where(eq(familyMembers.id, membership[0].id))
  
  revalidatePath('/dashboard')
  return { success: true }
}

export async function getFamilyMembers(familyId: string) {
  const userId = await getUserId()
  
  // Check membership
  const membership = await db
    .select()
    .from(familyMembers)
    .where(
      and(
        eq(familyMembers.familyId, familyId),
        eq(familyMembers.userId, userId)
      )
    )
  
  if (!membership[0]) {
    throw new Error('Not a member of this family')
  }
  
  const members = await db
    .select()
    .from(familyMembers)
    .where(eq(familyMembers.familyId, familyId))
  
  return members
}

export async function getUserFamilies() {
  const userId = await getUserId()
  
  const result = await db
    .select()
    .from(familyMembers)
    .where(eq(familyMembers.userId, userId))
  
  return result
}

export async function updateFamily(
  familyId: string,
  name: string,
  description: string | undefined,
  currency: string
) {
  const userId = await getUserId()

  // Check if user is admin
  const membership = await db
    .select()
    .from(familyMembers)
    .where(
      and(
        eq(familyMembers.familyId, familyId),
        eq(familyMembers.userId, userId)
      )
    )

  if (!membership[0] || membership[0].role !== 'admin') {
    throw new Error('Only admins can update family settings')
  }

  await db
    .update(families)
    .set({ name, description, currency, updatedAt: new Date() })
    .where(eq(families.id, familyId))

  revalidatePath('/dashboard/settings')
  revalidatePath('/dashboard')
  return { success: true }
}
