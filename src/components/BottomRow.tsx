import { Flame } from 'lucide-react'
import { MONTH_NAMES, daysInMonth } from '../lib/dates'
import { monotonePath } from '../lib/path'
import { dailyCompletion, rankHabits, rankStreaks, type View } from '../lib/stats'
import { Card, CardTitle, Num, Tag } from './ui'

// The line is drawn in a fixed viewBox stretched to the card; labels and the end dot are HTML
// positioned by percentage so they don't distort with it.
const W = 600
const H = 200
const X_TICKS = [1, 5, 10, 15, 20, 25, 30]
const Y_TICKS = [100, 50, 0]

const dimClass = (focused: string | null, id: string) =>
  `transition-opacity duration-200 ${focused !== null && focused !== id ? 'opacity-35' : ''}`

function TrendCard({ view }: { view: View }) {
  const days = daysInMonth(view.year, view.month)
  const xPct = (day: number) => ((day - 1) / (days - 1)) * 100
  const series = dailyCompletion(view)
  const path = monotonePath(series.map(({ day, pct }) => [(xPct(day) / 100) * W, H - pct * H]))
  const last = series.at(-1)

  return (
    <Card className="flex min-h-0 flex-col">
      <div className="flex items-center justify-between">
        <CardTitle>Consistency trend</CardTitle>
        <div className="flex items-center gap-4">
          <span className="flex items-center gap-1.5 text-[12px] text-soft">
            <span className="size-1.5 rounded-full bg-amber" />
            Daily completion
          </span>
          <Tag>{MONTH_NAMES[view.month]}</Tag>
        </div>
      </div>

      <div className="mt-4 grid min-h-0 flex-1 grid-cols-[36px_1fr] grid-rows-[1fr_20px]">
        <div className="relative">
          {Y_TICKS.map((t) => (
            <span key={t} className="absolute -translate-y-1/2 text-[11px] text-muted" style={{ top: `${100 - t}%` }}>
              {t}%
            </span>
          ))}
        </div>
        <div className="relative">
          {Y_TICKS.map((t) => (
            <div key={t} className="absolute inset-x-0 border-t border-white/[0.05]" style={{ top: `${100 - t}%` }} />
          ))}
          {series.length < 2 && (
            <p className="absolute inset-0 grid place-items-center text-[12px] text-muted">
              The line starts after your second tracked day.
            </p>
          )}
          <svg viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="none" className="absolute inset-0 size-full overflow-visible" aria-hidden>
            <path d={path} fill="none" stroke="var(--color-amber)" strokeWidth={1.5} vectorEffect="non-scaling-stroke" />
          </svg>
          {last && (
            <span
              className="absolute size-[7px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-amber ring-4 ring-amber/15"
              style={{ left: `${xPct(last.day)}%`, top: `${(1 - last.pct) * 100}%` }}
            />
          )}
        </div>
        <div />
        <div className="relative">
          {X_TICKS.filter((d) => d <= days).map((d) => (
            <span key={d} className="absolute top-1.5 -translate-x-1/2 text-[11px] text-muted" style={{ left: `${xPct(d)}%` }}>
              {d}
            </span>
          ))}
        </div>
      </div>
    </Card>
  )
}

function TopHabitsCard({ view, focused }: { view: View; focused: string | null }) {
  return (
    <Card className="min-h-0">
      <div className="flex items-center justify-between">
        <CardTitle>Top habits</CardTitle>
        <Tag>{MONTH_NAMES[view.month]}</Tag>
      </div>
      {view.habits.length === 0 && <p className="mt-3 text-[12px] text-muted">Your best habits this month land here.</p>}
      <ol className="mt-3 flex flex-col">
        {rankHabits(view)
          .slice(0, 5)
          .map(({ habit, done, scheduled, pct }, i) => (
            <li key={habit.id} className={`flex h-8 items-center gap-3 ${dimClass(focused, habit.id)}`}>
              <span className="w-4 text-[12px] text-faint">{i + 1}</span>
              <span className="flex-1 truncate text-[13px] font-medium">{habit.name}</span>
              <span className="text-[12px] text-muted">
                {done}/{scheduled}
              </span>
              <span className="w-10 text-right text-[13px] font-semibold">
                {scheduled === 0 ? <span className="text-faint">—</span> : <Num value={Math.round(pct * 100)} suffix="%" />}
              </span>
            </li>
          ))}
      </ol>
    </Card>
  )
}

function StreaksCard({ view, focused }: { view: View; focused: string | null }) {
  const rows = rankStreaks(view)
    .filter((r) => r.current > 0 || r.best > 0)
    .slice(0, 5)
  return (
    <Card className="min-h-0">
      <div className="flex items-center justify-between">
        <CardTitle>Streaks</CardTitle>
        <Tag>Current · best</Tag>
      </div>
      {rows.length === 0 ? (
        <p className="mt-3 text-[12px] leading-relaxed text-muted">Nothing running yet. Check off a habit today to start one.</p>
      ) : (
        <ul className="mt-3 flex flex-col">
          {rows.map(({ habit, current, best }) => (
            <li key={habit.id} className={`flex h-8 items-center gap-3 ${dimClass(focused, habit.id)}`}>
              <span className="flex-1 truncate text-[13px] font-medium">{habit.name}</span>
              <span className={`flex items-center gap-1 text-[13px] font-semibold ${current > 0 ? 'text-white' : 'text-faint'}`}>
                <Flame size={13} strokeWidth={2} className={current > 0 ? 'text-amber' : 'text-faint'} />
                <Num value={current} />
              </span>
              <span className="w-8 text-right text-[12px] text-muted">{best}</span>
            </li>
          ))}
        </ul>
      )}
    </Card>
  )
}

export function BottomRow({ view, focused }: { view: View; focused: string | null }) {
  return (
    <div className="grid min-h-[208px] flex-1 grid-cols-[1.5fr_1fr_1fr] gap-3">
      <TrendCard view={view} />
      <TopHabitsCard view={view} focused={focused} />
      <StreaksCard view={view} focused={focused} />
    </div>
  )
}
