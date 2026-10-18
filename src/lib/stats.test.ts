import { describe, expect, it } from 'vitest'
import { SUGGESTIONS, normalizeSchedule, type Habit, type Log } from './habits'
import { monotonePath } from './path'
import { parseHabits, parseLog } from './storage'
import {
  avgDonePerDay, bestStreak, cellState, currentStreak, habitTotals, monthTotals, perfectDays, ratio, trackedFrom,
  weekKeys, type View,
} from './stats'

const habit = (id: string, schedule: Habit['schedule'], createdOn = '2026-10-01'): Habit => ({
  id, name: id, icon: 'sun', schedule, createdOn,
})
const october = (habits: Habit[], log: Log, today: string): View => ({ habits, log, year: 2026, month: 9, today })

describe('scheduled count', () => {
  it('counts weekday schedules over the whole month', () => {
    const habits = SUGGESTIONS.map((s, i) => ({ ...s, id: String(i), createdOn: '2026-10-01' }))
    const v = october(habits, {}, '2026-10-31')
    expect(habits.map((h) => habitTotals(v, h).scheduled)).toEqual([22, 31, 18, 22, 22, 31, 14, 31])
    expect(monthTotals(v).scheduled).toBe(191)
  })

  it('only counts days on or before today', () => {
    // Oct 1 2026 is a Thursday; Oct 1–5 has Fri 2, Sat 3, Mon 5 as Mon/Wed/Fri/Sat days.
    const gym = habit('g', [1, 3, 5, 6])
    expect(habitTotals(october([gym], {}, '2026-10-05'), gym).scheduled).toBe(3)
  })

  it('starts counting from the day a habit was added', () => {
    const late = habit('d', 'daily', '2026-10-10')
    expect(habitTotals(october([late], {}, '2026-10-12'), late).scheduled).toBe(3)
  })
})

describe('consistency', () => {
  it('is completed over scheduled-to-date', () => {
    const daily = habit('d', 'daily')
    const log: Log = { d: { '2026-10-01': true, '2026-10-03': true } }
    const v = october([daily], log, '2026-10-04')
    expect(ratio(monthTotals(v))).toBe(0.5)
    expect(avgDonePerDay(v)).toBe(0.5)
  })

  it('is zero with no habits', () => {
    const v = october([], {}, '2026-10-18')
    expect(ratio(monthTotals(v))).toBe(0)
    expect(avgDonePerDay(v)).toBe(0)
  })
})

describe('perfect days', () => {
  it('needs every scheduled habit done, ignoring unscheduled ones', () => {
    const daily = habit('d', 'daily')
    const weekdays = habit('w', [1, 2, 3, 4, 5])
    const log: Log = {
      d: { '2026-10-02': true, '2026-10-03': true, '2026-10-04': true },
      w: { '2026-10-01': true },
    }
    // Oct 1 Thu: d missing. Oct 2 Fri: w missing. Oct 3–4 weekend: only d scheduled, done.
    expect(perfectDays(october([daily, weekdays], log, '2026-10-04'))).toBe(2)
  })
})

describe('cell state', () => {
  const daily = habit('d', 'daily', '2026-10-15')
  const v = october([daily], {}, '2026-10-18')

  it('splits missed, due and upcoming at today', () => {
    expect(cellState(daily, v, '2026-10-17')).toBe('missed')
    expect(cellState(daily, v, '2026-10-18')).toBe('due')
    expect(cellState(daily, v, '2026-10-19')).toBe('upcoming')
  })

  it('shows completion and unscheduled days', () => {
    expect(cellState(daily, { ...v, log: { d: { '2026-10-18': true } } }, '2026-10-18')).toBe('completed')
    expect(cellState(habit('w', [1]), v, '2026-10-17')).toBe('unscheduled')
  })

  it('treats days before a habit was added as untracked, not missed', () => {
    expect(cellState(daily, v, '2026-10-14')).toBe('untracked')
    expect(cellState(daily, v, '2026-10-15')).toBe('missed')
  })

  it('moves the start back when an earlier day is backfilled', () => {
    const log: Log = { d: { '2026-10-12': true } }
    expect(trackedFrom(log, daily)).toBe('2026-10-12')
    expect(cellState(daily, { ...v, log }, '2026-10-13')).toBe('missed')
    expect(cellState(daily, { ...v, log }, '2026-10-11')).toBe('untracked')
  })
})

describe('streaks', () => {
  const daily = habit('d', 'daily')
  const log: Log = { d: { '2026-10-01': true, '2026-10-02': true, '2026-10-03': true, '2026-10-05': true, '2026-10-06': true } }

  it('counts back from today, skipping unscheduled days and a still-due today', () => {
    expect(currentStreak(october([daily], log, '2026-10-07'), daily)).toBe(2)
    expect(currentStreak(october([daily], log, '2026-10-08'), daily)).toBe(0)
    const weekdays = habit('w', [1, 2, 3, 4, 5])
    // Fri 2, then the weekend is skipped, then Mon 5.
    const wlog: Log = { w: { '2026-10-02': true, '2026-10-05': true } }
    expect(currentStreak(october([weekdays], wlog, '2026-10-05'), weekdays)).toBe(2)
  })

  it('finds the best run in the month', () => {
    expect(bestStreak(october([daily], log, '2026-10-08'), daily)).toBe(3)
  })
})

describe('week', () => {
  it('runs Monday to Sunday', () => {
    expect(weekKeys('2026-10-18')).toEqual([
      '2026-10-12', '2026-10-13', '2026-10-14', '2026-10-15', '2026-10-16', '2026-10-17', '2026-10-18',
    ])
  })
})

describe('schedule', () => {
  it('collapses all seven days to daily and sorts the rest', () => {
    expect(normalizeSchedule([0, 1, 2, 3, 4, 5, 6])).toBe('daily')
    expect(normalizeSchedule([5, 1, 3, 3])).toEqual([1, 3, 5])
  })
})

describe('storage parsing', () => {
  it('keeps valid habits and drops malformed or duplicate ones', () => {
    const good = { id: 'a', name: ' Gym ', icon: 'dumbbell', schedule: [1, 3], createdOn: '2026-10-01' }
    const parsed = parseHabits([
      good,
      { ...good },
      { ...good, id: 'b', icon: 'rocket' },
      { ...good, id: 'c', schedule: [9] },
      { ...good, id: 'd', name: '   ' },
      'nope',
    ])
    expect(parsed).toEqual([{ ...good, name: 'Gym' }])
    expect(parseHabits({ not: 'an array' })).toEqual([])
  })

  it('keeps only true entries on day keys', () => {
    expect(parseLog({ a: { '2026-10-01': true, '2026-10-02': false, bad: true }, b: 'x' })).toEqual({ a: { '2026-10-01': true } })
  })
})

describe('monotonePath', () => {
  it('passes through every point', () => {
    const d = monotonePath([[0, 10], [5, 0], [10, 10]])
    expect(d.startsWith('M0,10')).toBe(true)
    expect(d).toContain(',5,0C')
    expect(d.endsWith(',10,10')).toBe(true)
  })
})
