import { sql } from 'drizzle-orm'
import { db } from './index'

export async function ensureTables() {
  try {
    // 1. User table (Better Auth)
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS "user" (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        email TEXT NOT NULL UNIQUE,
        "emailVerified" BOOLEAN NOT NULL DEFAULT false,
        image TEXT,
        "createdAt" TIMESTAMP NOT NULL DEFAULT NOW(),
        "updatedAt" TIMESTAMP NOT NULL DEFAULT NOW()
      )
    `)

    // 2. Session table (Better Auth)
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS "session" (
        id TEXT PRIMARY KEY,
        "expiresAt" TIMESTAMP NOT NULL,
        token TEXT NOT NULL UNIQUE,
        "createdAt" TIMESTAMP NOT NULL DEFAULT NOW(),
        "updatedAt" TIMESTAMP NOT NULL DEFAULT NOW(),
        "ipAddress" TEXT,
        "userAgent" TEXT,
        "userId" TEXT NOT NULL REFERENCES "user"(id) ON DELETE CASCADE
      )
    `)

    // 3. Account table (Better Auth - OAuth & Passwords)
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS "account" (
        id TEXT PRIMARY KEY,
        "accountId" TEXT NOT NULL,
        "providerId" TEXT NOT NULL,
        "userId" TEXT NOT NULL REFERENCES "user"(id) ON DELETE CASCADE,
        "accessToken" TEXT,
        "refreshToken" TEXT,
        "idToken" TEXT,
        "accessTokenExpiresAt" TIMESTAMP,
        "refreshTokenExpiresAt" TIMESTAMP,
        scope TEXT,
        password TEXT,
        "createdAt" TIMESTAMP NOT NULL DEFAULT NOW(),
        "updatedAt" TIMESTAMP NOT NULL DEFAULT NOW()
      )
    `)

    // 4. Verification table (Better Auth)
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS "verification" (
        id TEXT PRIMARY KEY,
        identifier TEXT NOT NULL,
        value TEXT NOT NULL,
        "expiresAt" TIMESTAMP NOT NULL,
        "createdAt" TIMESTAMP DEFAULT NOW(),
        "updatedAt" TIMESTAMP DEFAULT NOW()
      )
    `)

    // 5. Families table
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS families (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        "ownerId" TEXT NOT NULL REFERENCES "user"(id) ON DELETE CASCADE,
        description TEXT,
        currency TEXT NOT NULL DEFAULT 'INR',
        "createdAt" TIMESTAMP NOT NULL DEFAULT NOW(),
        "updatedAt" TIMESTAMP NOT NULL DEFAULT NOW()
      )
    `)

    // 6. Family Members table
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS family_members (
        id TEXT PRIMARY KEY,
        "familyId" TEXT NOT NULL REFERENCES families(id) ON DELETE CASCADE,
        "userId" TEXT NOT NULL REFERENCES "user"(id) ON DELETE CASCADE,
        role TEXT NOT NULL DEFAULT 'member',
        "joinedAt" TIMESTAMP NOT NULL DEFAULT NOW(),
        "createdAt" TIMESTAMP NOT NULL DEFAULT NOW(),
        CONSTRAINT family_members_family_user_unique UNIQUE ("familyId", "userId")
      )
    `)

    // 7. Expense Categories table
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS expense_categories (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        "familyId" TEXT REFERENCES families(id) ON DELETE CASCADE,
        "userId" TEXT NOT NULL REFERENCES "user"(id) ON DELETE CASCADE,
        type TEXT NOT NULL DEFAULT 'expense',
        icon TEXT,
        color TEXT,
        "isDefault" BOOLEAN DEFAULT false,
        "createdAt" TIMESTAMP NOT NULL DEFAULT NOW()
      )
    `)

    // 8. Expenses table
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS expenses (
        id TEXT PRIMARY KEY,
        "familyId" TEXT REFERENCES families(id) ON DELETE CASCADE,
        "userId" TEXT NOT NULL REFERENCES "user"(id) ON DELETE CASCADE,
        "categoryId" TEXT REFERENCES expense_categories(id) ON DELETE SET NULL,
        amount DECIMAL(12, 2) NOT NULL,
        currency TEXT NOT NULL DEFAULT 'INR',
        description TEXT,
        "paymentMethod" TEXT DEFAULT 'cash',
        "receiptUrl" TEXT,
        date TIMESTAMP NOT NULL,
        "createdAt" TIMESTAMP NOT NULL DEFAULT NOW(),
        "updatedAt" TIMESTAMP NOT NULL DEFAULT NOW()
      )
    `)

    // 9. Income table
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS income (
        id TEXT PRIMARY KEY,
        "familyId" TEXT REFERENCES families(id) ON DELETE CASCADE,
        "userId" TEXT NOT NULL REFERENCES "user"(id) ON DELETE CASCADE,
        source TEXT NOT NULL,
        amount DECIMAL(12, 2) NOT NULL,
        currency TEXT DEFAULT 'INR',
        frequency TEXT DEFAULT 'once',
        "startDate" TIMESTAMP,
        "endDate" TIMESTAMP,
        notes TEXT,
        "createdAt" TIMESTAMP NOT NULL DEFAULT NOW(),
        "updatedAt" TIMESTAMP NOT NULL DEFAULT NOW()
      )
    `)

    // 10. Budgets table
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS budgets (
        id TEXT PRIMARY KEY,
        "familyId" TEXT NOT NULL REFERENCES families(id) ON DELETE CASCADE,
        "userId" TEXT REFERENCES "user"(id) ON DELETE CASCADE,
        "categoryId" TEXT REFERENCES expense_categories(id) ON DELETE SET NULL,
        amount DECIMAL(12, 2) NOT NULL,
        currency TEXT DEFAULT 'INR',
        period TEXT NOT NULL DEFAULT 'monthly',
        "startDate" TIMESTAMP NOT NULL,
        "endDate" TIMESTAMP,
        notes TEXT,
        "createdAt" TIMESTAMP NOT NULL DEFAULT NOW(),
        "updatedAt" TIMESTAMP NOT NULL DEFAULT NOW()
      )
    `)

    // 11. Budget Alerts table
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS budget_alerts (
        id TEXT PRIMARY KEY,
        "budgetId" TEXT NOT NULL REFERENCES budgets(id) ON DELETE CASCADE,
        threshold INTEGER NOT NULL,
        "alertType" TEXT NOT NULL,
        "isTriggered" BOOLEAN DEFAULT false,
        "triggeredAt" TIMESTAMP,
        "createdAt" TIMESTAMP NOT NULL DEFAULT NOW()
      )
    `)

    // 12. Notifications table
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS notifications (
        id TEXT PRIMARY KEY,
        "userId" TEXT NOT NULL REFERENCES "user"(id) ON DELETE CASCADE,
        "familyId" TEXT REFERENCES families(id) ON DELETE CASCADE,
        type TEXT NOT NULL,
        title TEXT NOT NULL,
        message TEXT,
        "relatedId" TEXT,
        "isRead" BOOLEAN DEFAULT false,
        "createdAt" TIMESTAMP NOT NULL DEFAULT NOW()
      )
    `)

    // 13. Family Invites table
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS family_invites (
        id TEXT PRIMARY KEY,
        "familyId" TEXT NOT NULL REFERENCES families(id) ON DELETE CASCADE,
        email TEXT NOT NULL,
        "invitedBy" TEXT NOT NULL REFERENCES "user"(id) ON DELETE CASCADE,
        status TEXT NOT NULL DEFAULT 'pending',
        "createdAt" TIMESTAMP NOT NULL DEFAULT NOW()
      )
    `)

    // 14. Activity Log table
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS activity_log (
        id TEXT PRIMARY KEY,
        "familyId" TEXT NOT NULL REFERENCES families(id) ON DELETE CASCADE,
        "userId" TEXT NOT NULL REFERENCES "user"(id) ON DELETE CASCADE,
        action TEXT NOT NULL,
        "entityType" TEXT,
        "entityId" TEXT,
        details JSONB,
        "createdAt" TIMESTAMP NOT NULL DEFAULT NOW()
      )
    `)

    console.log('✓ All database tables ensured successfully')
  } catch (error) {
    console.error('Error ensuring database tables:', error)
    throw error
  }
}
