'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { DashboardHeader } from '@/components/dashboard/header'
import { DashboardSidebar } from '@/components/dashboard/sidebar'
import { ExpensesList } from '@/components/expenses/expenses-list'
import { CreateExpenseDialog } from '@/components/expenses/create-expense-dialog'
import { getReportSummary } from '@/app/actions/expenses'
import { formatCurrency } from '@/lib/utils/client'
import { Plus } from 'lucide-react'

interface Family {
  id: string
  name: string
  currency: string
}

interface FamilyMember {
  id: string
  familyId: string
  userId: string
  role: string
}

interface User {
  id: string
  name?: string | null
  email: string
}

export function DashboardClient({
  user,
  family,
  membership,
  memberCount = 1,
}: {
  user: User
  family: Family
  membership: FamilyMember
  memberCount?: number
}) {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [showAddExpense, setShowAddExpense] = useState(false)
  const [monthlyTotal, setMonthlyTotal] = useState(0)

  useEffect(() => {
    async function loadSummary() {
      try {
        const result = await getReportSummary(family.id, 'month')
        setMonthlyTotal(result.total)
      } catch {
        setMonthlyTotal(0)
      }
    }
    loadSummary()
  }, [family.id])

  return (
    <div className="flex h-screen bg-background">
      <DashboardSidebar
        family={family}
        user={user}
        membership={membership}
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
      />

      <div className="flex-1 flex flex-col overflow-hidden">
        <DashboardHeader
          family={family}
          user={user}
          onMenuClick={() => setSidebarOpen(!sidebarOpen)}
        />

        <main className="flex-1 overflow-auto">
          <div className="p-6 max-w-7xl mx-auto">
            <div className="mb-8">
              <h1 className="text-3xl font-bold text-foreground mb-2">
                Welcome, {user.name || user.email}
              </h1>
              <p className="text-muted-foreground">
                Manage expenses for <span className="font-semibold">{family.name}</span>
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
              <Card className="p-4 cursor-pointer hover:shadow-lg transition-shadow">
                <h3 className="font-semibold text-sm mb-1">Total Spending</h3>
                <p className="text-2xl font-bold text-foreground">
                  {formatCurrency(monthlyTotal, family.currency)}
                </p>
                <p className="text-xs text-muted-foreground mt-1">This month</p>
              </Card>
              <Card className="p-4 cursor-pointer hover:shadow-lg transition-shadow">
                <h3 className="font-semibold text-sm mb-1">Members</h3>
                <p className="text-2xl font-bold text-foreground">{memberCount}</p>
                <p className="text-xs text-muted-foreground mt-1">In this family</p>
              </Card>
              <Card className="p-4 cursor-pointer hover:shadow-lg transition-shadow">
                <h3 className="font-semibold text-sm mb-1">Budget Status</h3>
                <p className="text-2xl font-bold text-foreground">No budget</p>
                <p className="text-xs text-muted-foreground mt-1">Set one to get started</p>
              </Card>
            </div>

            <div className="mb-6">
              <Button
                onClick={() => setShowAddExpense(true)}
                size="lg"
                className="gap-2"
              >
                <Plus className="w-4 h-4" />
                Add Expense
              </Button>
            </div>

            <div>
              <h2 className="text-xl font-bold text-foreground mb-4">Recent Expenses</h2>
              <ExpensesList familyId={family.id} />
            </div>
          </div>
        </main>
      </div>

      {showAddExpense && (
        <CreateExpenseDialog
          familyId={family.id}
          onClose={() => setShowAddExpense(false)}
        />
      )}
    </div>
  )
}
