import { useState, useEffect, useRef } from 'react'
import { COLORS, FONTS, STAGE_COLORS } from './theme'
import { StageProgressBar, StagePath, MiniStagePath } from './LaneRope'
import {
  IconHome, IconTrophy, IconWaves, IconShirt, IconUser, IconRefresh,
  IconClock, IconFlag, IconStar, IconCrown, IconDroplet, IconZap, IconLogout, IconPencil,
} from './Icons'

const API = import.meta.env.VITE_API_URL || 'http://localhost:3001'

const STAGES = [
  { key: 'novice',   label: 'Новичок',  min: 0,    next: 100  },
  { key: 'swimmer',  label: 'Пловец',   min: 100,  next: 500  },
  { key: 'athlete',  label: 'Атлет',    min: 500,  next: 1500 },
  { key: 'champion', label: 'Чемпион',  min: 1500, next: 3000 },
  { key: 'legend',   label: 'Легенда',  min: 3000, next: 5000 },
  { key: 'neptune',  label: 'Нептун',   min: 5000, next: 9999 },
]
const STAGE_ICONS = [IconDroplet, IconWaves, IconZap, IconTrophy, IconStar, IconCrown]

function getStage(km) {
  for (let i = STAGES.length - 1; i >= 0; i--) {
    if (km >= STAGES[i].min) return STAGES[i]
  }
  return STAGES[0]
}

const CHAR_IMAGES = {
  novice_m: '/chars/novice_m.png',     novice_f: '/chars/novice_f.png',
  swimmer_m: '/chars/swimmer_m.png',   swimmer_f: '/chars/swimmer_f.png',
  athlete_m: '/chars/athlete_m.png',   athlete_f: '/chars/athlete_f.png',
  champion_m: '/chars/champion_m.png', champion_f: '/chars/champion_f.png',
  legend_m: '/chars/legend_m.png',     legend_f: '/chars/legend_f.png',
  neptune_m: '/chars/neptune_m.png',   neptune_f: '/chars/neptune_f.png',
}

const NAV_ITEMS = [
  { id: 'home', Icon: IconHome, label: 'Главная' },
  { id: 'rank', Icon: IconTrophy, label: 'Рейтинг' },
  { id: 'sync', Icon: IconWaves, label: 'Синк', center: true },
  { id: 'gear', Icon: IconShirt, label: 'Снаряжение' },
  { id: 'profile', Icon: IconUser, label: 'Профиль' },
]

