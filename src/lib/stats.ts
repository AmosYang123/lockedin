import { addDays, dayOfMonth, monthKeys, weekdayOf } from './dates'
import type { Habit, Log } from './habits'

export interface View {
  habits: Habit[]
  log: Log
  year: number
  month: number // 0-based
  today: string // day key
}

export type CellState = 'completed' | 'missed' | 'due' | 'upcoming' | 'unscheduled' | 'untracked'

export interface Totals {
  done: number
  scheduled: number
}

export const ratio = ({ done, scheduled }: Totals) => (scheduled === 0 ? 0 : done / scheduled)

export const isScheduled = (habit: Habit, key: string) =>
  habit.schedule === 'daily' || habit.schedule.includes(weekdayOf(key))

export const isDone = (log: Log, habitId: string, key: string) => log[habitId]?.[key] === true

const firstLogged = new WeakMap<Log, Map<string, string | undefined>>()

/** A habit counts from the day it was added, or from the earliest day backfilled before that. */
export function trackedFrom(log: Log, habit: Habit): string {
  let byHabit = firstLogged.get(log)
  if (!byHabit) firstLogged.set(log, (byHabit = new Map()))
  if (!byHabit.has(habit.id)) byHabit.set(habit.id, Object.keys(log[habit.id] ?? {}).sort()[0])
  const first = byHabit.get(habit.id)
  return first && first < habit.createdOn ? first : habit.createdOn
}

const isTracked = (v: View, habit: Habit, key: string) => key >= trackedFrom(v.log, habit)
const counts = (v: View, habit: Habit, key: string) => isScheduled(habit, key) && isTracked(v, habit, key)

export function cellState(habit: Habit, v: View, key: string): CellState {
  if (!isScheduled(habit, key)) return 'unscheduled'
  if (isDone(v.log, habit.id, key)) return 'completed'
  if (key < v.today) return isTracked(v, habit, key) ? 'missed' : 'untracked'
  if (key === v.today) return 'due'
  return 'upcoming'
}

export const elapsedKeys = (v: View) => monthKeys(v.year, v.month).filter((k) => k <= v.today)

function sum(list: Totals[]): Totals {
  return list.reduce((a, b) => ({ done: a.done + b.done, scheduled: a.scheduled + b.scheduled }), { done: 0, scheduled: 0 })
}

export function dayTotals(v: View, key: string): Totals {
  const due = v.habits.filter((h) => counts(v, h, key))
  return { done: due.filter((h) => isDone(v.log, h.id, key)).length, scheduled: due.length }
}

export function habitTotals(v: View, habit: Habit): Totals {
  const due = elapsedKeys(v).filter((k) => counts(v, habit, k))
  return { done: due.filter((k) => isDone(v.log, habit.id, k)).length, scheduled: due.length }
}

export const monthTotals = (v: View) => sum(elapsedKeys(v).map((k) => dayTotals(v, k)))

export function perfectDays(v: View): number {
  return elapsedKeys(v).filter((k) => {
    const t = dayTotals(v, k)
    return t.scheduled > 0 && t.done === t.scheduled
  }).length
}

/** Completed check-ins per day, over the days any habit was being tracked. */
export function avgDonePerDay(v: View): number {
  const days = elapsedKeys(v).filter((k) => v.habits.some((h) => isTracked(v, h, k))).length
  return days === 0 ? 0 : monthTotals(v).done / days
}

/** Monday–Sunday of the week containing `today`. */
export function weekKeys(today: string): string[] {
  const monday = addDays(today, -((weekdayOf(today) + 6) % 7))
  return Array.from({ length: 7 }, (_, i) => addDays(monday, i))
}

export const weekTotals = (v: View) =>
  sum(weekKeys(v.today).filter((k) => k <= v.today).map((k) => dayTotals(v, k)))

export function dailyCompletion(v: View): { day: number; pct: number }[] {
  return elapsedKeys(v)
    .map((k) => ({ day: dayOfMonth(k), totals: dayTotals(v, k) }))
    .filter(({ totals }) => totals.scheduled > 0)
    .map(({ day, totals }) => ({ day, pct: ratio(totals) }))
}

/** Consecutive scheduled days done, ending today. Today still being due doesn't break it. */
export function currentStreak(v: View, habit: Habit): number {
  let streak = 0
  let key = v.today
  for (let i = 0; i < 400 && isTracked(v, habit, key); i++, key = addDays(key, -1)) {
    if (!isScheduled(habit, key)) continue
    if (isDone(v.log, habit.id, key)) streak++
    else if (key !== v.today) break
  }
  return streak
}

/** Longest run of scheduled days done within the elapsed month. */
export function bestStreak(v: View, habit: Habit): number {
  let best = 0
  let run = 0
  for (const key of elapsedKeys(v)) {
    if (!counts(v, habit, key)) continue
    run = isDone(v.log, habit.id, key) ? run + 1 : key === v.today ? run : 0
    best = Math.max(best, run)
  }
  return best
}

export function rankStreaks(v: View) {
  return v.habits
    .map((habit) => ({ habit, current: currentStreak(v, habit), best: bestStreak(v, habit) }))
    .sort((a, b) => b.current - a.current || b.best - a.best)
}

export function rankHabits(v: View) {
  return v.habits
    .map((habit) => {
      const totals = habitTotals(v, habit)
      return { habit, ...totals, pct: ratio(totals) }
    })
    .sort((a, b) => b.pct - a.pct || b.done - a.done || b.scheduled - a.scheduled)
}
