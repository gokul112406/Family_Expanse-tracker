'use server'

import { db } from '@/lib/db'
import { notifications } from '@/lib/db/schema'
import { eq, and } from 'drizzle-orm'
import { getUserId } from '@/lib/utils/server'
import { generateId } from '@/lib/utils/client'

export async function createNotification(
  userId: string,
  familyId: string | null,
  type: string,
  title: string,
  message?: string,
  relatedId?: string
) {
  const notificationId = generateId()
  
  await db.insert(notifications).values({
    id: notificationId,
    userId,
    familyId,
    type,
    title,
    message,
    relatedId,
  })
  
  return { id: notificationId }
}

export async function getUserNotifications(limit: number = 10) {
  const userId = await getUserId()
  
  const result = await db
    .select()
    .from(notifications)
    .where(eq(notifications.userId, userId))
    .limit(limit)
  
  return result
}

export async function markNotificationAsRead(notificationId: string) {
  const userId = await getUserId()
  
  await db
    .update(notifications)
    .set({ isRead: true })
    .where(
      and(
        eq(notifications.id, notificationId),
        eq(notifications.userId, userId)
      )
    )
  
  return { success: true }
}

export async function markAllAsRead() {
  const userId = await getUserId()
  
  await db
    .update(notifications)
    .set({ isRead: true })
    .where(eq(notifications.userId, userId))
  
  return { success: true }
}

export async function deleteNotification(notificationId: string) {
  const userId = await getUserId()
  
  await db
    .delete(notifications)
    .where(
      and(
        eq(notifications.id, notificationId),
        eq(notifications.userId, userId)
      )
    )
  
  return { success: true }
}
