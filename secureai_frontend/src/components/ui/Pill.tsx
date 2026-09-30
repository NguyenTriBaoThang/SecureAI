import type { HTMLAttributes, ReactNode } from 'react'

type PillKind = 'neutral' | 'info' | 'success' | 'warning' | 'danger'

type PillProps = HTMLAttributes<HTMLSpanElement> & {
  kind?: PillKind
  children: ReactNode
}

const kindClass: Record<PillKind, string> = {
  neutral: 'saiPillNeutral',
  info: 'saiPillInfo',
  success: 'saiPillSuccess',
  warning: 'saiPillWarning',
  danger: 'saiPillDanger',
}

export function Pill({ kind = 'neutral', className = '', children, ...props }: PillProps) {
  const classes = ['saiPill', kindClass[kind], className].filter(Boolean).join(' ')
  return <span className={classes} {...props}>{children}</span>
}

