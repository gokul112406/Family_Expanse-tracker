'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { authClient } from '@/lib/auth-client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'

export function AuthForm({ mode }: { mode: 'sign-in' | 'sign-up' }) {
  const router = useRouter()
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [googleLoading, setGoogleLoading] = useState(false)

  const isSignUp = mode === 'sign-up'

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setLoading(true)

    try {
      const result = isSignUp
        ? await authClient.signUp.email({ email, password, name })
        : await authClient.signIn.email({ email, password })

      if (result.error) {
        // Map common Better Auth error codes to friendly messages
        const code = (result.error as any)?.code || ''
        let message = result.error.message ?? 'Something went wrong'

        if (code === 'USER_ALREADY_EXISTS' || message?.toLowerCase().includes('already exists')) {
          message = 'An account with this email already exists. Please sign in instead.'
        } else if (code === 'INVALID_EMAIL_OR_PASSWORD' || message?.toLowerCase().includes('invalid')) {
          message = 'Incorrect email or password. Please try again.'
        } else if (code === 'USER_NOT_FOUND') {
          message = 'No account found with this email. Please sign up first.'
        } else if (!message || message === 'null') {
          message = isSignUp
            ? 'Could not create account. Please check your details and ensure the database is configured.'
            : 'Could not sign in. Please check your email and password.'
        }

        setError(message)
        setLoading(false)
        return
      }

      // Success — navigate to home which redirects to dashboard
      router.push('/')
      router.refresh()
    } catch (err: any) {
      const message = err?.message || ''
      if (message.includes('fetch') || message.includes('network') || message.includes('Failed to fetch')) {
        setError('Cannot connect to database/server. Please make sure DATABASE_URL is configured in your Vercel Environment Variables.')
      } else {
        setError('An unexpected error occurred. Please try again.')
      }
      setLoading(false)
    }
  }

  const handleGoogleSignIn = async () => {
    setGoogleLoading(true)
    setError(null)
    try {
      const res = await authClient.signIn.social({
        provider: 'google',
        callbackURL: '/',
      })

      if (res?.error) {
        const msg = res.error.message || ''
        if (msg.toLowerCase().includes('not configured') || msg.toLowerCase().includes('provider')) {
          setError('Google Sign-In is not configured yet. Please add GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET in your Vercel Project Settings > Environment Variables.')
        } else {
          setError(msg || 'Failed to sign in with Google. Please check your Google OAuth credentials in Vercel Environment Variables.')
        }
        setGoogleLoading(false)
      } else if (res?.data?.url) {
        window.location.href = res.data.url
      }
    } catch (err: any) {
      const message = err?.message || ''
      if (message.includes('fetch') || message.includes('network')) {
        setError('Cannot connect to the server. Make sure the dev server is running.')
      } else {
        setError(message || 'Failed to sign in with Google. Check your GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET.')
      }
      setGoogleLoading(false)
    }
  }

  return (
    <main className="min-h-svh bg-background flex items-center justify-center px-4">
      <Card className="w-full max-w-sm p-6">
        <div className="mb-6">
          <h1 className="text-2xl font-semibold tracking-tight text-foreground">
            {isSignUp ? 'Create an account' : 'Welcome back'}
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            {isSignUp
              ? 'Join your family budget tracker'
              : 'Sign in to manage your family expenses'}
          </p>
        </div>

        <div className="flex flex-col gap-4">
          {/* Google Sign-In Button */}
          <Button
            type="button"
            variant="outline"
            onClick={handleGoogleSignIn}
            disabled={googleLoading || loading}
            className="w-full"
          >
            {googleLoading ? (
              'Connecting...'
            ) : (
              <>
                <svg className="w-4 h-4 mr-2" viewBox="0 0 24 24">
                  <path
                    fill="currentColor"
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  />
                  <path
                    fill="currentColor"
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  />
                  <path
                    fill="currentColor"
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                  />
                  <path
                    fill="currentColor"
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                  />
                </svg>
                Sign in with Google
              </>
            )}
          </Button>

          <Separator className="my-2" />

          {/* Email/Password Form */}
          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            {isSignUp && (
              <div className="flex flex-col gap-2">
                <Label htmlFor="name">Full Name</Label>
                <Input
                  id="name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required={isSignUp}
                  autoComplete="name"
                  placeholder="John Doe"
                />
              </div>
            )}
            <div className="flex flex-col gap-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                autoComplete="email"
                placeholder="you@example.com"
              />
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={8}
                autoComplete={isSignUp ? 'new-password' : 'current-password'}
                placeholder="••••••••"
              />
              {isSignUp && (
                <p className="text-xs text-muted-foreground">Minimum 8 characters</p>
              )}
            </div>

            {error && (
              <p className="text-sm text-destructive bg-destructive/10 p-3 rounded-md border border-destructive/20" role="alert">
                {error}
              </p>
            )}

            <Button type="submit" disabled={loading || googleLoading} className="w-full">
              {loading
                ? 'Please wait...'
                : isSignUp
                  ? 'Create account'
                  : 'Sign in'}
            </Button>
          </form>
        </div>

        <p className="text-sm text-muted-foreground text-center mt-6">
          {isSignUp ? 'Already have an account? ' : "Don't have an account? "}
          <Link
            href={isSignUp ? '/sign-in' : '/sign-up'}
            className="text-foreground font-medium underline-offset-4 hover:underline"
          >
            {isSignUp ? 'Sign in' : 'Sign up'}
          </Link>
        </p>
      </Card>
    </main>
  )
}
