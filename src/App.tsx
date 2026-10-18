import { useEffect, useMemo, useState } from 'react'
import { BottomRow } from './components/BottomRow'
import { HabitMatrix, type EditTarget } from './components/HabitMatrix'
import { TopRow } from './components/TopRow'
import { Logo } from './components/ui'
import { fromKey, toKey } from './lib/dates'
import { createHabit, dropFromLog, toggleLog, type Habit, type HabitDraft, type Log } from './lib/habits'
import type { View } from './lib/stats'
import { loadHabits, loadLog, saveHabits, saveLog } from './lib/storage'

/** Today's day key, kept current if the app stays open past midnight. */
function useToday(): string {
  const [today, setToday] = useState(() => toKey(new Date()))
  useEffect(() => {
    const id = setInterval(() => setToday(toKey(new Date())), 60_000)
    return () => clearInterval(id)
  }, [])
  return today
}

export default function App() {
  const today = useToday()
  const [habits, setHabits] = useState<Habit[]>(loadHabits)
  const [log, setLog] = useState<Log>(loadLog)
  const [focused, setFocused] = useState<string | null>(null)
  const [editing, setEditing] = useState<EditTarget>(null)

  useEffect(() => saveHabits(habits), [habits])
  useEffect(() => saveLog(log), [log])

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setFocused(null)
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])

  const view: View = useMemo(() => {
    const date = fromKey(today)
    return { habits, log, year: date.getFullYear(), month: date.getMonth(), today }
  }, [habits, log, today])

  const save = (draft: HabitDraft) => {
    if (editing && editing !== 'new') setHabits((hs) => hs.map((h) => (h.id === editing ? { ...h, ...draft } : h)))
    else setHabits((hs) => [...hs, createHabit(draft, today)])
    setEditing(null)
  }

  const remove = (id: string) => {
    setHabits((hs) => hs.filter((h) => h.id !== id))
    setLog((l) => dropFromLog(l, id))
    setFocused((f) => (f === id ? null : f))
    setEditing(null)
  }

  return (
    <main className="mx-auto flex min-h-dvh max-w-[1480px] flex-col gap-3 px-8 py-5 [@media(min-height:820px)]:h-dvh">
      <header className="flex h-9 shrink-0 items-center justify-between">
        <h1 className="flex items-center gap-2.5 text-[19px] font-extrabold tracking-[-0.035em]">
          <Logo size={26} />
          LockedIn
        </h1>
        <p className="text-[13px] text-muted">
          {fromKey(today).toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
        </p>
      </header>

      <TopRow view={view} />
      <HabitMatrix
        view={view}
        focused={focused}
        onFocus={setFocused}
        onToggle={(id, key) => setLog((l) => toggleLog(l, id, key))}
        editing={editing}
        onEdit={setEditing}
        onSave={save}
        onAddMany={(drafts) => setHabits((hs) => [...hs, ...drafts.map((d) => createHabit(d, today))])}
        onDelete={remove}
      />
      <BottomRow view={view} focused={focused} />
    </main>
  )
}
