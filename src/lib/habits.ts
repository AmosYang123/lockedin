export type Schedule = 'daily' | number[] // weekdays, 0 = Sunday

export const HABIT_ICONS = [
  'sun', 'moon', 'brain', 'focus', 'dumbbell', 'bike', 'footprints', 'droplets',
  'glass', 'salad', 'pill', 'book', 'graduation', 'pen', 'code', 'phone-off', 'friends',
] as const

export type HabitIcon = (typeof HABIT_ICONS)[number]

export interface Habit {
  id: string
  name: string
  icon: HabitIcon
  schedule: Schedule
  createdOn: string // day key; earlier days count as untracked unless backfilled
}

export type Log = Record<string, Record<string, true>>

export type HabitDraft = Pick<Habit, 'name' | 'icon' | 'schedule'>

export const NAME_MAX = 40
const WEEKDAYS = [1, 2, 3, 4, 5]

export const SUGGESTIONS: HabitDraft[] = [
  { name: 'Wake up at 06:00', icon: 'sun', schedule: WEEKDAYS },
  { name: 'Meditation', icon: 'brain', schedule: 'daily' },
  { name: 'Gym', icon: 'dumbbell', schedule: [1, 3, 5, 6] },
  { name: 'Cold shower', icon: 'droplets', schedule: WEEKDAYS },
  { name: 'Deep work', icon: 'focus', schedule: WEEKDAYS },
  { name: 'Read 10 pages', icon: 'book', schedule: 'daily' },
  { name: 'Learn a skill', icon: 'graduation', schedule: [2, 4, 6] },
  { name: 'Sleep before 23:00', icon: 'moon', schedule: 'daily' },
]

/** All seven days selected collapses to 'daily'. */
export function normalizeSchedule(days: number[]): Schedule {
  const unique = [...new Set(days)].filter((d) => d >= 0 && d <= 6).sort()
  return unique.length === 7 ? 'daily' : unique
}

export const scheduleDays = (s: Schedule): number[] => (s === 'daily' ? [0, 1, 2, 3, 4, 5, 6] : s)

const SHORT_DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

export function scheduleLabel(s: Schedule): string {
  if (s === 'daily') return 'Every day'
  const days = [...s].sort((a, b) => ((a + 6) % 7) - ((b + 6) % 7))
  if (days.join() === '1,2,3,4,5') return 'Weekdays'
  if (days.join() === '6,0') return 'Weekends'
  return days.map((d) => SHORT_DAYS[d]).join(', ')
}

export const createHabit = (draft: HabitDraft, today: string): Habit => ({
  id: crypto.randomUUID(),
  ...draft,
  name: draft.name.trim(),
  createdOn: today,
})

export function toggleLog(log: Log, habitId: string, key: string): Log {
  const days = { ...log[habitId] }
  if (days[key]) delete days[key]
  else days[key] = true
  return { ...log, [habitId]: days }
}

export function dropFromLog(log: Log, habitId: string): Log {
  const rest = { ...log }
  delete rest[habitId]
  return rest
}
