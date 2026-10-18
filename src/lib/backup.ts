import type { Habit, Log } from './habits'
import { parseHabits, parseLog } from './storage'

const APP = 'lockedin'
const VERSION = 1
export const MAX_BACKUP_BYTES = 5 * 1024 * 1024

export interface Backup {
  habits: Habit[]
  log: Log
}

export type ParsedBackup = { ok: true; backup: Backup; checkIns: number } | { ok: false; error: string }

export function serializeBackup({ habits, log }: Backup, exportedAt: Date): string {
  return JSON.stringify({ app: APP, version: VERSION, exportedAt: exportedAt.toISOString(), habits, log }, null, 2)
}

export const backupFilename = (today: string) => `lockedin-backup-${today}.json`

export const countCheckIns = (log: Log) => Object.values(log).reduce((n, days) => n + Object.keys(days).length, 0)

// Backup files are untrusted input: reuse the storage validators and drop check-ins for unknown habits.
export function parseBackup(text: string): ParsedBackup {
  let raw: unknown
  try {
    raw = JSON.parse(text)
  } catch {
    return { ok: false, error: "That file isn't valid JSON." }
  }
  if (typeof raw !== 'object' || raw === null || !('app' in raw) || raw.app !== APP) {
    return { ok: false, error: "That file isn't a LockedIn backup." }
  }
  if (!('version' in raw) || typeof raw.version !== 'number' || raw.version > VERSION) {
    return { ok: false, error: 'That backup was made by a newer version of LockedIn.' }
  }
  const habits = parseHabits('habits' in raw ? raw.habits : null)
  const ids = new Set(habits.map((h) => h.id))
  const log = Object.fromEntries(
    Object.entries(parseLog('log' in raw ? raw.log : null)).filter(([id, days]) => ids.has(id) && Object.keys(days).length > 0),
  )
  return { ok: true, backup: { habits, log }, checkIns: countCheckIns(log) }
}
