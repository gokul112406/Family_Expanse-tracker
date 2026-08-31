'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { DashboardHeader } from '@/components/dashboard/header'
import { DashboardSidebar } from '@/components/dashboard/sidebar'
import { ExpensesList } from '@/components/expenses/expenses-list'
import { CreateExpenseDialog } from '@/components/expenses/create-expense-dialog'
import { Plus, Filter } from 'lucide-react'

interface User {
  id: string
  name?: string | null
  email: string
}

interface Family {
  id: string
  name: string
  currency: string
}

interface Membership {
  id: string
  familyId: string
  userId: string
  role: string
}

export function ExpensesClient({
  family,
  currentUser,
  currentMembership,
}: {
  family: Family
  currentUser: User
  currentMembership: Membership
}) {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [showAddExpense, setShowAddExpense] = useState(false)
  const [filterMonth, setFilterMonth] = useState(new Date().toISOString().slice(0, 7))

  return (
    <div className="flex h-screen bg-background">
      <DashboardSidebar
        family={family}
        user={currentUser}
        membership={currentMembership}
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
      />

      <div className="flex-1 flex flex-col overflow-hidden">
        <DashboardHeader
          family={family}
          user={currentUser}
          onMenuClick={() => setSidebarOpen(!sidebarOpen)}
        />

        <main className="flex-1 overflow-auto">
          <div className="p-6 max-w-7xl mx-auto">
            <div className="flex items-center justify-between mb-8">
              <div>
                <h1 className="text-3xl font-bold text-foreground">Expenses</h1>
                <p className="text-muted-foreground">Track all family expenses</p>
              </div>
              <Button
                onClick={() => setShowAddExpense(true)}
                className="gap-2"
                size="lg"
              >
                <Plus className="w-4 h-4" />
                Add Expense
              </Button>
            </div>

            {/* Filter Section */}
            <Card className="p-4 mb-6">
              <div className="flex items-center gap-4">
                <Filter className="w-4 h-4 text-muted-foreground" />
                <div className="flex-1">
                  <label className="text-sm font-medium text-foreground">Filter by Month</label>
                  <Input
                    type="month"
                    value={filterMonth}
                    onChange={(e) => setFilterMonth(e.target.value)}
                    className="mt-1"
                  />
                </div>
              </div>
            </Card>

            {/* Expenses List */}
            <ExpensesList familyId={family.id} />
          </div>
        </main>
      </div>

      {/* Add Expense Dialog */}
      {showAddExpense && (
        <CreateExpenseDialog
          familyId={family.id}
          onClose={() => setShowAddExpense(false)}
        />
      )}
    </div>
  )
}
