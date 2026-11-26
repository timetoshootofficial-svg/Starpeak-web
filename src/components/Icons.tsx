/** Small stroke icons used across the site. All are decorative (aria-hidden). */
interface IconProps {
  className?: string
  size?: number
}

export function ArrowRight({ className, size = 16 }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 16 16" fill="none" aria-hidden="true" className={className}>
      <path d="M3 8h10M9 4l4 4-4 4" stroke="currentColor" strokeWidth="1.6" />
    </svg>
  )
}

export function Check({ className, size = 14 }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 16 16" fill="none" aria-hidden="true" className={className}>
      <path d="M3 8.5l3 3 7-7" stroke="currentColor" strokeWidth="1.5" />
    </svg>
  )
}

export function Play({ className, size = 14 }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" aria-hidden="true" className={className}>
      <path d="M8 5v14l11-7z" fill="currentColor" />
    </svg>
  )
}

export function Close({ className, size = 16 }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden="true" className={className}>
      <path d="M6 6l12 12M18 6L6 18" stroke="currentColor" strokeWidth="1.6" />
    </svg>
  )
}

export function Menu({ className, size = 18 }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden="true" className={className}>
      <path d="M3 8h18M3 16h18" stroke="currentColor" strokeWidth="1.5" />
    </svg>
  )
}

export function Star({ className, size = 12 }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" aria-hidden="true" className={className}>
      <path d="M12 1.5 L14 10 L22.5 12 L14 14 L12 22.5 L10 14 L1.5 12 L10 10 Z" fill="currentColor" />
    </svg>
  )
}
