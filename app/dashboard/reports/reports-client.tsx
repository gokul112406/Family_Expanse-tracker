'use client'

import { useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { DashboardHeader } from '@/components/dashboard/header'
import { DashboardSidebar } from '@/components/dashboard/sidebar'
import { SpendingChart } from '@/components/reports/spending-chart'
import { CategoryChart } from '@/components/reports/category-chart'
import { getReportSummary, getFamilyExpenses } from '@/app/actions/expenses'
import { formatCurrency } from '@/lib/utils/client'
import { Download } from 'lucide-react'

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

export function ReportsClient({
  family,
  currentUser,
  currentMembership,
}: {
  family: Family
  currentUser: User
  currentMembership: Membership
}) {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [timeRange, setTimeRange] = useState<'week' | 'month' | 'year'>('month')
  const [summary, setSummary] = useState({ total: 0, count: 0, average: 0 })
  const [exporting, setExporting] = useState(false)

  useEffect(() => {
    async function loadSummary() {
      try {
        const result = await getReportSummary(family.id, timeRange)
        setSummary(result)
      } catch {
        setSummary({ total: 0, count: 0, average: 0 })
      }
    }
    loadSummary()
  }, [family.id, timeRange])

  const handleExportCSV = async () => {
    try {
      setExporting(true)
      
      // Get date range based on timeRange
      const now = new Date()
      let startDate: Date
      
      if (timeRange === 'week') {
        startDate = new Date(now)
        startDate.setDate(now.getDate() - 6)
        startDate.setHours(0, 0, 0, 0)
      } else if (timeRange === 'month') {
        startDate = new Date(now.getFullYear(), now.getMonth(), 1)
      } else {
        startDate = new Date(now.getFullYear(), 0, 1)
      }
      
      // Fetch expenses
      const expenses = await getFamilyExpenses(family.id, startDate, now)
      
      // Create CSV content
      const headers = ['Date', 'Description', 'Amount', 'Currency', 'Payment Method', 'Category']
      const rows = expenses.map(expense => [
        new Date(expense.date).toLocaleDateString('en-US'),
        (expense.description || 'Expense').replace(/"/g, '""'),
        expense.amount,
        expense.currency,
        expense.paymentMethod || 'N/A',
        expense.categoryId
      ])
      
      const csvContent = [
        headers.join(','),
        ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
      ].join('\r\n')
      
      // Add BOM for Excel compatibility
      const BOM = '\uFEFF'
      const csvWithBOM = BOM + csvContent
      
      // Download CSV
      const blob = new Blob([csvWithBOM], { type: 'text/csv;charset=utf-8;' })
      const url = window.URL.createObjectURL(blob)
      const link = document.createElement('a')
      
      link.href = url
      link.download = `family-expenses-${timeRange}-${new Date().toISOString().split('T')[0]}.csv`
      link.style.display = 'none'
      
      document.body.appendChild(link)
      link.click()
      
      // Cleanup
      setTimeout(() => {
        document.body.removeChild(link)
        window.URL.revokeObjectURL(url)
      }, 100)
      
    } catch (error) {
      console.error('Error exporting CSV:', error)
      alert('Failed to export CSV. Please try again.')
    } finally {
      setExporting(false)
    }
  }

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
                <h1 className="text-3xl font-bold text-foreground">Reports</h1>
                <p className="text-muted-foreground">Analyze your family spending</p>
              </div>
              <Button variant="outline" className="gap-2" onClick={handleExportCSV} disabled={exporting}>
                <Download className="w-4 h-4" />
                {exporting ? 'Exporting...' : 'Export CSV'}
              </Button>
            </div>

            <div className="flex gap-2 mb-8">
              {(['week', 'month', 'year'] as const).map((range) => (
                <Button
                  key={range}
                  variant={timeRange === range ? 'default' : 'outline'}
                  onClick={() => setTimeRange(range)}
                  className="capitalize"
                >
                  {range}
                </Button>
              ))}
            </div>

            <div className="grid grid-cols-1 gap-6">
              <Card className="p-6">
                <h2 className="text-xl font-semibold text-foreground mb-6">Spending Trend</h2>
                <SpendingChart
                  familyId={family.id}
                  timeRange={timeRange}
                  currency={family.currency}
                />
              </Card>

              <Card className="p-6">
                <h2 className="text-xl font-semibold text-foreground mb-4">By Category</h2>
                <CategoryChart
                  familyId={family.id}
                  timeRange={timeRange}
                  currency={family.currency}
                />
              </Card>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-8">
              <Card className="p-6">
                <h3 className="text-sm font-medium text-muted-foreground mb-1">Total Spending</h3>
                <p className="text-3xl font-bold text-foreground">
                  {formatCurrency(summary.total, family.currency)}
                </p>
              </Card>
              <Card className="p-6">
                <h3 className="text-sm font-medium text-muted-foreground mb-1">Average Expense</h3>
                <p className="text-3xl font-bold text-foreground">
                  {formatCurrency(summary.average, family.currency)}
                </p>
              </Card>
              <Card className="p-6">
                <h3 className="text-sm font-medium text-muted-foreground mb-1">Transactions</h3>
                <p className="text-3xl font-bold text-foreground">{summary.count}</p>
              </Card>
            </div>
          </div>
        </main>
      </div>
    </div>
  )
}