export default function App() {
  const [token, setToken] = useState(localStorage.getItem('token'))
  const [user, setUser] = useState(null)
  const [leaderboard, setLeaderboard] = useState([])
  const [syncing, setSyncing] = useState(false)
  const [nav, setNav] = useState('home')
  const [levelUpStage, setLevelUpStage] = useState(null)
  const lastStageRef = useRef(null)

  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const t = params.get('token')
    if (t) {
      localStorage.setItem('token', t)
      setToken(t)
      window.history.replaceState({}, '', '/')
    }
  }, [])

  useEffect(() => {
    if (!token) return
    fetch(`${API}/api/me`, { headers: { Authorization: `Bearer ${token}` } })
      .then(r => r.json())
      .then(data => {
        if (data.error) { localStorage.removeItem('token'); setToken(null) }
        else setUser(data)
      })
      .catch(() => { localStorage.removeItem('token'); setToken(null) })
  }, [token])

  useEffect(() => {
    if (!token) return
    fetch(`${API}/api/leaderboard`, { headers: { Authorization: `Bearer ${token}` } })
      .then(r => r.json())
      .then(setLeaderboard)
  }, [token, user])

  useEffect(() => {
    if (!user) return
    const stageKey = `lastStage_${user.id}`
    const currentStage = getStage(user.totalKm)
    const currentIndex = STAGES.findIndex(s => s.key === currentStage.key)
    const stored = localStorage.getItem(stageKey)
    if (stored === null) {
      localStorage.setItem(stageKey, String(currentIndex))
      lastStageRef.current = currentIndex
      return
    }
    const storedIndex = Number(stored)
    if (currentIndex > storedIndex) {
      setLevelUpStage(currentStage)
      localStorage.setItem(stageKey, String(currentIndex))
    }
    lastStageRef.current = currentIndex
  }, [user])

  async function sync() {
    setSyncing(true)
    const r = await fetch(`${API}/api/sync`, { method: 'POST', headers: { Authorization: `Bearer ${token}` } })
    const data = await r.json()
    setUser(u => ({ ...u, totalKm: data.totalKm, workoutsCount: data.workoutsCount }))
    setSyncing(false)
  }

  function logout() {
    localStorage.removeItem('token')
    setToken(null)
    setUser(null)
  }

  if (!token) return <LoginScreen />
  if (!user) return <LoadingScreen />

  const stage = getStage(user.totalKm)
  const stageIndex = STAGES.findIndex(s => s.key === stage.key)
  const charKey = `${stage.key}_${user.gender}`
  const charImg = CHAR_IMAGES[charKey]
  const xpPct = Math.min(100, ((user.totalKm - stage.min) / (stage.next - stage.min)) * 100)
  const myRank = leaderboard.findIndex(u => u.id === user.id) + 1
  const stageColor = STAGE_COLORS[stageIndex]

  return (
    <div style={{ maxWidth: 480, margin: '0 auto', minHeight: '100vh', background: COLORS.page, fontFamily: FONTS.body, color: COLORS.textPrimary, position: 'relative' }}>
      {levelUpStage && (
        <LevelUpOverlay
          stage={levelUpStage}
          color={STAGE_COLORS[STAGES.findIndex(s => s.key === levelUpStage.key)]}
          charImg={CHAR_IMAGES[`${levelUpStage.key}_${user.gender}`]}
          onClose={() => setLevelUpStage(null)}
        />
      )}

      <TopBar syncing={syncing} onSync={sync} />

      {nav === 'home' && (
        <HomeView user={user} stage={stage} stageIndex={stageIndex} charImg={charImg} xpPct={xpPct} myRank={myRank} stageColor={stageColor} leaderboard={leaderboard} onSeeAll={() => setNav('rank')} />
      )}
      {nav === 'rank' && <RankView user={user} leaderboard={leaderboard} />}
      {nav === 'gear' && <PlaceholderView Icon={IconShirt} title="Снаряжение" text="Инвентарь и полка наград скоро появятся здесь — экипировка и медали за пройденные челленджи." />}
      {nav === 'profile' && <ProfileView user={user} stage={stage} onLogout={logout} onSync={sync} syncing={syncing} />}

      <BottomNav nav={nav} setNav={setNav} onSync={sync} />
    </div>
  )
}

// ── Логотип ──────────────────────────────────────────────────

function Logo({ size = 'md' }) {
  const big = size === 'lg'
  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
        <svg width={big ? 30 : 22} height={big ? 20 : 15} viewBox="0 0 30 20" fill="none">
          <path d="M2 14c1.6-1.6 3.2-1.6 4.8 0s3.2 1.6 4.8 0 3.2-1.6 4.8 0 3.2 1.6 4.8 0" stroke={COLORS.blue} strokeWidth="2" strokeLinecap="round" />
          <circle cx="22" cy="6" r="2.4" fill={COLORS.blue} />
          <path d="M11 8c2-3 6-3.5 9-2" stroke={COLORS.blueDark} strokeWidth="2" strokeLinecap="round" />
        </svg>
      </div>
      <div style={{ fontFamily: FONTS.display, fontWeight: 800, fontSize: big ? 34 : 24, letterSpacing: 0.5, lineHeight: 1, marginTop: 2 }}>
        <span style={{ color: COLORS.blueDark }}>100</span><span style={{ color: COLORS.blue }}>JUZ</span>
      </div>
      <div style={{ fontSize: big ? 11 : 9, color: COLORS.textMuted, letterSpacing: big ? 3 : 2, fontWeight: 600, marginTop: 2 }}>SWIM RPG</div>
    </div>
  )
}

// ── Топ-бар ──────────────────────────────────────────────────

function TopBar({ syncing, onSync }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', padding: '16px 16px 8px', position: 'sticky', top: 0, zIndex: 100, background: COLORS.page }}>
      <Logo />
      <button onClick={onSync} disabled={syncing} style={{
        display: 'flex', alignItems: 'center', gap: 6, background: COLORS.card,
        border: `1.5px solid ${COLORS.strava}`, borderRadius: 20, padding: '8px 16px',
        color: COLORS.strava, fontSize: 13, fontWeight: 700, cursor: 'pointer', fontFamily: FONTS.body,
      }}>
        <IconRefresh size={14} strokeWidth={2.4} style={{ animation: syncing ? 'spin 1s linear infinite' : 'none' }} />
        Strava
      </button>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  )
}

// ── Вкладка "Главная" ──────────────────────────────────────────

