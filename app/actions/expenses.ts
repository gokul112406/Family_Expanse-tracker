'use server'

import { db } from '@/lib/db'
import { expenses, expenseCategories, familyMembers, families } from '@/lib/db/schema'
import { eq, and, gte, lte, desc, sql } from 'drizzle-orm'
import { revalidatePath } from 'next/cache'
import { getUserId } from '@/lib/utils/server'
import { generateId } from '@/lib/utils/client'
import { getCategoryLabel } from '@/lib/constants/categories'

export async function createExpense(
  familyId: string,
  categoryId: string,
  amount: string,
  description: string,
  paymentMethod: string,
  date: Date,
  receiptUrl?: string
) {
  const userId = await getUserId()
  
  // Verify membership
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

  const family = await db
    .select()
    .from(families)
    .where(eq(families.id, familyId))

  const expenseId = generateId()

  await db.insert(expenses).values({
    id: expenseId,
    familyId,
    userId,
    categoryId,
    amount: String(amount),
    currency: family[0]?.currency ?? 'INR',
    description,
    paymentMethod,
    date,
    receiptUrl,
  })
  
  revalidatePath('/dashboard')
  return { id: expenseId }
}

export async function updateExpense(
  expenseId: string,
  categoryId: string,
  amount: string,
  description: string,
  paymentMethod: string,
  date: Date,
  receiptUrl?: string
) {
  const userId = await getUserId()
  
  // Check ownership
  const expense = await db
    .select()
    .from(expenses)
    .where(
      and(
        eq(expenses.id, expenseId),
        eq(expenses.userId, userId)
      )
    )
  
  if (!expense[0]) {
    throw new Error('Expense not found or you do not have permission to edit it')
  }
  
  await db
    .update(expenses)
    .set({
      categoryId,
      amount: String(amount),
      description,
      paymentMethod,
      date,
      receiptUrl,
      updatedAt: new Date(),
    })
    .where(eq(expenses.id, expenseId))
  
  revalidatePath('/dashboard')
  return { success: true }
}

export async function deleteExpense(expenseId: string) {
  const userId = await getUserId()
  
  // Check ownership
  const expense = await db
    .select()
    .from(expenses)
    .where(
      and(
        eq(expenses.id, expenseId),
        eq(expenses.userId, userId)
      )
    )
  
  if (!expense[0]) {
    throw new Error('Expense not found or you do not have permission to delete it')
  }
  
  await db.delete(expenses).where(eq(expenses.id, expenseId))
  
  revalidatePath('/dashboard')
  return { success: true }
}

export async function getFamilyExpenses(
  familyId: string,
  startDate?: Date,
  endDate?: Date
) {
  const userId = await getUserId()
  
  // Verify membership
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
  
  const conditions = [eq(expenses.familyId, familyId)]
  
  if (startDate) {
    conditions.push(gte(expenses.date, startDate))
  }
  
  if (endDate) {
    conditions.push(lte(expenses.date, endDate))
  }
  
  const result = await db
    .select()
    .from(expenses)
    .where(and(...conditions))
    .orderBy(desc(expenses.createdAt))
  
  return result
}

export async function getUserExpenses(
  familyId: string,
  startDate?: Date,
  endDate?: Date
) {
  const userId = await getUserId()
  
  // Verify membership
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
  
  const conditions = [
    eq(expenses.familyId, familyId),
    eq(expenses.userId, userId),
  ]
  
  if (startDate) {
    conditions.push(gte(expenses.date, startDate))
  }
  
  if (endDate) {
    conditions.push(lte(expenses.date, endDate))
  }
  
  const result = await db
    .select()
    .from(expenses)
    .where(and(...conditions))
    .orderBy(desc(expenses.date))
  
  return result
}

export async function getExpensesByCategory(
  familyId: string,
  startDate?: Date,
  endDate?: Date
) {
  const userId = await getUserId()
  
  // Verify membership
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
  
  const conditions = [eq(expenses.familyId, familyId)]
  
  if (startDate) {
    conditions.push(gte(expenses.date, startDate))
  }
  
  if (endDate) {
    conditions.push(lte(expenses.date, endDate))
  }
  
  // Group by category and sum amounts
  const result = await db
    .select({
      categoryId: expenses.categoryId,
      total: sql<string>`sum(${expenses.amount})`,
    })
    .from(expenses)
    .where(and(...conditions))
    .groupBy(expenses.categoryId)

  return result.map((row) => ({
    name: getCategoryLabel(row.categoryId),
    value: Number(row.total),
  }))
}

export async function getSpendingTrend(
  familyId: string,
  range: 'week' | 'month' | 'year'
) {
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

  const now = new Date()
  let startDate: Date

  if (range === 'week') {
    startDate = new Date(now)
    startDate.setDate(now.getDate() - 6)
    startDate.setHours(0, 0, 0, 0)
  } else if (range === 'month') {
    startDate = new Date(now.getFullYear(), now.getMonth(), 1)
  } else {
    startDate = new Date(now.getFullYear(), 0, 1)
  }

  const expenseList = await db
    .select()
    .from(expenses)
    .where(
      and(
        eq(expenses.familyId, familyId),
        gte(expenses.date, startDate),
        lte(expenses.date, now)
      )
    )

  const buckets = new Map<string, number>()

  if (range === 'week') {
    for (let i = 6; i >= 0; i--) {
      const d = new Date(now)
      d.setDate(now.getDate() - i)
      const key = d.toLocaleDateString('en-IN', { weekday: 'short' })
      buckets.set(key, 0)
    }
    for (const expense of expenseList) {
      const d = new Date(expense.date)
      const key = d.toLocaleDateString('en-IN', { weekday: 'short' })
      if (buckets.has(key)) {
        buckets.set(key, (buckets.get(key) ?? 0) + Number(expense.amount))
      }
    }
  } else if (range === 'month') {
    const daysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate()
    for (let day = 1; day <= daysInMonth; day++) {
      buckets.set(String(day), 0)
    }
    for (const expense of expenseList) {
      const d = new Date(expense.date)
      if (d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear()) {
        const key = String(d.getDate())
        buckets.set(key, (buckets.get(key) ?? 0) + Number(expense.amount))
      }
    }
  } else {
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
    for (const month of months) {
      buckets.set(month, 0)
    }
    for (const expense of expenseList) {
      const d = new Date(expense.date)
      if (d.getFullYear() === now.getFullYear()) {
        const key = months[d.getMonth()]
        buckets.set(key, (buckets.get(key) ?? 0) + Number(expense.amount))
      }
    }
  }

  return Array.from(buckets.entries()).map(([name, value]) => ({ name, value }))
}

export async function getReportSummary(
  familyId: string,
  range: 'week' | 'month' | 'year'
) {
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

  const now = new Date()
  let startDate: Date

  if (range === 'week') {
    startDate = new Date(now)
    startDate.setDate(now.getDate() - 6)
    startDate.setHours(0, 0, 0, 0)
  } else if (range === 'month') {
    startDate = new Date(now.getFullYear(), now.getMonth(), 1)
  } else {
    startDate = new Date(now.getFullYear(), 0, 1)
  }

  const expenseList = await db
    .select()
    .from(expenses)
    .where(
      and(
        eq(expenses.familyId, familyId),
        gte(expenses.date, startDate),
        lte(expenses.date, now)
      )
    )

  const total = expenseList.reduce((sum, e) => sum + Number(e.amount), 0)
  const count = expenseList.length
  const average = count > 0 ? total / count : 0

  return { total, count, average }
}
