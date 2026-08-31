import { Pool } from 'pg'

export async function initDatabase() {
  if (!process.env.DATABASE_URL) {
    console.warn('DATABASE_URL is not defined. Skipping database initialization.')
    return
  }

  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
  })

  let client
  try {
    client = await pool.connect()
    // Create family_invites table if it doesn't exist
    await client.query(`
      CREATE TABLE IF NOT EXISTS family_invites (
        id TEXT PRIMARY KEY,
        "familyId" TEXT NOT NULL,
        email TEXT NOT NULL,
        "invitedBy" TEXT NOT NULL,
        status TEXT NOT NULL DEFAULT 'pending',
        "createdAt" TIMESTAMP NOT NULL DEFAULT NOW()
      )
    `)
    
    console.log('✓ Database tables initialized')
  } catch (error) {
    console.error('Error initializing database:', error)
  } finally {
    if (client) client.release()
    await pool.end()
  }
}

