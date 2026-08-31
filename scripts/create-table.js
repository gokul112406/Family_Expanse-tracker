const { Pool } = require('pg')
require('dotenv').config()

async function createTable() {
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
  })

  try {
    const client = await pool.connect()
    
    console.log('Creating family_invites table...')
    
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
    
    console.log('✓ family_invites table created successfully')
    
    // Verify the table exists
    const result = await client.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_name = 'family_invites'
    `)
    
    if (result.rows.length > 0) {
      console.log('✓ Verified: family_invites table exists')
    }
    
    client.release()
    await pool.end()
    process.exit(0)
  } catch (error) {
    console.error('Error creating table:', error)
    process.exit(1)
  }
}

createTable()
