import { ensureTables } from '../lib/db/migrate'

async function main() {
  console.log('Running migrations...')
  await ensureTables()
  console.log('✓ Migrations complete')
  process.exit(0)
}

main().catch((error) => {
  console.error('Migration failed:', error)
  process.exit(1)
})
