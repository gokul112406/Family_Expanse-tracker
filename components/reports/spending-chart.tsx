'use client'

import { useEffect, useState } from 'react'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'
import { getSpendingTrend } from '@/app/actions/expenses'
import { formatCurrency } from '@/lib/utils/client'
import { Skeleton } from '@/components/ui/skeleton'

interface SpendingChartProps {
  familyId: string
  timeRange: 'week' | 'month' | 'year'
  currency?: string
}

export function SpendingChart({ familyId, timeRange, currency = 'INR' }: SpendingChartProps) {
  const [data, setData] = useState<{ name: string; value: number }[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function loadData() {
      setLoading(true)
      try {
        const result = await getSpendingTrend(familyId, timeRange)
        setData(result)
      } catch {
        setData([])
      } finally {
        setLoading(false)
      }
    }
    loadData()
  }, [familyId, timeRange])

  if (loading) {
    return <Skeleton className="h-[250px] w-full" />
  }

  if (data.every((d) => d.value === 0)) {
    return (
      <div className="h-[250px] flex items-center justify-center text-muted-foreground text-sm">
        No spending data for this period
      </div>
    )
  }

  return (
    <ResponsiveContainer width="100%" height={250}>
        <LineChart data={data}>
          <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
          <XAxis dataKey="name" tick={{ fill: 'var(--foreground)', fontSize: 12 }} />
          <YAxis tick={{ fill: 'var(--foreground)', fontSize: 12 }} />
          <Tooltip
            formatter={(value: any) => [formatCurrency(Number(value || 0), currency), 'Spent']}
            contentStyle={{
              backgroundColor: 'var(--popover)',
              border: '1px solid var(--border)',
              borderRadius: '8px',
              color: 'var(--foreground)',
            }}
          />
          <Line
            type="monotone"
            dataKey="value"
            stroke="var(--primary)"
            strokeWidth={2}
            dot={{ fill: 'var(--primary)', r: 4 }}
            activeDot={{ r: 6 }}
          />
        </LineChart>
      </ResponsiveContainer>
  )
}
