import { COLORS } from './theme'
import { IconWaves } from './Icons'

// Прогресс внутри текущей стадии: ряд точек + плавающий процент справа —
// как на референсе home_new.png
export function StageProgressBar({ progress = 0, color = COLORS.blue, dotCount = 16 }) {
  const filled = Math.round((progress / 100) * dotCount)
  const dots = Array.from({ length: dotCount })
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
      <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: 5 }}>
        {dots.map((_, i) => {
          const isLeading = i === filled - 1
          const isFilled = i < filled
          if (isLeading) {
            return (
              <div key={i} style={{
                width: 22, height: 22, borderRadius: '50%', background: color,
                display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
              }}>
                <IconWaves size={12} color="#fff" strokeWidth={2.4} />
              </div>
            )
          }
          return (
            <div key={i} style={{
              flex: 1, height: 4, borderRadius: 2, minWidth: 3,
              background: isFilled ? color : COLORS.border,
            }} />
          )
        })}
      </div>
      <div style={{
        background: COLORS.card, border: `1px solid ${COLORS.border}`, borderRadius: 20,
        padding: '5px 12px', fontSize: 12, fontWeight: 700, color: COLORS.textPrimary,
        boxShadow: '0 2px 6px rgba(16,35,61,0.06)',
      }}>
        {Math.round(progress)}%
      </div>
    </div>
  )
}

// Путь пловца — 6 узлов-стадий соединённых линией. Линия и текущий узел
// подсвечены цветом, остальные узлы нейтральные (как в референсе) —
// прогресс считывается по цвету линии, а не по заливке пройденных узлов.
export function StagePath({ stages, currentIndex, icons }) {
  return (
    <div style={{ display: 'flex', alignItems: 'flex-start' }}>
      {stages.map((s, i) => {
        const isCurrent = i === currentIndex
        const Icon = icons[i]
        return (
          <div key={s.key} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', position: 'relative' }}>
            {i > 0 && (
              <div style={{
                position: 'absolute', top: 20, right: '50%', width: '100%', height: 2,
                background: i <= currentIndex ? COLORS.blue : COLORS.border, zIndex: 0,
              }} />
            )}
            <div style={{
              width: 40, height: 40, borderRadius: '50%', zIndex: 1,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              background: isCurrent ? COLORS.blue : COLORS.card,
              border: `2px solid ${isCurrent ? COLORS.blue : COLORS.borderStrong}`,
            }}>
              <Icon size={17} color={isCurrent ? '#fff' : COLORS.textMuted} strokeWidth={2.2} />
            </div>
            <div style={{
              fontSize: 8, fontWeight: isCurrent ? 700 : 500, marginTop: 6, textAlign: 'center',
              color: isCurrent ? COLORS.blue : COLORS.textMuted, textTransform: 'uppercase', letterSpacing: 0.4,
            }}>{s.label}</div>
          </div>
        )
      })}
    </div>
  )
}

// Маленькая версия пути (внутри карточки-героя) — просто ряд точек
export function MiniStagePath({ count = 6, currentIndex = 0, color = '#fff' }) {
  return (
    <div style={{ display: 'flex', gap: 4 }}>
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} style={{
          width: 6, height: 6, borderRadius: '50%',
          background: i <= currentIndex ? color : 'rgba(255,255,255,0.28)',
        }} />
      ))}
    </div>
  )
}
