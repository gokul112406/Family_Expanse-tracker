import {
  pgTable,
  text,
  timestamp,
  boolean,
  decimal,
  integer,
  jsonb,
  unique,
} from 'drizzle-orm/pg-core'
import { relations } from 'drizzle-orm'

// Better Auth tables
export const user = pgTable('user', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  email: text('email').notNull().unique(),
  emailVerified: boolean('emailVerified').notNull().default(false),
  image: text('image'),
  createdAt: timestamp('createdAt').notNull().defaultNow(),
  updatedAt: timestamp('updatedAt').notNull().defaultNow(),
})

export const session = pgTable('session', {
  id: text('id').primaryKey(),
  expiresAt: timestamp('expiresAt').notNull(),
  token: text('token').notNull().unique(),
  createdAt: timestamp('createdAt').notNull().defaultNow(),
  updatedAt: timestamp('updatedAt').notNull().defaultNow(),
  ipAddress: text('ipAddress'),
  userAgent: text('userAgent'),
  userId: text('userId')
    .notNull()
    .references(() => user.id, { onDelete: 'cascade' }),
})

export const account = pgTable('account', {
  id: text('id').primaryKey(),
  accountId: text('accountId').notNull(),
  providerId: text('providerId').notNull(),
  userId: text('userId')
    .notNull()
    .references(() => user.id, { onDelete: 'cascade' }),
  accessToken: text('accessToken'),
  refreshToken: text('refreshToken'),
  idToken: text('idToken'),
  accessTokenExpiresAt: timestamp('accessTokenExpiresAt'),
  refreshTokenExpiresAt: timestamp('refreshTokenExpiresAt'),
  scope: text('scope'),
  password: text('password'),
  createdAt: timestamp('createdAt').notNull().defaultNow(),
  updatedAt: timestamp('updatedAt').notNull().defaultNow(),
})

export const verification = pgTable('verification', {
  id: text('id').primaryKey(),
  identifier: text('identifier').notNull(),
  value: text('value').notNull(),
  expiresAt: timestamp('expiresAt').notNull(),
  createdAt: timestamp('createdAt').defaultNow(),
  updatedAt: timestamp('updatedAt').defaultNow(),
})

// App tables
export const families = pgTable('families', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  ownerId: text('ownerId')
    .notNull()
    .references(() => user.id, { onDelete: 'cascade' }),
  description: text('description'),
  currency: text('currency').default('INR').notNull(),
  createdAt: timestamp('createdAt').notNull().defaultNow(),
  updatedAt: timestamp('updatedAt').notNull().defaultNow(),
})

export const familyMembers = pgTable(
  'family_members',
  {
    id: text('id').primaryKey(),
    familyId: text('familyId')
      .notNull()
      .references(() => families.id, { onDelete: 'cascade' }),
    userId: text('userId')
      .notNull()
      .references(() => user.id, { onDelete: 'cascade' }),
    role: text('role').notNull().default('member'), // 'admin' or 'member'
    joinedAt: timestamp('joinedAt').notNull().defaultNow(),
    createdAt: timestamp('createdAt').notNull().defaultNow(),
  },
  (table) => [unique().on(table.familyId, table.userId)]
)

export const expenseCategories = pgTable('expense_categories', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  familyId: text('familyId').references(() => families.id, { onDelete: 'cascade' }),
  userId: text('userId')
    .notNull()
    .references(() => user.id, { onDelete: 'cascade' }),
  type: text('type').notNull().default('expense'), // 'expense' or 'income'
  icon: text('icon'),
  color: text('color'),
  isDefault: boolean('isDefault').default(false),
  createdAt: timestamp('createdAt').notNull().defaultNow(),
})

export const expenses = pgTable('expenses', {
  id: text('id').primaryKey(),
  familyId: text('familyId').references(() => families.id, { onDelete: 'cascade' }),
  userId: text('userId')
    .notNull()
    .references(() => user.id, { onDelete: 'cascade' }),
  categoryId: text('categoryId'),
  amount: decimal('amount', { precision: 12, scale: 2 }).notNull(),
  currency: text('currency').default('INR').notNull(),
  description: text('description'),
  paymentMethod: text('paymentMethod').default('cash'), // 'cash', 'credit', 'debit', 'transfer'
  receiptUrl: text('receiptUrl'),
  date: timestamp('date').notNull(),
  createdAt: timestamp('createdAt').notNull().defaultNow(),
  updatedAt: timestamp('updatedAt').notNull().defaultNow(),
})

