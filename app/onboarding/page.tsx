import { redirect } from 'next/navigation'
import { headers } from 'next/headers'
import { auth } from '@/lib/auth'
import { OnboardingClient } from './onboarding-client'

export const metadata = {
  title: 'Get Started | Family Expense Tracker',
  description: 'Create or join a family to start tracking expenses',
}

export default async function OnboardingPage() {
  const session = await auth.api.getSession({ headers: await headers() })

  if (!session?.user) {
    redirect('/sign-in')
  }

  return <OnboardingClient user={session.user} />
}
