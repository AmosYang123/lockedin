import type { ReactNode } from 'react'
import { MONTH_NAMES, dayOfMonth, daysInMonth, fromKey } from '../lib/dates'
import {
  avgDonePerDay, dayTotals, monthTotals, perfectDays, ratio, weekKeys, weekTotals, type View,
} from '../lib/stats'
import { Card, CardTitle, Num, Ring } from './ui'

const shortDate = (key: string, opts: Intl.DateTimeFormatOptions) => fromKey(key).toLocaleDateString('en-US', opts)

function CardHead({ title, aside }: { title: string; aside?: string }) {
  return (
    <div className="flex items-baseline justify-between gap-3">
      <CardTitle>{title}</CardTitle>
      {aside && <span className="text-[12px] text-muted">{aside}</span>}
    </div>
  )
}

const BigPct = ({ value }: { value: number }) => (
  <p className="text-[38px] leading-none font-bold tracking-[-0.035em]">
    <Num value={Math.round(value * 100)} suffix="%" />
  </p>
)

function Stat({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div>
      <p className="text-[12px] text-muted">{label}</p>
      <p className="mt-1 text-[17px] font-medium tracking-[-0.01em]">{children}</p>
    </div>
  )
}

function MonthOverview({ view }: { view: View }) {
  const total = daysInMonth(view.year, view.month)
  const inMonth = view.today.startsWith(`${view.year}-${String(view.month + 1).padStart(2, '0')}`)
  const day = inMonth ? dayOfMonth(view.today) : 0
  return (
    <Card className="flex flex-col justify-between">
      <h2 className="flex items-baseline gap-2">
        <span className="text-[30px] leading-none font-bold tracking-[-0.035em]">{MONTH_NAMES[view.month]}</span>
        <span className="text-[13px] text-muted">{view.year}</span>
      </h2>
      <div className="mt-4 grid grid-cols-4 gap-4">
        <Stat label="Day">
          <Num value={day} />
          <span className="text-muted">/{total}</span>
        </Stat>
        <Stat label="Perfect days">
          <Num value={perfectDays(view)} />
        </Stat>
        <Stat label="Avg / day">
          <Num value={avgDonePerDay(view)} decimals={1} />
        </Stat>
        <Stat label="Habits">
          <Num value={view.habits.length} />
        </Stat>
      </div>
    </Card>
  )
}

function TodayCard({ view }: { view: View }) {
  const totals = dayTotals(view, view.today)
  return (
    <Card className="flex flex-col justify-between">
      <CardHead title="Today" aside={shortDate(view.today, { weekday: 'short', month: 'short', day: 'numeric' })} />
      <div className="mt-3 flex items-end justify-between">
        <div>
          <BigPct value={ratio(totals)} />
          <p className="mt-2 text-[12px] text-muted">
            <Num value={totals.done} /> of <Num value={totals.scheduled} /> habits done
          </p>
        </div>
        <Ring pct={ratio(totals)} size={52} stroke={4} />
      </div>
    </Card>
  )
}

const WEEK_LETTERS = ['M', 'T', 'W', 'T', 'F', 'S', 'S']

function WeekBar({ pct, kind }: { pct: number; kind: 'past' | 'today' | 'future' }) {
  if (kind === 'future') return <div className="h-12 w-3.5 rounded-[5px] border border-white/12" />
  return (
    <div className="relative h-12 w-3.5 overflow-hidden rounded-[5px] bg-[#1c1c1c]">
      <div
        className={`absolute inset-x-0 bottom-0 rounded-[5px] transition-[height] duration-500 ease-out ${
          kind === 'today' ? 'bg-lime' : 'bg-[#d4cfcf]'
        }`}
        style={{ height: `${pct * 100}%` }}
      />
    </div>
  )
}

function WeekCard({ view }: { view: View }) {
  const keys = weekKeys(view.today)
  const sameMonth = keys[0].slice(0, 7) === keys[6].slice(0, 7)
  const range = `${shortDate(keys[0], { month: 'short', day: 'numeric' })} – ${shortDate(keys[6], sameMonth ? { day: 'numeric' } : { month: 'short', day: 'numeric' })}`
  return (
    <Card className="flex flex-col justify-between">
      <CardHead title="This week" aside={range} />
      <div className="mt-3 flex items-end justify-between gap-4">
        <div>
          <BigPct value={ratio(weekTotals(view))} />
          <p className="mt-2 text-[12px] text-muted">
            <Num value={weekTotals(view).done} /> of <Num value={weekTotals(view).scheduled} /> so far
          </p>
        </div>
        <div className="flex gap-1.5" aria-hidden>
          {keys.map((key, i) => {
            const totals = dayTotals(view, key)
            return (
              <div key={key} className="flex flex-col items-center gap-1.5">
                <WeekBar
                  pct={ratio(totals)}
                  kind={key === view.today ? 'today' : key > view.today || totals.scheduled === 0 ? 'future' : 'past'}
                />
                <span className={`text-[10px] ${key === view.today ? 'text-white' : 'text-muted'}`}>{WEEK_LETTERS[i]}</span>
              </div>
            )
          })}
        </div>
      </div>
    </Card>
  )
}

function ConsistencyCard({ view }: { view: View }) {
  const totals = monthTotals(view)
  return (
    <Card className="flex items-center gap-5">
      <Ring pct={ratio(totals)} size={96} stroke={6}>
        <span className="text-[26px] font-bold tracking-[-0.035em]">
          <Num value={Math.round(ratio(totals) * 100)} suffix="%" />
        </span>
      </Ring>
      <div>
        <CardTitle>Month consistency</CardTitle>
        <p className="mt-2 text-[17px] font-medium tracking-[-0.01em]">
          <Num value={totals.done} />
          <span className="text-muted"> / </span>
          <Num value={totals.scheduled} />
        </p>
        <p className="mt-0.5 text-[12px] text-muted">scheduled check-ins done</p>
      </div>
    </Card>
  )
}

export function TopRow({ view }: { view: View }) {
  return (
    <div className="grid grid-cols-[1.4fr_1fr_1.15fr_1.2fr] gap-3">
      <MonthOverview view={view} />
      <TodayCard view={view} />
      <WeekCard view={view} />
      <ConsistencyCard view={view} />
    </div>
  )
}
