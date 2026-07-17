// Простой набор line-иконок без внешних зависимостей (никаких новых npm-пакетов —
// меньше риска, что деплой упадёт из-за забытого package.json).

const base = { fill: 'none', strokeLinecap: 'round', strokeLinejoin: 'round' }

export function IconHome({ size = 20, color = 'currentColor', strokeWidth = 2 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" stroke={color} strokeWidth={strokeWidth} {...base}>
      <path d="M4 11.5 12 4l8 7.5" />
      <path d="M6 10v9a1 1 0 0 0 1 1h4v-6h2v6h4a1 1 0 0 0 1-1v-9" />
    </svg>
  )
}

export function IconTrophy({ size = 20, color = 'currentColor', strokeWidth = 2 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" stroke={color} strokeWidth={strokeWidth} {...base}>
      <path d="M7 4h10v5a5 5 0 0 1-10 0V4z" />
      <path d="M7 5H4a1 1 0 0 0-1 1c0 2.5 1.8 4.5 4 4.8" />
      <path d="M17 5h3a1 1 0 0 1 1 1c0 2.5-1.8 4.5-4 4.8" />
      <path d="M10 15.5v2.5M12 18v2M14 15.5v2.5" />
      <path d="M9 20.5h6" />
    </svg>
  )
}

export function IconWaves({ size = 20, color = 'currentColor', strokeWidth = 2 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" stroke={color} strokeWidth={strokeWidth} {...base}>
      <path d="M2 8c1.6-1.6 3.2-1.6 4.8 0s3.2 1.6 4.8 0 3.2-1.6 4.8 0 3.2 1.6 4.8 0" />
      <path d="M2 14c1.6-1.6 3.2-1.6 4.8 0s3.2 1.6 4.8 0 3.2-1.6 4.8 0 3.2 1.6 4.8 0" />
      <path d="M2 20c1.6-1.6 3.2-1.6 4.8 0s3.2 1.6 4.8 0 3.2-1.6 4.8 0 3.2 1.6 4.8 0" />
    </svg>
  )
}

export function IconShirt({ size = 20, color = 'currentColor', strokeWidth = 2 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" stroke={color} strokeWidth={strokeWidth} {...base}>
      <path d="M8 4 3 7v4l3-1v10h12V10l3 1V7l-5-3" />
      <path d="M8 4a4 4 0 0 0 8 0" />
    </svg>
  )
}

export function IconUser({ size = 20, color = 'currentColor', strokeWidth = 2 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" stroke={color} strokeWidth={strokeWidth} {...base}>
      <circle cx="12" cy="8" r="3.5" />
      <path d="M4.5 20c1-4 4-6 7.5-6s6.5 2 7.5 6" />
    </svg>
  )
}

export function IconRefresh({ size = 20, color = 'currentColor', strokeWidth = 2 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" stroke={color} strokeWidth={strokeWidth} {...base}>
      <path d="M20 11A8 8 0 0 0 6.3 6.3L4 8.5" />
      <path d="M4 4v4.5h4.5" />
      <path d="M4 13a8 8 0 0 0 13.7 4.7L20 15.5" />
      <path d="M20 20v-4.5h-4.5" />
    </svg>
  )
}

export function IconClock({ size = 20, color = 'currentColor', strokeWidth = 2 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" stroke={color} strokeWidth={strokeWidth} {...base}>
      <circle cx="12" cy="12" r="9" />
      <path d="M12 7v5l3.5 2" />
    </svg>
  )
}

export function IconFlag({ size = 20, color = 'currentColor', strokeWidth = 2 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" stroke={color} strokeWidth={strokeWidth} {...base}>
      <path d="M5 21V4" />
      <path d="M5 4h13l-3 4 3 4H5" />
    </svg>
  )
}

export function IconStar({ size = 20, color = 'currentColor', strokeWidth = 2 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" stroke={color} strokeWidth={strokeWidth} {...base}>
      <path d="M12 3.5l2.6 5.5 6 .8-4.4 4.2 1.1 6-5.3-2.9-5.3 2.9 1.1-6-4.4-4.2 6-.8z" />
    </svg>
  )
}

export function IconCrown({ size = 20, color = 'currentColor', strokeWidth = 2 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" stroke={color} strokeWidth={strokeWidth} {...base}>
      <path d="M4 18h16" />
      <path d="M4 18l-1-9 5 3.5L12 6l4 6.5 5-3.5-1 9z" />
    </svg>
  )
}

export function IconDroplet({ size = 20, color = 'currentColor', strokeWidth = 2 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" stroke={color} strokeWidth={strokeWidth} {...base}>
      <path d="M12 3s6.5 7 6.5 11.5a6.5 6.5 0 0 1-13 0C5.5 10 12 3 12 3z" />
    </svg>
  )
}

export function IconZap({ size = 20, color = 'currentColor', strokeWidth = 2 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" stroke={color} strokeWidth={strokeWidth} {...base}>
      <path d="M13 3 5 13h5l-1 8 8-10h-5l1-8z" />
    </svg>
  )
}

export function IconLogout({ size = 20, color = 'currentColor', strokeWidth = 2 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" stroke={color} strokeWidth={strokeWidth} {...base}>
      <path d="M15 4h3a1 1 0 0 1 1 1v14a1 1 0 0 1-1 1h-3" />
      <path d="M10 8l4 4-4 4" />
      <path d="M14 12H3" />
    </svg>
  )
}

export function IconPencil({ size = 14, color = 'currentColor', strokeWidth = 2 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" stroke={color} strokeWidth={strokeWidth} {...base}>
      <path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4z" />
    </svg>
  )
}