function HomeView({ user, stage, stageIndex, charImg, xpPct, myRank, stageColor, leaderboard, onSeeAll }) {
  return (
    <div style={{ padding: '8px 16px 16px' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, margin: '8px 0 16px' }}>
        <img src={user.avatar} style={{ width: 56, height: 56, borderRadius: '50%', border: `2.5px solid ${stageColor}`, objectFit: 'cover' }} alt="" />
        <div>
          <div style={{ fontFamily: FONTS.display, fontSize: 19, fontWeight: 700, color: COLORS.textPrimary }}>{user.name}</div>
          <div style={{ fontSize: 12, color: stageColor, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0.5 }}>{stage.label} · #{myRank}</div>
        </div>
      </div>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 8 }}>
        <span style={{ fontSize: 11, color: COLORS.textSecondary, textTransform: 'uppercase', letterSpacing: 1, fontWeight: 600 }}>Прогресс стадии</span>
        <span style={{ fontSize: 13, fontWeight: 700 }}><span style={{ color: COLORS.blue }}>{user.totalKm.toFixed(1)}</span> <span style={{ color: COLORS.textMuted }}>/ {stage.next} км</span></span>
      </div>
      <div style={{ marginBottom: 18 }}>
        <StageProgressBar progress={xpPct} color={stageColor} />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10, marginBottom: 16 }}>
        <StatCard Icon={IconWaves} label="Км всего" value={user.totalKm.toFixed(1)} />
        <StatCard Icon={IconClock} label="Тренировок" value={user.workoutsCount} />
        <StatCard Icon={IconTrophy} label="Рейтинг" value={`#${myRank}`} />
      </div>

      <div style={{
        background: `linear-gradient(135deg, ${COLORS.heroFrom}, ${COLORS.heroTo})`, borderRadius: 20,
        padding: '20px 18px', display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between',
        marginBottom: 18, position: 'relative', overflow: 'hidden', minHeight: 190,
      }}>
        <div style={{ position: 'absolute', width: 160, height: 160, borderRadius: '50%', background: 'rgba(255,255,255,0.06)', top: -50, right: -30 }} />
        {charImg && <img src={charImg} style={{ height: 200, width: 'auto', objectFit: 'contain', position: 'relative', zIndex: 1, marginBottom: -20 }} alt={stage.label} />}
        <div style={{ position: 'relative', zIndex: 1, textAlign: 'right', paddingBottom: 6 }}>
          <div style={{ fontSize: 10, color: COLORS.textOnDarkMuted, textTransform: 'uppercase', letterSpacing: 1.5, fontWeight: 600, marginBottom: 2 }}>Текущая стадия</div>
          <div style={{ fontFamily: FONTS.display, fontSize: 22, fontWeight: 700, color: '#fff', marginBottom: 8 }}>{stage.label}</div>
          <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 12 }}>
            <MiniStagePath count={STAGES.length} currentIndex={stageIndex} />
          </div>
          <div style={{ fontSize: 9, color: COLORS.textOnDarkMuted, textTransform: 'uppercase', letterSpacing: 1, fontWeight: 600 }}>До следующей стадии</div>
          <div style={{ fontFamily: FONTS.display, fontSize: 17, fontWeight: 700, color: '#fff' }}>{Math.max(0, stage.next - user.totalKm).toFixed(1)} км</div>
        </div>
      </div>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 12 }}>
        <span style={{ fontSize: 11, color: COLORS.textSecondary, textTransform: 'uppercase', letterSpacing: 1, fontWeight: 600 }}>Путь пловца</span>
        <span style={{ fontSize: 12, fontWeight: 700, color: COLORS.blue }}>{user.totalKm.toFixed(1)} км</span>
      </div>
      <div style={{ marginBottom: 22 }}>
        <StagePath stages={STAGES} currentIndex={stageIndex} icons={STAGE_ICONS} />
      </div>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
        <div style={{ fontFamily: FONTS.display, fontSize: 15, fontWeight: 700 }}>Топ-3 рейтинга</div>
        <div onClick={onSeeAll} style={{ fontSize: 12, color: COLORS.blue, fontWeight: 700, cursor: 'pointer' }}>Все →</div>
      </div>
      <LeaderboardList entries={leaderboard} user={user} limit={3} />
    </div>
  )
}

