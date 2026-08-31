'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createFamily } from '@/app/actions/families'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card } from '@/components/ui/card'
import { Textarea } from '@/components/ui/textarea'

interface User {
  id: string
  name?: string | null
  email: string
}

export function OnboardingClient({ user }: { user: User }) {
  const router = useRouter()
  const [step, setStep] = useState<'welcome' | 'create'>('welcome')
  const [familyName, setFamilyName] = useState('')
  const [description, setDescription] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleCreateFamily = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!familyName.trim()) {
      setError('Family name is required')
      return
    }

    setLoading(true)
    setError(null)

    try {
      await createFamily(familyName, description || undefined)
      router.push('/dashboard')
      router.refresh()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create family')
      setLoading(false)
    }
  }

  if (step === 'welcome') {
    return (
      <main className="min-h-svh bg-background flex items-center justify-center px-4">
        <Card className="w-full max-w-lg p-8">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-foreground mb-2">
              Welcome to Budget Tracker
            </h1>
            <p className="text-muted-foreground">
              Hello, {user.name || user.email}! Let&apos;s get you started.
            </p>
          </div>

          <div className="space-y-4 mb-8">
            <div className="p-4 bg-accent rounded-lg">
              <h3 className="font-semibold text-foreground mb-1">Create a Family</h3>
              <p className="text-sm text-muted-foreground">
                Set up a family budget and invite others to join
              </p>
            </div>

            <div className="p-4 bg-accent rounded-lg">
              <h3 className="font-semibold text-foreground mb-1">Track Together</h3>
              <p className="text-sm text-muted-foreground">
                Share expenses, budgets, and track spending as a family
              </p>
            </div>

            <div className="p-4 bg-accent rounded-lg">
              <h3 className="font-semibold text-foreground mb-1">Insights</h3>
              <p className="text-sm text-muted-foreground">
                Get detailed reports and visualize your family spending
              </p>
            </div>
          </div>

          <Button
            onClick={() => setStep('create')}
            className="w-full"
            size="lg"
          >
            Create Family
          </Button>
        </Card>
      </main>
    )
  }

  return (
    <main className="min-h-svh bg-background flex items-center justify-center px-4">
      <Card className="w-full max-w-lg p-8">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-foreground mb-2">
            Create Your Family
          </h1>
          <p className="text-muted-foreground">
            Set up your family budget group
          </p>
        </div>

        <form onSubmit={handleCreateFamily} className="space-y-4">
          <div>
            <Label htmlFor="familyName">Family Name</Label>
            <Input
              id="familyName"
              value={familyName}
              onChange={(e) => setFamilyName(e.target.value)}
              placeholder="e.g., The Smiths"
              required
              autoFocus
            />
          </div>

          <div>
            <Label htmlFor="description">Description (optional)</Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="e.g., Our household budget"
              rows={3}
            />
          </div>

          {error && (
            <p className="text-sm text-destructive bg-destructive/10 p-2 rounded">
              {error}
            </p>
          )}

          <div className="flex gap-3">
            <Button
              type="button"
              variant="outline"
              onClick={() => setStep('welcome')}
              className="flex-1"
            >
              Back
            </Button>
            <Button type="submit" disabled={loading} className="flex-1">
              {loading ? 'Creating...' : 'Create Family'}
            </Button>
          </div>
        </form>
      </Card>
    </main>
  )
}
