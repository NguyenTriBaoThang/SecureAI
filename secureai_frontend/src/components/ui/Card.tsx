import type { HTMLAttributes } from 'react'

type CardProps = HTMLAttributes<HTMLDivElement> & {
  padded?: boolean
}

export function Card({ padded = true, className = '', ...props }: CardProps) {
  const classes = ['saiCard', padded ? 'saiCardPad' : '', className].filter(Boolean).join(' ')
  return <div className={classes} {...props} />
}