function StatCard({ Icon, label, value }) {
  return (
    <div style={{ background: COLORS.card, border: `1px solid ${COLORS.border}`, borderRadius: 14, padding: '12px 6px', textAlign: 'center', boxShadow: '0 2px 8px rgba(16,35,61,0.04)' }}>
      <Icon size={17} color={COLORS.blue} strokeWidth={2} />
      <div style={{ fontFamily: FONTS.display, fontSize: 18, fontWeight: 700, color: COLORS.textPrimary, marginTop: 6 }}>{value}</div>
      <div style={{ fontSize: 8, color: COLORS.textSecondary, marginTop: 2, textTransform: 'uppercase', letterSpacing: 0.4, fontWeight: 600 }}>{label}</div>
    </div>
  )
}

// ── Вкладка "Рейтинг" ──────────────────────────────────────────

function RankView({ user, leaderboard }) {
  return (
    <div style={{ padding: '8px 16px 16px' }}>
      <div style={{ fontFamily: FONTS.display, fontSize: 21, fontWeight: 700, marginBottom: 4, marginTop: 8 }}>Рейтинг пловцов</div>
      <div style={{ fontSize: 12, color: COLORS.textSecondary, marginBottom: 16 }}>{leaderboard.length} участников</div>
      <LeaderboardList entries={leaderboard} user={user} />
    </div>
  )
}

function LeaderboardList({ entries, user, limit }) {
  const list = limit ? entries.slice(0, limit) : entries
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      {list.map((u, i) => {
        const isMe = u.id === user.id
        const medal = i === 0 ? COLORS.gold : i === 1 ? COLORS.silver : i === 2 ? COLORS.bronze : null
        return (
          <div key={u.id} style={{
            display: 'flex', alignItems: 'center', gap: 10, background: COLORS.card,
            border: `1px solid ${isMe ? COLORS.blue + '55' : COLORS.border}`, borderRadius: 14,
            padding: '10px 12px', boxShadow: '0 2px 8px rgba(16,35,61,0.04)',
          }}>
            <div style={{
              width: 24, height: 24, borderRadius: '50%', flexShrink: 0,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              background: medal || COLORS.cardMuted, fontSize: 11, fontWeight: 800,
              color: medal ? '#fff' : COLORS.textMuted,
            }}>{i + 1}</div>
            <img src={u.avatar} style={{ width: 36, height: 36, borderRadius: '50%', border: `1px solid ${COLORS.border}` }} alt="" onError={e => e.target.style.display = 'none'} />
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 14, fontWeight: 600, color: COLORS.textPrimary, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                {u.name}{isMe && <span style={{ fontSize: 10, color: COLORS.blue, marginLeft: 6, fontWeight: 700 }}>вы</span>}
              </div>
              <div style={{ fontSize: 10, color: COLORS.textMuted, textTransform: 'uppercase', letterSpacing: 0.4, fontWeight: 600 }}>{u.stage}</div>
            </div>
            <div style={{ textAlign: 'right' }}>
              <span style={{ fontSize: 15, fontWeight: 700, color: COLORS.blue }}>{u.totalKm.toFixed(1)}</span>
              <span style={{ fontSize: 10, color: COLORS.textMuted, marginLeft: 3, fontWeight: 600 }}>КМ</span>
            </div>
          </div>
        )
      })}
    </div>
  )
}

// ── Вкладка "Профиль" ────────────────────────────────────────────

function ProfileView({ user, stage, onLogout, onSync, syncing }) {
  const rows = [
    { Icon: IconWaves, label: 'Всего километров', val: user.totalKm.toFixed(1), unit: 'км' },
    { Icon: IconClock, label: 'Тренировок', val: user.workoutsCount, unit: '' },
    { Icon: IconStar, label: 'Текущая стадия', val: stage.label, unit: '' },
    { Icon: IconFlag, label: 'До следующей стадии', val: Math.max(0, stage.next - user.totalKm).toFixed(1), unit: 'км' },
  ]
  return (
    <div style={{ padding: '8px 16px 16px' }}>
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10, margin: '12px 0 24px' }}>
        <div style={{ position: 'relative' }}>
          <img src={user.avatar} style={{ width: 100, height: 100, borderRadius: '50%', border: `3px solid ${COLORS.blue}`, objectFit: 'cover' }} alt="" />
          <button onClick={onSync} disabled={syncing} style={{
            position: 'absolute', bottom: 2, right: 2, width: 30, height: 30, borderRadius: '50%',
            background: COLORS.teal, border: '3px solid #fff', display: 'flex', alignItems: 'center',
            justifyContent: 'center', cursor: 'pointer',
          }} aria-label="Синхронизировать со Strava">
            <IconPencil size={13} color="#fff" />
          </button>
        </div>
        <div style={{ fontFamily: FONTS.display, fontSize: 21, fontWeight: 700 }}>{user.name}</div>
        <div style={{ fontSize: 13, color: COLORS.teal, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 1 }}>{stage.label}</div>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {rows.map(row => (
          <div key={row.label} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '14px 16px', background: COLORS.card, border: `1px solid ${COLORS.border}`, borderRadius: 14, boxShadow: '0 2px 8px rgba(16,35,61,0.04)' }}>
            <row.Icon size={18} color={COLORS.blue} strokeWidth={2} />
            <span style={{ flex: 1, fontSize: 13, color: COLORS.textSecondary, fontWeight: 500 }}>{row.label}</span>
            <span style={{ fontSize: 15, fontWeight: 700, color: COLORS.textPrimary }}>{row.val}</span>
            {row.unit && <span style={{ fontSize: 11, color: COLORS.textMuted, fontWeight: 600 }}>{row.unit}</span>}
          </div>
        ))}
      </div>

      <PoolBanner />

      <button onClick={onLogout} style={{
        marginTop: 20, width: '100%', padding: '13px', borderRadius: 14, background: COLORS.card,
        border: `1.5px solid ${COLORS.strava}`, color: COLORS.strava, fontWeight: 700, fontSize: 14,
        cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, fontFamily: FONTS.body,
      }}>
        <IconLogout size={16} /> Выйти
      </button>
    </div>
  )
}

