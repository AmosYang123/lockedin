import { useState } from 'react'
import { Check, Pencil, Plus } from 'lucide-react'
import { MONTH_NAMES, dayOfMonth, monthKeys, weekdayOf } from '../lib/dates'
import { SUGGESTIONS, scheduleLabel, type Habit, type HabitDraft } from '../lib/habits'
import { cellState, habitTotals, ratio, type CellState, type View } from '../lib/stats'
import { HabitEditor } from './HabitEditor'
import { HABIT_ICON_COMPONENTS } from './icons'
import { Card, CardTitle, Num, Tag } from './ui'

const WEEKDAY_LETTERS = ['S', 'M', 'T', 'W', 'T', 'F', 'S']

const LEGEND: [CellState, string][] = [
  ['completed', 'Done'],
  ['missed', 'Missed'],
  ['due', 'Due today'],
  ['upcoming', 'Upcoming'],
  ['unscheduled', 'Rest day'],
]

const TOGGLEABLE: CellState[] = ['completed', 'missed', 'due', 'untracked']

function Glyph({ state, size = 16 }: { state: CellState; size?: number }) {
  const box = { width: size, height: size }
  switch (state) {
    case 'completed':
      return (
        <span style={box} className="grid place-items-center rounded-[4px] bg-done-cell text-check">
          <Check size={size * 0.7} strokeWidth={3.5} />
        </span>
      )
    case 'missed':
      return <span style={box} className="block rounded-[4px] bg-missed-cell" />
    case 'due':
      return (
        <span style={box} className="grid place-items-center rounded-[4px] border-[1.5px] border-due text-due">
          <Check size={size * 0.6} strokeWidth={3} />
        </span>
      )
    case 'upcoming':
      return <span style={box} className="block rounded-[4px] border border-white/[0.07] bg-[#151515]" />
    case 'unscheduled':
      return <span className="block size-[3px] rounded-full bg-faint" />
    case 'untracked':
      return <span className="block h-[1.5px] w-2 rounded-full bg-[#2e2e2e]" />
  }
}

export type EditTarget = string | 'new' | null

interface Props {
  view: View
  focused: string | null
  onFocus: (habitId: string | null) => void
  onToggle: (habitId: string, key: string) => void
  editing: EditTarget
  onEdit: (target: EditTarget) => void
  onSave: (draft: HabitDraft) => void
  onAddMany: (drafts: HabitDraft[]) => void
  onDelete: (habitId: string) => void
}

