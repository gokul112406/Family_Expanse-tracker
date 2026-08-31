'use client'

import { createAuthClient } from 'better-auth/react'

// When baseURL is omitted, better-auth/react uses relative URLs which works
// correctly for both local dev and production deployments automatically.
// Only set NEXT_PUBLIC_APP_URL if you need to call auth from a different domain.
export const authClient = createAuthClient({
  baseURL: process.env.NEXT_PUBLIC_APP_URL,
})

export const { signIn, signUp, signOut, useSession } = authClient