// Декоративный баннер "бассейн" — CSS/SVG-аппроксимация без стоковых фото.
// Реальные фото бассейна/подводной съёмки можно подставить позже: просто
// заменить этот компонент на <img src="/images/pool-banner.jpg" />.
function PoolBanner() {
  return (
    <div style={{ marginTop: 16, borderRadius: 16, overflow: 'hidden', height: 110, position: 'relative', background: `linear-gradient(180deg, ${COLORS.heroTo} 0%, ${COLORS.heroFrom} 100%)` }}>
      <svg width="100%" height="100%" viewBox="0 0 400 110" preserveAspectRatio="none" style={{ position: 'absolute', inset: 0 }}>
        <path d="M0 30 Q 100 10 200 30 T 400 30" stroke="rgba(255,255,255,0.15)" strokeWidth="2" fill="none" />
        <path d="M0 50 Q 100 35 200 50 T 400 50" stroke="rgba(255,255,255,0.1)" strokeWidth="2" fill="none" />
        {[0, 90, 180, 270].map(x => (
          <line key={x} x1={x} y1="60" x2={x} y2="110" stroke="rgba(255,255,255,0.12)" strokeWidth="10" strokeDasharray="6 6" />
        ))}
      </svg>
    </div>
  )
}

// ── Заглушка ─────────────────────────────────────────────────────

function PlaceholderView({ Icon, title, text }) {
  return (
    <div style={{ padding: '70px 24px', textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12 }}>
      <div style={{ width: 64, height: 64, borderRadius: '50%', background: COLORS.cardMuted, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <Icon size={28} color={COLORS.textMuted} />
      </div>
      <div style={{ fontFamily: FONTS.display, fontSize: 19, fontWeight: 700 }}>{title}</div>
      <div style={{ fontSize: 13, color: COLORS.textSecondary, lineHeight: 1.6, maxWidth: 300 }}>{text}</div>
    </div>
  )
}

// ── Нижняя навигация ─────────────────────────────────────────────

function BottomNav({ nav, setNav, onSync }) {
  return (
    <div style={{ display: 'flex', background: COLORS.card, borderTop: `1px solid ${COLORS.border}`, padding: '10px 0 22px', position: 'sticky', bottom: 0 }}>
      {NAV_ITEMS.map(({ id, Icon, label, center }) => (
        <div key={id} onClick={() => id === 'sync' ? onSync() : setNav(id)}
          style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4, cursor: 'pointer' }}>
          {center ? (
            <div style={{ width: 48, height: 48, borderRadius: '50%', background: COLORS.blue, display: 'flex', alignItems: 'center', justifyContent: 'center', marginTop: -22, boxShadow: '0 4px 12px rgba(47,99,224,0.35)' }}>
              <Icon size={21} color="#fff" strokeWidth={2.2} />
            </div>
          ) : (
            <Icon size={21} color={nav === id ? COLORS.teal : COLORS.textMuted} strokeWidth={nav === id ? 2.3 : 2} />
          )}
          <div style={{ fontSize: 9, color: nav === id ? COLORS.teal : COLORS.textMuted, fontWeight: nav === id ? 700 : 500, textTransform: 'uppercase', letterSpacing: 0.4 }}>{label}</div>
        </div>
      ))}
    </div>
  )
}

