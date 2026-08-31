-- =========================================================
-- Family Expense Tracker - Complete Database Schema (PostgreSQL)
-- Run this script in your PostgreSQL database (e.g. Neon, Supabase)
-- =========================================================

-- 1. Better Auth: Users
CREATE TABLE IF NOT EXISTS "user" (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT NOT NULL UNIQUE,
  "emailVerified" BOOLEAN NOT NULL DEFAULT false,
  image TEXT,
  "createdAt" TIMESTAMP NOT NULL DEFAULT NOW(),
  "updatedAt" TIMESTAMP NOT NULL DEFAULT NOW()
);

-- 2. Better Auth: Sessions
CREATE TABLE IF NOT EXISTS "session" (
  id TEXT PRIMARY KEY,
  "expiresAt" TIMESTAMP NOT NULL,
  token TEXT NOT NULL UNIQUE,
  "createdAt" TIMESTAMP NOT NULL DEFAULT NOW(),
  "updatedAt" TIMESTAMP NOT NULL DEFAULT NOW(),
  "ipAddress" TEXT,
  "userAgent" TEXT,
  "userId" TEXT NOT NULL REFERENCES "user"(id) ON DELETE CASCADE
);

-- 3. Better Auth: Accounts (OAuth and Passwords)
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
);

-- 4. Better Auth: Verification
CREATE TABLE IF NOT EXISTS "verification" (
  id TEXT PRIMARY KEY,
  identifier TEXT NOT NULL,
  value TEXT NOT NULL,
  "expiresAt" TIMESTAMP NOT NULL,
  "createdAt" TIMESTAMP DEFAULT NOW(),
  "updatedAt" TIMESTAMP DEFAULT NOW()
);

-- 5. Families
CREATE TABLE IF NOT EXISTS families (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  "ownerId" TEXT NOT NULL,
  description TEXT,
  currency TEXT NOT NULL DEFAULT 'INR',
  "createdAt" TIMESTAMP NOT NULL DEFAULT NOW(),
  "updatedAt" TIMESTAMP NOT NULL DEFAULT NOW()
);

-- 6. Family Members
CREATE TABLE IF NOT EXISTS family_members (
  id TEXT PRIMARY KEY,
  "familyId" TEXT NOT NULL REFERENCES families(id) ON DELETE CASCADE,
  "userId" TEXT NOT NULL REFERENCES "user"(id) ON DELETE CASCADE,
  role TEXT NOT NULL DEFAULT 'member',
  "joinedAt" TIMESTAMP NOT NULL DEFAULT NOW(),
  "createdAt" TIMESTAMP NOT NULL DEFAULT NOW(),
  CONSTRAINT family_members_family_user_unique UNIQUE ("familyId", "userId")
);

-- 7. Expense Categories
CREATE TABLE IF NOT EXISTS expense_categories (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  "familyId" TEXT,
  "userId" TEXT NOT NULL,
  type TEXT NOT NULL DEFAULT 'expense',
  icon TEXT,
  color TEXT,
  "isDefault" BOOLEAN DEFAULT false,
  "createdAt" TIMESTAMP NOT NULL DEFAULT NOW()
);

-- 8. Expenses
CREATE TABLE IF NOT EXISTS expenses (
  id TEXT PRIMARY KEY,
  "familyId" TEXT,
  "userId" TEXT NOT NULL,
  "categoryId" TEXT NOT NULL,
  amount DECIMAL(12, 2) NOT NULL,
  currency TEXT NOT NULL DEFAULT 'INR',
  description TEXT,
  "paymentMethod" TEXT DEFAULT 'cash',
  "receiptUrl" TEXT,
  date TIMESTAMP NOT NULL,
  "createdAt" TIMESTAMP NOT NULL DEFAULT NOW(),
  "updatedAt" TIMESTAMP NOT NULL DEFAULT NOW()
);

-- 9. Income
CREATE TABLE IF NOT EXISTS income (
  id TEXT PRIMARY KEY,
  "familyId" TEXT,
  "userId" TEXT NOT NULL,
  source TEXT NOT NULL,
  amount DECIMAL(12, 2) NOT NULL,
  currency TEXT DEFAULT 'INR',
  frequency TEXT DEFAULT 'once',
  "startDate" TIMESTAMP,
  "endDate" TIMESTAMP,
  notes TEXT,
  "createdAt" TIMESTAMP NOT NULL DEFAULT NOW(),
  "updatedAt" TIMESTAMP NOT NULL DEFAULT NOW()
);

-- 10. Budgets
CREATE TABLE IF NOT EXISTS budgets (
  id TEXT PRIMARY KEY,
  "familyId" TEXT NOT NULL,
  "userId" TEXT,
  "categoryId" TEXT,
  amount DECIMAL(12, 2) NOT NULL,
  currency TEXT DEFAULT 'INR',
  period TEXT NOT NULL DEFAULT 'monthly',
  "startDate" TIMESTAMP NOT NULL,
  "endDate" TIMESTAMP,
  notes TEXT,
  "createdAt" TIMESTAMP NOT NULL DEFAULT NOW(),
  "updatedAt" TIMESTAMP NOT NULL DEFAULT NOW()
);

-- 11. Budget Alerts
CREATE TABLE IF NOT EXISTS budget_alerts (
  id TEXT PRIMARY KEY,
  "budgetId" TEXT NOT NULL,
  threshold INTEGER NOT NULL,
  "alertType" TEXT NOT NULL,
  "isTriggered" BOOLEAN DEFAULT false,
  "triggeredAt" TIMESTAMP,
  "createdAt" TIMESTAMP NOT NULL DEFAULT NOW()
);

-- 12. Notifications
CREATE TABLE IF NOT EXISTS notifications (
  id TEXT PRIMARY KEY,
  "userId" TEXT NOT NULL,
  "familyId" TEXT,
  type TEXT NOT NULL,
  title TEXT NOT NULL,
  message TEXT,
  "relatedId" TEXT,
  "isRead" BOOLEAN DEFAULT false,
  "createdAt" TIMESTAMP NOT NULL DEFAULT NOW()
);

-- 13. Family Invites
CREATE TABLE IF NOT EXISTS family_invites (
  id TEXT PRIMARY KEY,
  "familyId" TEXT NOT NULL,
  email TEXT NOT NULL,
  "invitedBy" TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending',
  "createdAt" TIMESTAMP NOT NULL DEFAULT NOW()
);

-- 14. Activity Log
CREATE TABLE IF NOT EXISTS activity_log (
  id TEXT PRIMARY KEY,
  "familyId" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  action TEXT NOT NULL,
  "entityType" TEXT,
  "entityId" TEXT,
  details JSONB,
  "createdAt" TIMESTAMP NOT NULL DEFAULT NOW()
);