export function HabitMatrix({ view, focused, onFocus, onToggle, editing, onEdit, onSave, onAddMany, onDelete }: Props) {
  const keys = monthKeys(view.year, view.month)
  const columns = `196px repeat(${keys.length}, minmax(0, 1fr)) 120px`
  const colClass = (key: string) =>
    `${key === view.today ? 'bg-white/[0.035]' : ''} ${weekdayOf(key) === 1 ? 'border-l border-white/[0.045]' : ''}`
  const empty = view.habits.length === 0
  const editor = (habit?: Habit) => (
    <HabitEditor
      key={habit?.id ?? 'new'}
      habit={habit}
      suggestions={habit ? [] : SUGGESTIONS.filter((s) => !view.habits.some((h) => h.name === s.name))}
      onSave={onSave}
      onCancel={() => onEdit(null)}
      onDelete={habit && (() => onDelete(habit.id))}
    />
  )

  return (
    <Card>
      <div className="flex items-center justify-between">
        <CardTitle>Habit matrix</CardTitle>
        {!empty && (
          <div className="flex gap-4">
            {LEGEND.map(([state, label]) => (
              <span key={state} className="flex items-center gap-1.5 text-[11px] text-muted">
                <span className="grid size-2.5 place-items-center">
                  <Glyph state={state} size={10} />
                </span>
                {label}
              </span>
            ))}
          </div>
        )}
      </div>

      {empty && editing !== 'new' ? (
        <EmptyState onAdd={onAddMany} onCustom={() => onEdit('new')} />
      ) : (
        <div className="mt-3" role="table" aria-label={`${MONTH_NAMES[view.month]} habit matrix`}>
          <div className="grid" style={{ gridTemplateColumns: columns }} role="row">
            <div className="flex items-end pb-2" role="columnheader">
              <Tag>Habit</Tag>
            </div>
            {keys.map((key) => {
              const weekend = [0, 6].includes(weekdayOf(key))
              return (
                <div key={key} role="columnheader" className={`flex flex-col items-center gap-1 rounded-t-md pt-1 pb-2 ${colClass(key)}`}>
                  <span className={`text-[10px] font-medium ${weekend ? 'text-faint' : 'text-muted'}`}>
                    {WEEKDAY_LETTERS[weekdayOf(key)]}
                  </span>
                  <span className={`text-[12px] font-medium ${key === view.today ? 'text-amber' : 'text-soft'}`}>
                    {dayOfMonth(key)}
                  </span>
                </div>
              )
            })}
            <div className="flex items-end justify-end pb-2" role="columnheader">
              <Tag>Rate</Tag>
            </div>
          </div>

          {view.habits.map((habit) =>
            editing === habit.id ? (
              editor(habit)
            ) : (
              <HabitRow
                key={habit.id}
                habit={habit}
                view={view}
                keys={keys}
                columns={columns}
                colClass={colClass}
                focused={focused === habit.id}
                dimmed={focused !== null && focused !== habit.id}
                onFocus={() => onFocus(focused === habit.id ? null : habit.id)}
                onEdit={() => onEdit(habit.id)}
                onToggle={onToggle}
              />
            ),
          )}

          {editing === 'new' ? (
            editor()
          ) : (
            <button
              type="button"
              onClick={() => onEdit('new')}
              className="mt-1 -ml-2 flex h-8 items-center gap-2 rounded-[6px] px-2 text-[12px] font-medium text-muted transition-colors hover:bg-white/[0.03] hover:text-white"
            >
              <Plus size={14} strokeWidth={2} />
              Add habit
            </button>
          )}
        </div>
      )}
    </Card>
  )
}

function EmptyState({ onAdd, onCustom }: { onAdd: (drafts: HabitDraft[]) => void; onCustom: () => void }) {
  const [picked, setPicked] = useState<string[]>([])
  const toggle = (name: string) => setPicked((p) => (p.includes(name) ? p.filter((n) => n !== name) : [...p, name]))
  return (
    <div className="flex flex-col items-start py-6">
      <p className="text-[20px] font-bold tracking-[-0.025em]">Nothing locked in yet.</p>
      <p className="mt-1.5 max-w-[60ch] text-[13px] text-muted">
        Pick the habits you want to keep, or make your own. Each gets a row here; tick it off on the days it's
        scheduled and every number on this screen follows.
      </p>
      <div className="mt-5 flex max-w-[960px] flex-wrap gap-2">
        {SUGGESTIONS.map((s) => {
          const Icon = HABIT_ICON_COMPONENTS[s.icon]
          const on = picked.includes(s.name)
          return (
            <button
              key={s.name}
              type="button"
              aria-pressed={on}
              onClick={() => toggle(s.name)}
              className={`flex h-9 items-center gap-2 rounded-[8px] border px-3 text-[13px] font-medium transition-colors ${
                on
                  ? 'border-lime/60 bg-lime/[0.08] text-white'
                  : 'border-white/10 text-soft hover:border-white/20 hover:bg-white/[0.04] hover:text-white'
              }`}
            >
              {on ? (
                <Check size={15} strokeWidth={2.5} className="text-lime" />
              ) : (
                <Icon size={15} strokeWidth={1.75} className="text-muted" />
              )}
              {s.name}
              <span className="text-[11px] text-faint">{scheduleLabel(s.schedule)}</span>
            </button>
          )
        })}
      </div>
      <div className="mt-4 flex gap-2">
        <button
          type="button"
          disabled={picked.length === 0}
          onClick={() => onAdd(SUGGESTIONS.filter((s) => picked.includes(s.name)))}
          className="h-9 rounded-[8px] bg-lime px-4 text-[13px] font-semibold text-canvas transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-35"
        >
          {picked.length === 0 ? 'Pick habits to lock in' : `Lock in ${picked.length} habit${picked.length === 1 ? '' : 's'}`}
        </button>
        <button
          type="button"
          onClick={onCustom}
          className="flex h-9 items-center gap-1.5 rounded-[8px] border border-white/10 px-3 text-[13px] font-medium text-soft transition-colors hover:bg-white/[0.04] hover:text-white"
        >
          <Plus size={15} strokeWidth={2.25} />
          Custom habit
        </button>
      </div>
    </div>
  )
}