export const income = pgTable('income', {
  id: text('id').primaryKey(),
  familyId: text('familyId').references(() => families.id, { onDelete: 'cascade' }),
  userId: text('userId')
    .notNull()
    .references(() => user.id, { onDelete: 'cascade' }),
  source: text('source').notNull(),
  amount: decimal('amount', { precision: 12, scale: 2 }).notNull(),
  currency: text('currency').default('INR'),
  frequency: text('frequency').default('once'), // 'once', 'weekly', 'biweekly', 'monthly', 'yearly'
  startDate: timestamp('startDate'),
  endDate: timestamp('endDate'),
  notes: text('notes'),
  createdAt: timestamp('createdAt').notNull().defaultNow(),
  updatedAt: timestamp('updatedAt').notNull().defaultNow(),
})

export const budgets = pgTable('budgets', {
  id: text('id').primaryKey(),
  familyId: text('familyId')
    .notNull()
    .references(() => families.id, { onDelete: 'cascade' }),
  userId: text('userId').references(() => user.id, { onDelete: 'cascade' }), // null if family-wide budget
  categoryId: text('categoryId').references(() => expenseCategories.id, { onDelete: 'set null' }), // null if for all categories
  amount: decimal('amount', { precision: 12, scale: 2 }).notNull(),
  currency: text('currency').default('INR'),
  period: text('period').notNull().default('monthly'), // 'weekly', 'monthly', 'yearly'
  startDate: timestamp('startDate').notNull(),
  endDate: timestamp('endDate'),
  notes: text('notes'),
  createdAt: timestamp('createdAt').notNull().defaultNow(),
  updatedAt: timestamp('updatedAt').notNull().defaultNow(),
})

export const budgetAlerts = pgTable('budget_alerts', {
  id: text('id').primaryKey(),
  budgetId: text('budgetId')
    .notNull()
    .references(() => budgets.id, { onDelete: 'cascade' }),
  threshold: integer('threshold').notNull(), // percentage: 75, 100
  alertType: text('alertType').notNull(), // 'warning', 'critical'
  isTriggered: boolean('isTriggered').default(false),
  triggeredAt: timestamp('triggeredAt'),
  createdAt: timestamp('createdAt').notNull().defaultNow(),
})

export const notifications = pgTable('notifications', {
  id: text('id').primaryKey(),
  userId: text('userId')
    .notNull()
    .references(() => user.id, { onDelete: 'cascade' }),
  familyId: text('familyId').references(() => families.id, { onDelete: 'cascade' }),
  type: text('type').notNull(), // 'expense_added', 'budget_alert', 'member_joined'
  title: text('title').notNull(),
  message: text('message'),
  relatedId: text('relatedId'),
  isRead: boolean('isRead').default(false),
  createdAt: timestamp('createdAt').notNull().defaultNow(),
})

export const familyInvites = pgTable('family_invites', {
  id: text('id').primaryKey(),
  familyId: text('familyId')
    .notNull()
    .references(() => families.id, { onDelete: 'cascade' }),
  email: text('email').notNull(),
  invitedBy: text('invitedBy')
    .notNull()
    .references(() => user.id, { onDelete: 'cascade' }),
  status: text('status').notNull().default('pending'),
  createdAt: timestamp('createdAt').notNull().defaultNow(),
})

export const activityLog = pgTable('activity_log', {
  id: text('id').primaryKey(),
  familyId: text('familyId')
    .notNull()
    .references(() => families.id, { onDelete: 'cascade' }),
  userId: text('userId')
    .notNull()
    .references(() => user.id, { onDelete: 'cascade' }),
  action: text('action').notNull(),
  entityType: text('entityType'),
  entityId: text('entityId'),
  details: jsonb('details'),
  createdAt: timestamp('createdAt').notNull().defaultNow(),
})

// Relations
export const userRelations = relations(user, ({ many }) => ({
  families: many(familyMembers),
  expenses: many(expenses),
  income: many(income),
}))

export const familiesRelations = relations(families, ({ many }) => ({
  members: many(familyMembers),
  expenses: many(expenses),
  budgets: many(budgets),
}))

export const familyMembersRelations = relations(
  familyMembers,
  ({ one }) => ({
    family: one(families, {
      fields: [familyMembers.familyId],
      references: [families.id],
    }),
    user: one(user, {
      fields: [familyMembers.userId],
      references: [user.id],
    }),
  })
)

export const expensesRelations = relations(expenses, ({ one }) => ({
  family: one(families, {
    fields: [expenses.familyId],
    references: [families.id],
  }),
  user: one(user, {
    fields: [expenses.userId],
    references: [user.id],
  }),
  category: one(expenseCategories, {
    fields: [expenses.categoryId],
    references: [expenseCategories.id],
  }),
}))
