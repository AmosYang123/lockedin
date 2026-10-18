import { useState, type FormEvent, type KeyboardEvent } from 'react'
import { HABIT_ICONS, NAME_MAX, normalizeSchedule, scheduleDays, type Habit, type HabitDraft } from '../lib/habits'
import { HABIT_ICON_COMPONENTS } from './icons'

// Monday-first, values are JS weekdays.
const DAYS: [number, string][] = [[1, 'M'], [2, 'T'], [3, 'W'], [4, 'T'], [5, 'F'], [6, 'S'], [0, 'S']]
const DAY_NAMES = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']

interface Props {
  habit?: Habit
  suggestions?: HabitDraft[]
  onSave: (draft: HabitDraft) => void
  onCancel: () => void
  onDelete?: () => void
}

const chip = (on: boolean) =>
  `h-7 rounded-[6px] text-[12px] font-medium transition-colors ${
    on ? 'bg-white/[0.1] text-white' : 'text-muted hover:bg-white/[0.04] hover:text-white'
  }`

export function HabitEditor({ habit, suggestions = [], onSave, onCancel, onDelete }: Props) {
  const [name, setName] = useState(habit?.name ?? '')
  const [icon, setIcon] = useState(habit?.icon ?? HABIT_ICONS[0])
  const [days, setDays] = useState<number[]>(scheduleDays(habit?.schedule ?? 'daily'))
  const [confirmDelete, setConfirmDelete] = useState(false)

  const trimmed = name.trim()
  const valid = trimmed.length > 0 && days.length > 0
  const toggleDay = (d: number) => setDays((ds) => (ds.includes(d) ? ds.filter((x) => x !== d) : [...ds, d]))

  const submit = (e: FormEvent) => {
    e.preventDefault()
    if (valid) onSave({ name: trimmed, icon, schedule: normalizeSchedule(days) })
  }

  const onKeyDown = (e: KeyboardEvent) => {
    if (e.key !== 'Escape') return
    e.stopPropagation()
    onCancel()
  }

  return (
    <form
      onSubmit={submit}
      onKeyDown={onKeyDown}
      aria-label={habit ? `Edit ${habit.name}` : 'New habit'}
      className="my-1 flex flex-col gap-3 rounded-[10px] border border-white/10 bg-white/[0.025] p-3"
    >
      {suggestions.length > 0 && (
        <div className="flex flex-wrap items-center gap-1.5">
          <span className="mr-1 text-[12px] text-muted">Quick fill</span>
          {suggestions.map((s) => {
            const Icon = HABIT_ICON_COMPONENTS[s.icon]
            return (
              <button
                key={s.name}
                type="button"
                onClick={() => {
                  setName(s.name)
                  setIcon(s.icon)
                  setDays(scheduleDays(s.schedule))
                }}
                className="flex h-7 items-center gap-1.5 rounded-[6px] border border-white/10 px-2 text-[12px] text-soft transition-colors hover:bg-white/[0.04] hover:text-white"
              >
                <Icon size={13} strokeWidth={1.75} className="text-muted" />
                {s.name}
              </button>
            )
          })}
        </div>
      )}
      <div className="flex flex-wrap items-center gap-3">
        <input
          autoFocus
          value={name}
          maxLength={NAME_MAX}
          onChange={(e) => setName(e.target.value)}
          placeholder="Habit name, e.g. Run 5k"
          aria-label="Habit name"
          className="h-8 w-64 rounded-[7px] border border-white/10 bg-canvas px-2.5 text-[13px] text-white placeholder:text-faint focus:border-white/25 focus:outline-none"
        />
        <div className="flex items-center gap-1" role="group" aria-label="Scheduled days">
          {DAYS.map(([d, letter]) => (
            <button
              key={d}
              type="button"
              aria-pressed={days.includes(d)}
              aria-label={DAY_NAMES[d]}
              onClick={() => toggleDay(d)}
              className={`${chip(days.includes(d))} w-7`}
            >
              {letter}
            </button>
          ))}
          <span className="mx-1 h-4 w-px bg-white/10" />
          <button type="button" onClick={() => setDays([0, 1, 2, 3, 4, 5, 6])} className={`${chip(days.length === 7)} px-2`}>
            Every day
          </button>
          <button
            type="button"
            onClick={() => setDays([1, 2, 3, 4, 5])}
            className={`${chip(days.length === 5 && !days.includes(0) && !days.includes(6))} px-2`}
          >
            Weekdays
          </button>
        </div>
        {days.length === 0 && <span className="text-[12px] text-amber">Pick at least one day.</span>}
      </div>

      <div className="flex items-center justify-between gap-3">
        <div className="flex flex-wrap gap-1" role="radiogroup" aria-label="Icon">
          {HABIT_ICONS.map((key) => {
            const Icon = HABIT_ICON_COMPONENTS[key]
            return (
              <button
                key={key}
                type="button"
                role="radio"
                aria-checked={icon === key}
                aria-label={key}
                onClick={() => setIcon(key)}
                className={`grid size-7 place-items-center rounded-[6px] transition-colors ${
                  icon === key ? 'bg-white/[0.1] text-white' : 'text-muted hover:bg-white/[0.04] hover:text-white'
                }`}
              >
                <Icon size={15} strokeWidth={1.75} />
              </button>
            )
          })}
        </div>
        <div className="flex shrink-0 items-center gap-2">
          {onDelete &&
            (confirmDelete ? (
              <button type="button" onClick={onDelete} className="h-8 rounded-[7px] px-3 text-[12px] font-medium text-danger hover:bg-danger/10">
                Delete habit and its history
              </button>
            ) : (
              <button type="button" onClick={() => setConfirmDelete(true)} className="h-8 rounded-[7px] px-3 text-[12px] font-medium text-muted hover:text-danger">
                Delete
              </button>
            ))}
          <button type="button" onClick={onCancel} className="h-8 rounded-[7px] px-3 text-[12px] font-medium text-soft hover:bg-white/[0.05] hover:text-white">
            Cancel
          </button>
          <button
            type="submit"
            disabled={!valid}
            className="h-8 rounded-[7px] bg-lime px-3.5 text-[12px] font-semibold text-canvas transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-35"
          >
            {habit ? 'Save' : 'Add habit'}
          </button>
        </div>
      </div>
    </form>
  )
}