interface RowProps {
  habit: Habit
  view: View
  keys: string[]
  columns: string
  colClass: (key: string) => string
  focused: boolean
  dimmed: boolean
  onFocus: () => void
  onEdit: () => void
  onToggle: (habitId: string, key: string) => void
}

function HabitRow({ habit, view, keys, columns, colClass, focused, dimmed, onFocus, onEdit, onToggle }: RowProps) {
  const Icon = HABIT_ICON_COMPONENTS[habit.icon]
  const pct = ratio(habitTotals(view, habit))
  return (
    <div
      role="row"
      className={`group grid rounded-md transition-opacity duration-200 hover:bg-white/[0.02] ${dimmed ? 'opacity-35' : ''}`}
      style={{ gridTemplateColumns: columns }}
    >
      <div className="flex h-[34px] items-center gap-1 pr-3" role="rowheader">
        <button
          type="button"
          aria-pressed={focused}
          title={scheduleLabel(habit.schedule)}
          onClick={onFocus}
          className={`-ml-2 flex h-7 min-w-0 flex-1 items-center gap-2.5 rounded-[6px] border px-2 text-left text-[13px] font-medium transition-colors ${
            focused ? 'border-[#8cc4ff] text-white' : 'border-transparent text-[#e6e6e6] hover:text-white'
          }`}
        >
          <Icon size={15} strokeWidth={1.75} className="shrink-0 text-muted" />
          <span className="truncate">{habit.name}</span>
        </button>
        <button
          type="button"
          onClick={onEdit}
          aria-label={`Edit ${habit.name}`}
          className="grid size-6 shrink-0 place-items-center rounded-[5px] text-muted opacity-0 transition-opacity group-hover:opacity-100 hover:bg-white/[0.06] hover:text-white focus-visible:opacity-100"
        >
          <Pencil size={12} strokeWidth={2} />
        </button>
      </div>
      {keys.map((key) => {
        const state = cellState(habit, view, key)
        const cell = `grid h-[34px] place-items-center ${colClass(key)}`
        return TOGGLEABLE.includes(state) ? (
          <button
            key={key}
            type="button"
            role="cell"
            aria-label={`${habit.name}, ${MONTH_NAMES[view.month]} ${dayOfMonth(key)}: ${state}`}
            aria-pressed={state === 'completed'}
            onClick={() => onToggle(habit.id, key)}
            className={`${cell} cursor-pointer transition-transform active:scale-90`}
          >
            <Glyph state={state} />
          </button>
        ) : (
          <div key={key} role="cell" className={cell}>
            <Glyph state={state} />
          </div>
        )
      })}
      <div role="cell" className="flex h-[34px] items-center gap-2.5 pl-4">
        <div className="h-[3px] flex-1 rounded-full bg-track">
          <div className="h-full rounded-full bg-amber transition-[width] duration-500 ease-out" style={{ width: `${pct * 100}%` }} />
        </div>
        <span className="w-9 text-right text-[12px] text-soft">
          <Num value={Math.round(pct * 100)} suffix="%" />
        </span>
      </div>
    </div>
  )
}