// ── Экраны входа и загрузки ──────────────────────────────────────

function LoginScreen() {
  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', position: 'relative', overflow: 'hidden', background: COLORS.page }}>
      <div style={{ flex: '0 0 42%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', position: 'relative', zIndex: 2 }}>
        <Logo size="lg" />
      </div>

      <div style={{ flex: 1, position: 'relative', background: `linear-gradient(180deg, ${COLORS.heroTo} 0%, ${COLORS.heroFrom} 65%, #061733 100%)` }}>
        <svg width="100%" height="40" viewBox="0 0 400 40" preserveAspectRatio="none" style={{ position: 'absolute', top: -39, left: 0 }}>
          <path d="M0 40 Q 100 0 200 22 T 400 10 V40 Z" fill={COLORS.heroTo} />
        </svg>
        <svg width="100%" height="100%" viewBox="0 0 400 500" preserveAspectRatio="none" style={{ position: 'absolute', inset: 0, opacity: 0.5 }}>
          <path d="M0 60 Q 100 40 200 60 T 400 60" stroke="rgba(255,255,255,0.18)" strokeWidth="2" fill="none" />
          <path d="M0 100 Q 100 80 200 100 T 400 100" stroke="rgba(255,255,255,0.1)" strokeWidth="2" fill="none" />
          {[30, 110, 290, 370].map(x => (
            <line key={x} x1={x} y1="220" x2={x} y2="500" stroke="rgba(255,255,255,0.14)" strokeWidth="14" strokeDasharray="8 8" />
          ))}
        </svg>
        <div style={{ position: 'absolute', bottom: 56, left: '50%', transform: 'translateX(-50%)', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 24, width: '100%' }}>
          <div style={{ display: 'flex', gap: 6 }}>
            {Array.from({ length: 11 }).map((_, i) => (
              <div key={i} style={{ width: i === 5 ? 8 : 6, height: i === 5 ? 8 : 6, borderRadius: '50%', background: i === 5 ? '#fff' : 'rgba(255,255,255,0.35)' }} />
            ))}
          </div>
          <a href={`${API}/auth/strava`} style={{
            display: 'flex', alignItems: 'center', gap: 10, background: COLORS.strava, color: 'white',
            padding: '15px 30px', borderRadius: 30, textDecoration: 'none', fontWeight: 700, fontSize: 15,
            fontFamily: FONTS.body, boxShadow: '0 8px 20px rgba(252,76,2,0.35)',
          }}>
            <IconWaves size={18} color="#fff" strokeWidth={2.4} /> Войти через Strava
          </a>
        </div>
      </div>
    </div>
  )
}

function LoadingScreen() {
  return (
    <div style={{ minHeight: '100vh', background: COLORS.page, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ color: COLORS.blue, fontSize: 16, fontFamily: FONTS.body, fontWeight: 600 }}>Загрузка...</div>
    </div>
  )
}

// ── Оверлей Level Up ───────────────────────────────────────────

function LevelUpOverlay({ stage, color, charImg, onClose }) {
  useEffect(() => {
    const t = setTimeout(onClose, 4000)
    return () => clearTimeout(t)
  }, [onClose])

  return (
    <div onClick={onClose} style={{
      position: 'fixed', inset: 0, zIndex: 1000, background: 'rgba(14,25,45,0.94)',
      display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
      gap: 16, cursor: 'pointer', animation: 'fadeIn 0.4s ease',
    }}>
      <style>{`
        @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
        @keyframes pop { 0% { transform: scale(0.6); opacity: 0; } 60% { transform: scale(1.06); opacity: 1; } 100% { transform: scale(1); opacity: 1; } }
      `}</style>
      <div style={{ fontFamily: FONTS.display, fontSize: 13, color, fontWeight: 700, letterSpacing: 4, textTransform: 'uppercase', animation: 'pop 0.5s ease' }}>
        Новая стадия
      </div>
      {charImg && <img src={charImg} alt={stage.label} style={{ height: 260, width: 'auto', objectFit: 'contain', animation: 'pop 0.5s ease' }} />}
      <div style={{ fontFamily: FONTS.display, fontSize: 30, fontWeight: 700, color: '#fff', letterSpacing: 1, animation: 'pop 0.6s ease' }}>
        {stage.label.toUpperCase()}
      </div>
      <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.6)' }}>Нажмите, чтобы продолжить</div>
    </div>
  )
}
