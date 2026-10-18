import { HABIT_ICONS, NAME_MAX, type Habit, type HabitIcon, type Log } from './habits'

const LOG_KEY = 'lockedin.log'
const HABITS_KEY = 'lockedin.habits'
const DAY_KEY = /^\d{4}-\d{2}-\d{2}$/

const isRecord = (x: unknown): x is Record<string, unknown> => typeof x === 'object' && x !== null && !Array.isArray(x)

// Storage is user-editable, so keep only well-formed entries.
export function parseLog(raw: unknown): Log {
  if (!isRecord(raw)) return {}
  const log: Log = {}
  for (const [id, days] of Object.entries(raw)) {
    if (!isRecord(days)) continue
    log[id] = {}
    for (const [key, done] of Object.entries(days)) if (DAY_KEY.test(key) && done === true) log[id][key] = true
  }
  return log
}

const isIcon = (x: unknown): x is HabitIcon => HABIT_ICONS.some((icon) => icon === x)

const isSchedule = (x: unknown): x is Habit['schedule'] =>
  x === 'daily' ||
  (Array.isArray(x) && x.length > 0 && x.every((d) => Number.isInteger(d) && d >= 0 && d <= 6))

function toHabit(x: unknown): Habit | null {
  if (!isRecord(x)) return null
  const { id, name, icon, schedule, createdOn } = x
  if (typeof id !== 'string' || typeof name !== 'string' || typeof createdOn !== 'string') return null
  const trimmed = name.trim()
  if (!trimmed || trimmed.length > NAME_MAX || !isIcon(icon) || !isSchedule(schedule) || !DAY_KEY.test(createdOn)) return null
  return { id, name: trimmed, icon, schedule, createdOn }
}

export function parseHabits(raw: unknown): Habit[] {
  if (!Array.isArray(raw)) return []
  const seen = new Set<string>()
  return raw.flatMap((x) => {
    const habit = toHabit(x)
    if (!habit || seen.has(habit.id)) return []
    seen.add(habit.id)
    return [habit]
  })
}

function read(key: string): unknown {
  try {
    return JSON.parse(localStorage.getItem(key) ?? 'null')
  } catch {
    return null
  }
}

function write(key: string, value: unknown) {
  try {
    localStorage.setItem(key, JSON.stringify(value))
  } catch {
    // Private mode or quota: the app still works for this session.
  }
}

export const loadLog = () => parseLog(read(LOG_KEY))
export const saveLog = (log: Log) => write(LOG_KEY, log)
export const loadHabits = () => parseHabits(read(HABITS_KEY))
export const saveHabits = (habits: Habit[]) => write(HABITS_KEY, habits)
