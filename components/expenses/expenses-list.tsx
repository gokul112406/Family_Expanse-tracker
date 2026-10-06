'use client'

import { useEffect, useState } from 'react'
import { getFamilyExpenses } from '@/app/actions/expenses'
import { Card } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { formatCurrency } from '@/lib/utils/client'

interface ExpensesListProps {
  familyId: string
}

interface Expense {
  id: string
  familyId: string | null
  userId: string
  categoryId: string | null
  amount: number | string
  currency: string
  description: string | null
  paymentMethod: string | null
  receiptUrl: string | null
  date: Date
  createdAt: Date
  updatedAt: Date
  userName?: string | null
  userEmail?: string | null
  userImage?: string | null
}

export function ExpensesList({ familyId }: ExpensesListProps) {
  const [expenses, setExpenses] = useState<Expense[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function loadExpenses() {
      try {
        setLoading(true)
        const result = await getFamilyExpenses(familyId)
        setExpenses(result)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load expenses')
      } finally {
        setLoading(false)
      }
    }

    loadExpenses()
  }, [familyId])

  if (loading) {
    return (
      <div className="space-y-2">
        {[...Array(3)].map((_, i) => (
          <Skeleton key={i} className="h-16" />
        ))}
      </div>
    )
  }

  if (error) {
    return (
      <Card className="p-4 text-center text-destructive">
        {error}
      </Card>
    )
  }

  if (expenses.length === 0) {
    return (
      <Card className="p-8 text-center">
        <p className="text-muted-foreground">No expenses yet</p>
        <p className="text-sm text-muted-foreground mt-1">
          Create your first expense to get started
        </p>
      </Card>
    )
  }

  return (
    <div className="space-y-2">
      {expenses.map((expense) => {
        const displayName = expense.userName || expense.userEmail?.split('@')[0] || 'Member'
        const initials = displayName.charAt(0).toUpperCase()

        return (
          <Card key={expense.id} className="p-4 flex items-center justify-between hover:bg-accent/50 transition-colors">
            <div className="flex items-center gap-3 flex-1 min-w-0">
              <div 
                className="w-10 h-10 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold text-sm shrink-0 border border-primary/20"
                title={`Paid by ${displayName}`}
              >
                {initials}
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <p className="font-medium text-foreground truncate">
                    {expense.description || 'Expense'}
                  </p>
                  <span className="text-xs px-2 py-0.5 rounded-full bg-secondary text-secondary-foreground font-medium">
                    Paid by <strong className="font-semibold text-foreground">{displayName}</strong>
                  </span>
                </div>
                <p className="text-sm text-muted-foreground">
                  {new Date(expense.date).toLocaleDateString()} • {expense.paymentMethod || 'cash'}
                </p>
              </div>
            </div>
            <div className="text-right shrink-0 ml-4">
              <p className="font-semibold text-foreground text-base">
                -{formatCurrency(Number(expense.amount), expense.currency)}
              </p>
            </div>
          </Card>
        )
      })}
    </div>
  )
}

