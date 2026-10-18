import { describe, expect, it } from 'vitest'
import { backupFilename, parseBackup, serializeBackup } from './backup'
import type { Habit } from './habits'

const habit: Habit = { id: 'a', name: 'Gym', icon: 'dumbbell', schedule: [1, 3], createdOn: '2026-10-01' }

describe('backup', () => {
  it('round-trips habits and check-ins', () => {
    const log = { a: { '2026-10-02': true as const, '2026-10-05': true as const } }
    const parsed = parseBackup(serializeBackup({ habits: [habit], log }, new Date('2026-10-18T12:00:00Z')))
    expect(parsed).toEqual({ ok: true, backup: { habits: [habit], log }, checkIns: 2 })
  })

  it('drops invalid habits and check-ins for habits that are not in the file', () => {
    const text = JSON.stringify({
      app: 'lockedin',
      version: 1,
      habits: [habit, { id: 'b', name: '', icon: 'sun', schedule: 'daily', createdOn: '2026-10-01' }],
      log: { a: { '2026-10-02': true }, b: { '2026-10-02': true }, ghost: { '2026-10-03': true } },
    })
    expect(parseBackup(text)).toEqual({ ok: true, backup: { habits: [habit], log: { a: { '2026-10-02': true } } }, checkIns: 1 })
  })

  it('rejects files that are not LockedIn backups', () => {
    expect(parseBackup('not json')).toEqual({ ok: false, error: "That file isn't valid JSON." })
    expect(parseBackup('{"habits":[]}')).toMatchObject({ ok: false, error: "That file isn't a LockedIn backup." })
    expect(parseBackup('[1,2]')).toMatchObject({ ok: false })
    expect(parseBackup('{"app":"lockedin","version":99}')).toMatchObject({ ok: false, error: expect.stringContaining('newer') })
  })

  it('names the file by date', () => {
    expect(backupFilename('2026-10-18')).toBe('lockedin-backup-2026-10-18.json')
  })
})
