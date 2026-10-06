import { Pool } from 'pg'

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
})

async function fix() {
  const client = await pool.connect()
  try {
    // List all FK constraints on expenses table
    const res = await client.query(
      `SELECT conname FROM pg_constraint WHERE conrelid = 'expenses'::regclass AND contype = 'f'`
    )
    console.log('FK constraints on expenses:', res.rows)

    for (const row of res.rows) {
      if (row.conname.toLowerCase().includes('category')) {
        await client.query(`ALTER TABLE expenses DROP CONSTRAINT IF EXISTS "${row.conname}"`)
        console.log('Dropped:', row.conname)
      }
    }
    console.log('Done!')
  } catch (e: any) {
    console.error('Error:', e.message)
  } finally {
    client.release()
    await pool.end()
  }
}

fix()
