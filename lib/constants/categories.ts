export const EXPENSE_CATEGORIES: Record<string, string> = {
  food: 'Food & Dining',
  transport: 'Transport',
  utilities: 'Utilities',
  entertainment: 'Entertainment',
  health: 'Health & Medical',
  shopping: 'Shopping',
  other: 'Other',
}

export function getCategoryLabel(categoryId?: string | null): string {
  if (!categoryId) return 'Other'
  return EXPENSE_CATEGORIES[categoryId] ?? categoryId
}
