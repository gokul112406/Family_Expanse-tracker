-- Run this SQL in your PostgreSQL database to create the family_invites table

CREATE TABLE IF NOT EXISTS family_invites (
  id TEXT PRIMARY KEY,
  "familyId" TEXT NOT NULL,
  email TEXT NOT NULL,
  "invitedBy" TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending',
  "createdAt" TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Verify the table was created
SELECT table_name FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'family_invites';
