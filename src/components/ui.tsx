import { useEffect, useRef, useState, type ReactNode } from 'react'

const DURATION = 600
const easeOut = (k: number) => 1 - Math.pow(1 - k, 3)
const reducedMotion = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches

/** Animates from the currently shown value to `target`, so rapid updates stay smooth. */
export function useCountUp(target: number): number {
  const [value, setValue] = useState(0)
  const shown = useRef(0)

  useEffect(() => {
    const from = shown.current
    const start = performance.now()
    const duration = reducedMotion() ? 0 : DURATION
    let frame = 0
    const step = (now: number) => {
      const k = duration === 0 ? 1 : Math.min(1, (now - start) / duration)
      shown.current = from + (target - from) * easeOut(k)
      setValue(shown.current)
      if (k < 1) frame = requestAnimationFrame(step)
    }
    frame = requestAnimationFrame(step)
    return () => cancelAnimationFrame(frame)
  }, [target])

  return value
}

export function Num({ value, decimals = 0, suffix = '' }: { value: number; decimals?: number; suffix?: string }) {
  return (
    <>
      {useCountUp(value).toFixed(decimals)}
      {suffix}
    </>
  )
}

export function Card({ className = '', children }: { className?: string; children: ReactNode }) {
  return <section className={`rounded-[14px] border border-line bg-card p-5 ${className}`}>{children}</section>
}

export const CardTitle = ({ children }: { children: ReactNode }) => (
  <h2 className="text-[14px] font-semibold tracking-[-0.01em] text-white">{children}</h2>
)

export const Tag = ({ children }: { children: ReactNode }) => (
  <span className="text-[11px] font-medium uppercase tracking-[0.08em] text-muted">{children}</span>
)

export function Ring({ pct, size, stroke, children }: { pct: number; size: number; stroke: number; children?: ReactNode }) {
  const r = (size - stroke) / 2
  const circumference = 2 * Math.PI * r
  const sweep = Math.min(1, Math.max(0, useCountUp(pct)))
  return (
    <div className="relative grid shrink-0 place-items-center" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="absolute inset-0 -rotate-90" aria-hidden>
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="var(--color-track)" strokeWidth={stroke} />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke="var(--color-lime)"
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={circumference * (1 - sweep)}
          opacity={sweep > 0.001 ? 1 : 0}
        />
      </svg>
      {children && <span className="relative">{children}</span>}
    </div>
  )
}

export function Logo({ size = 26 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" aria-hidden>
      <path d="M10 14V10.5a6 6 0 0 1 12 0V14" fill="none" stroke="var(--color-lime)" strokeWidth="3" strokeLinecap="round" />
      <rect x="5" y="13" width="22" height="16" rx="4.5" fill="var(--color-lime)" />
      <path d="m11.5 21 3.2 3.2 6-6.2" fill="none" stroke="#0a0a0a" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}
