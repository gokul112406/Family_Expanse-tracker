import { sql } from 'drizzle-orm'
import { db } from './index'

export async function ensureTables() {
  try {
    // Check if family_invites table exists, create if not
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS family_invites (
        id TEXT PRIMARY KEY,
        "familyId" TEXT NOT NULL,
        email TEXT NOT NULL,
        "invitedBy" TEXT NOT NULL,
        status TEXT NOT NULL DEFAULT 'pending',
        "createdAt" TIMESTAMP NOT NULL DEFAULT NOW()
      )
    `)
    
    console.log('✓ family_invites table ensured')
  } catch (error) {
    console.error('Error ensuring tables:', error)
    throw error
  }
}
