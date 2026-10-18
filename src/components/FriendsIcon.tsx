import { useId } from 'react'

export interface IconProps {
  size?: number
  strokeWidth?: number
  className?: string
}

const FRONT_BODY = 'M2.2 22v-2.2A5.2 5.2 0 0 1 7.4 14.2h.8A5.2 5.2 0 0 1 13.4 19.4V22'

// Lucide has no friendship glyph: two people side by side, the front one with an arm over the other's
// shoulder. The back figure is masked where the front one overlaps it.
export function FriendsIcon({ size = 24, strokeWidth = 2, className }: IconProps) {
  const maskId = `friends-${useId().replace(/[^\w-]/g, '')}`
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
    >
      <defs>
        <mask id={maskId}>
          <rect width="24" height="24" fill="#fff" />
          <path d={`${FRONT_BODY}Z`} fill="#000" stroke="#000" strokeWidth="3.6" />
          <circle cx="8.7" cy="7.4" r="5.2" fill="#000" stroke="none" />
        </mask>
      </defs>
      <g mask={`url(#${maskId})`}>
        <circle cx="15.3" cy="7.4" r="3.4" />
        <path d="M10.6 22v-2.2A5.2 5.2 0 0 1 15.8 14.2h.8A5.2 5.2 0 0 1 21.8 19.4V22" />
      </g>
      <circle cx="8.7" cy="7.4" r="3.4" />
      <path d={FRONT_BODY} />
      <path d="M10.6 15.4c2.7-1.9 6.4-2.2 9.6-.6" />
      <path d="M20.2 14.8c.6.4.9 1 .9 1.7" />
    </svg>
  )
}
