// Day keys are local-time 'YYYY-MM-DD' strings, so they compare correctly as plain strings.
const pad = (n: number) => String(n).padStart(2, '0')

export const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
]

export const dayKey = (year: number, month: number, day: number) => `${year}-${pad(month + 1)}-${pad(day)}`

export const toKey = (date: Date) => dayKey(date.getFullYear(), date.getMonth(), date.getDate())

export function fromKey(key: string): Date {
  const [y, m, d] = key.split('-').map(Number)
  return new Date(y, m - 1, d)
}

export const weekdayOf = (key: string) => fromKey(key).getDay()

export const dayOfMonth = (key: string) => fromKey(key).getDate()

export const daysInMonth = (year: number, month: number) => new Date(year, month + 1, 0).getDate()

export const monthKeys = (year: number, month: number) =>
  Array.from({ length: daysInMonth(year, month) }, (_, i) => dayKey(year, month, i + 1))

export function addDays(key: string, n: number): string {
  const date = fromKey(key)
  date.setDate(date.getDate() + n)
  return toKey(date)
}
