'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { DashboardHeader } from '@/components/dashboard/header'
import { DashboardSidebar } from '@/components/dashboard/sidebar'
import { ExpensesList } from '@/components/expenses/expenses-list'
import { CreateExpenseDialog } from '@/components/expenses/create-expense-dialog'
import { getSpendingByMember } from '@/app/actions/expenses'
import { formatCurrency } from '@/lib/utils/client'
import { Plus, Filter, Users, Wallet } from 'lucide-react'

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

interface MemberSpending {
  userId: string
  name: string
  email: string | null
  image: string | null
  total: number
  count: number
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
  const [memberSpending, setMemberSpending] = useState<MemberSpending[]>([])
  const [loadingMembers, setLoadingMembers] = useState(true)

  useEffect(() => {
    async function loadMemberSpending() {
      try {
        setLoadingMembers(true)
        const [yearStr, monthStr] = filterMonth.split('-')
        const year = parseInt(yearStr, 10)
        const month = parseInt(monthStr, 10) - 1
        const start = new Date(year, month, 1)
        const end = new Date(year, month + 1, 0, 23, 59, 59, 999)

        const data = await getSpendingByMember(family.id, start, end)
        setMemberSpending(data)
      } catch (err) {
        console.error('Failed to load member spending:', err)
      } finally {
        setLoadingMembers(false)
      }
    }

    loadMemberSpending()
  }, [family.id, filterMonth, showAddExpense])

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

            {/* Member Spending Breakdown */}
            <div className="mb-8">
              <div className="flex items-center gap-2 mb-3">
                <Users className="w-5 h-5 text-primary" />
                <h2 className="text-xl font-semibold text-foreground">Spending by Member</h2>
                <span className="text-xs text-muted-foreground ml-auto">
                  {filterMonth ? `For ${new Date(filterMonth + '-01').toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}` : 'All Time'}
                </span>
              </div>

              {loadingMembers ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                  {[...Array(3)].map((_, i) => (
                    <Card key={i} className="p-4 animate-pulse">
                      <div className="h-4 bg-muted rounded w-2/3 mb-2"></div>
                      <div className="h-6 bg-muted rounded w-1/2"></div>
                    </Card>
                  ))}
                </div>
              ) : memberSpending.length === 0 ? (
                <Card className="p-4 text-center text-sm text-muted-foreground">
                  No member expenses recorded for this month
                </Card>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                  {memberSpending.map((member) => {
                    const initials = (member.name || 'M').charAt(0).toUpperCase()
                    return (
                      <Card key={member.userId} className="p-4 hover:shadow-md transition-shadow">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold text-sm shrink-0 border border-primary/20">
                            {initials}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-semibold text-foreground truncate" title={member.name}>
                              {member.name}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {member.count} {member.count === 1 ? 'expense' : 'expenses'}
                            </p>
                          </div>
                          <div className="text-right shrink-0">
                            <p className="text-base font-bold text-foreground">
                              {formatCurrency(member.total, family.currency)}
                            </p>
                            <span className="text-[11px] text-muted-foreground">total spent</span>
                          </div>
                        </div>
                      </Card>
                    )
                  })}
                </div>
              )}
            </div>

            {/* Expenses List */}
            <div>
              <h2 className="text-xl font-semibold text-foreground mb-4">All Expenses</h2>
              <ExpensesList familyId={family.id} />
            </div>
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
