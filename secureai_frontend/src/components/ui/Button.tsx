import type { ButtonHTMLAttributes } from 'react'

type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger'

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: ButtonVariant
}

const variantClass: Record<ButtonVariant, string> = {
  primary: 'saiButtonPrimary',
  secondary: 'saiButtonSecondary',
  ghost: 'saiButtonGhost',
  danger: 'saiButtonDanger',
}

export function Button({ variant = 'primary', className = '', ...props }: ButtonProps) {
  const classes = ['saiButton', variantClass[variant], className].filter(Boolean).join(' ')
  return <button className={classes} {...props} />
}

