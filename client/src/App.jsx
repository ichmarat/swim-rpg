import { useState, useEffect, useRef } from 'react'
import './App.css'

const API = import.meta.env.VITE_API_URL || 'http://localhost:3001'

const STAGES = [
  { key: 'novice',   label: 'Новичок',  min: 0,    next: 100  },
  { key: 'swimmer',  label: 'Пловец',   min: 100,  next: 500  },
  { key: 'athlete',  label: 'Атлет',    min: 500,  next: 1500 },
  { key: 'champion', label: 'Чемпион',  min: 1500, next: 3000 },
  { key: 'legend',   label: 'Легенда',  min: 3000, next: 5000 },
  { key: 'neptune',  label: 'Нептун',   min: 5000, next: 9999 },
]

function getStage(km) {
  for (let i = STAGES.length - 1; i >= 0; i--) {
    if (km >= STAGES[i].min) return STAGES[i]
  }
  return STAGES[0]
}

const CHAR_IMAGES = {
  novice_m:   '/chars/novice_m.png',
  novice_f:   '/chars/novice_f.png',
  swimmer_m:  '/chars/swimmer_m.png',
  swimmer_f:  '/chars/swimmer_f.png',
  athlete_m:  '/chars/athlete_m.png',
  athlete_f:  '/chars/athlete_f.png',
  champion_m: '/chars/champion_m.png',
  champion_f: '/chars/champion_f.png',
  legend_m:   '/chars/legend_m.png',
  legend_f:   '/chars/legend_f.png',
  neptune_m:  '/chars/neptune_m.png',
  neptune_f:  '/chars/neptune_f.png',
}

const NAV_ITEMS = [
  { id: 'home', icon: '🏠', label: 'Главная' },
  { id: 'rank', icon: '🏆', label: 'Рейтинг' },
  { id: 'sync', icon: '🏊', label: 'Добавить', center: true },
  { id: 'gear', icon: '👕', label: 'Снаряжение' },
  { id: 'profile', icon: '👤', label: 'Профиль' },
]

const STAGE_EMOJIS = ['👶', '🧑', '💪', '🏆', '🐬', '🔱']

export default function App() {
  const [token, setToken] = useState(localStorage.getItem('token'))
  const [user, setUser] = useState(null)
  const [leaderboard, setLeaderboard] = useState([])
  const [syncing, setSyncing] = useState(false)
  const [nav, setNav] = useState('home')
  const [levelUpStage, setLevelUpStage] = useState(null)

  const lastStageRef = useRef(null)

  // Читаем токен из URL после OAuth
  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const t = params.get('token')
    if (t) {
      localStorage.setItem('token', t)
      setToken(t)
      window.history.replaceState({}, '', '/')
    }
  }, [])

  // Загружаем профиль
  useEffect(() => {
    if (!token) return
    fetch(`${API}/api/me`, {
      headers: { Authorization: `Bearer ${token}` }
    })
      .then(r => r.json())
      .then(data => {
        if (data.error) { localStorage.removeItem('token'); setToken(null) }
        else setUser(data)
      })
      .catch(() => { localStorage.removeItem('token'); setToken(null) })
  }, [token])

  // Загружаем рейтинг
  useEffect(() => {
    if (!token) return
    fetch(`${API}/api/leaderboard`, {
      headers: { Authorization: `Bearer ${token}` }
    })
      .then(r => r.json())
      .then(setLeaderboard)
  }, [token, user])

  // Определяем переход на новую стадию
  useEffect(() => {
    if (!user) return
    const stageKey = `lastStage_${user.id}`
    const currentStage = getStage(user.totalKm)
    const currentIndex = STAGES.findIndex(s => s.key === currentStage.key)
    const stored = localStorage.getItem(stageKey)

    if (stored === null) {
      // Первая загрузка для этого пользователя — просто запоминаем, без анимации
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

  // Синхронизация
  async function sync() {
    setSyncing(true)
    const r = await fetch(`${API}/api/sync`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}` }
    })
    const data = await r.json()
    setUser(u => ({ ...u, totalKm: data.totalKm, workoutsCount: data.workoutsCount }))
    setSyncing(false)
  }

  function logout() {
    localStorage.removeItem('token')
    setToken(null)
    setUser(null)
  }

  // Экран входа
  if (!token) return (
    <div style={{
      minHeight: '100vh', background: '#060D1A',
      display: 'flex', flexDirection: 'column',
      alignItems: 'center', justifyContent: 'center', gap: 24,
    }}>
      <div style={{ fontFamily: 'sans-serif', fontSize: 36, fontWeight: 800, color: '#00E5FF', letterSpacing: 3 }}>
        100JUZ
      </div>
      <div style={{ color: '#607D9B', fontSize: 14, letterSpacing: 2 }}>SWIM RPG</div>
      <a href={`${API}/auth/strava`} style={{
        display: 'flex', alignItems: 'center', gap: 10,
        background: '#FC4C02', color: 'white',
        padding: '14px 28px', borderRadius: 12,
        textDecoration: 'none', fontWeight: 700, fontSize: 16,
      }}>
        🏊 Войти через Strava
      </a>
    </div>
  )

  if (!user) return (
    <div style={{ minHeight: '100vh', background: '#060D1A', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ color: '#2979FF', fontSize: 18 }}>Загрузка...</div>
    </div>
  )

  const stage = getStage(user.totalKm)
  const charKey = `${stage.key}_${user.gender}`
  const charImg = CHAR_IMAGES[charKey]
  const xpPct = Math.min(100, ((user.totalKm - stage.min) / (stage.next - stage.min)) * 100)
  const myRank = leaderboard.findIndex(u => u.id === user.id) + 1

  return (
    <div style={{
      maxWidth: 480, margin: '0 auto',
      background: '#070F1E', minHeight: '100vh',
      fontFamily: 'Inter, sans-serif', color: '#E8F0FC',
      position: 'relative',
    }}>

      {levelUpStage && (
        <LevelUpOverlay
          stage={levelUpStage}
          charImg={CHAR_IMAGES[`${levelUpStage.key}_${user.gender}`]}
          onClose={() => setLevelUpStage(null)}
        />
      )}

      {/* TOP BAR */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '14px 16px', background: '#070F1E', borderBottom: '1px solid #1A2D45', position: 'sticky', top: 0, zIndex: 100 }}>
        <div>
          <div style={{ fontSize: 22, fontWeight: 800, color: '#00E5FF', letterSpacing: 2 }}>100JUZ ✦</div>
          <div style={{ fontSize: 8, color: '#4A6A8A', letterSpacing: 2 }}>SWIMMING TOWARD 100 KM</div>
        </div>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          <button onClick={sync} disabled={syncing} style={{
            background: syncing ? '#1A2D45' : 'rgba(252,76,2,0.15)',
            border: '1px solid #FC4C02', borderRadius: 20,
            padding: '6px 12px', color: '#FC4C02',
            fontSize: 11, fontWeight: 600, cursor: 'pointer',
          }}>
            {syncing ? '⏳ Синхронизация...' : '🔄 Strava'}
          </button>
        </div>
      </div>

      {/* CONTENT */}
      {nav === 'home' && (
        <HomeView user={user} stage={stage} charImg={charImg} xpPct={xpPct} myRank={myRank} leaderboard={leaderboard} onSeeAll={() => setNav('rank')} />
      )}
      {nav === 'rank' && (
        <RankView user={user} leaderboard={leaderboard} />
      )}
      {nav === 'gear' && (
        <PlaceholderView icon="👕" title="Снаряжение" text="Скоро здесь появится экипировка для вашего пловца — костюмы, очки, шапочки, которые можно будет разблокировать за километраж." />
      )}
      {nav === 'profile' && (
        <ProfileView user={user} stage={stage} onLogout={logout} />
      )}

      {/* BOTTOM NAV */}
      <div style={{ display: 'flex', background: '#060D1A', borderTop: '1px solid #1A2D45', padding: '10px 0 20px', position: 'sticky', bottom: 0 }}>
        {NAV_ITEMS.map(item => (
          <div key={item.id} onClick={() => item.id === 'sync' ? sync() : setNav(item.id)}
            style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3, cursor: 'pointer' }}>
            {item.center
              ? <div style={{ width: 48, height: 48, borderRadius: '50%', background: 'linear-gradient(135deg,#2979FF,#00E5FF)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22, marginTop: -22, boxShadow: '0 0 16px #2979FF66' }}>{item.icon}</div>
              : <div style={{ fontSize: 20, opacity: nav === item.id ? 1 : 0.35 }}>{item.icon}</div>
            }
            <div style={{ fontSize: 8, color: nav === item.id ? '#2979FF' : '#4A6A8A', fontWeight: nav === item.id ? 600 : 400, textTransform: 'uppercase', letterSpacing: 0.5 }}>{item.label}</div>
            {nav === item.id && !item.center && <div style={{ width: 4, height: 4, borderRadius: '50%', background: '#2979FF' }} />}
          </div>
        ))}
      </div>
    </div>
  )
}

// ── Вкладка "Главная" ──────────────────────────────────────────

function HomeView({ user, stage, charImg, xpPct, myRank, leaderboard, onSeeAll }) {
  const stageIndex = STAGES.findIndex(s => s.key === stage.key)
  return (
    <>
      <div style={{ padding: '14px 16px 10px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 10 }}>
          <img src={user.avatar} style={{ width: 54, height: 54, borderRadius: '50%', border: '2.5px solid #2979FF' }} alt="" />
          <div>
            <div style={{ fontSize: 18, fontWeight: 800 }}>{user.name} <span style={{ color: '#2979FF' }}>✓</span></div>
            <div style={{ fontSize: 10, color: '#607D9B', fontWeight: 600, letterSpacing: 1 }}>{stage.label.toUpperCase()} · #{myRank} в рейтинге</div>
            <div style={{ fontSize: 12, color: '#2979FF' }}>{user.totalKm.toFixed(1)} / {stage.next} КМ</div>
          </div>
        </div>

        <div style={{ background: '#1A2D45', borderRadius: 4, height: 6, marginBottom: 12, overflow: 'hidden' }}>
          <div style={{ height: '100%', width: `${xpPct}%`, background: 'linear-gradient(90deg,#2979FF,#00E5FF)', borderRadius: 4, boxShadow: '0 0 8px #00E5FF88', transition: 'width 1s ease' }} />
        </div>

        <div style={{ display: 'flex', gap: 6, marginBottom: 10 }}>
          {[
            { label: 'КМ ВСЕГО', val: user.totalKm.toFixed(1) },
            { label: 'ТРЕНИРОВОК', val: user.workoutsCount },
            { label: 'РЕЙТИНГ', val: `#${myRank}` },
          ].map(s => (
            <div key={s.label} style={{ flex: 1, background: '#0D1A2A', border: '1px solid #1A2D45', borderRadius: 12, padding: '8px 6px', textAlign: 'center' }}>
              <div style={{ fontSize: 16, fontWeight: 800, color: '#00E5FF' }}>{s.val}</div>
              <div style={{ fontSize: 8, color: '#607D9B', marginTop: 2 }}>{s.label}</div>
            </div>
          ))}
        </div>

        <div style={{ fontSize: 9, color: '#607D9B', letterSpacing: 2, textTransform: 'uppercase' }}>Всего проплыто</div>
        <div style={{ fontSize: 60, fontWeight: 800, color: '#E8F0FC', lineHeight: 1, letterSpacing: 2 }}>
          {user.totalKm.toFixed(1)} <span style={{ fontSize: 20, color: '#4A6A8A', fontWeight: 500 }}>КМ</span>
        </div>
      </div>

      <div style={{ position: 'relative', height: 320, display: 'flex', alignItems: 'flex-end', justifyContent: 'center', overflow: 'hidden' }}>
        <div style={{ position: 'absolute', bottom: 40, left: '50%', transform: 'translateX(-50%)', width: 200, height: 200, background: 'radial-gradient(circle,#2979FF18 0%,transparent 70%)', borderRadius: '50%' }} />
        {charImg && (
          <img src={charImg} style={{ height: 300, width: 'auto', objectFit: 'contain', filter: 'drop-shadow(0 0 20px #2979FF66)', position: 'relative', zIndex: 2 }} alt={stage.label} />
        )}
        <div style={{ position: 'absolute', bottom: 16, left: '50%', transform: 'translateX(-50%)', background: '#0A2050', border: '1px solid #2979FF44', borderRadius: 20, padding: '4px 14px', fontSize: 11, color: '#2979FF', fontWeight: 600, whiteSpace: 'nowrap' }}>
          {stage.label} · {xpPct.toFixed(0)}% до {STAGES[Math.min(stageIndex + 1, STAGES.length - 1)].label}
        </div>
      </div>

      <div style={{ background: '#0A1525', borderTop: '1px solid #1A2D45', padding: '12px 16px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
          <span style={{ fontSize: 9, color: '#607D9B', textTransform: 'uppercase', letterSpacing: 1.5 }}>Путь пловца</span>
          <span style={{ fontSize: 9, color: '#2979FF', fontWeight: 700 }}>{user.totalKm.toFixed(1)} КМ</span>
        </div>
        <div style={{ background: '#1A2D45', borderRadius: 3, height: 4, marginBottom: 10, overflow: 'hidden' }}>
          <div style={{ height: '100%', width: `${Math.min(100, (user.totalKm / 5000) * 100)}%`, background: 'linear-gradient(90deg,#2979FF,#00E5FF)', borderRadius: 3 }} />
        </div>
        <div style={{ display: 'flex', alignItems: 'flex-end', gap: 2 }}>
          {STAGES.map((s, i) => {
            const isCur = s.key === stage.key
            const isPast = user.totalKm >= s.min
            return (
              <div key={s.key} style={{ flex: 1, textAlign: 'center' }}>
                <div style={{ fontSize: 22, filter: isCur ? 'drop-shadow(0 0 8px #00E5FF)' : isPast ? 'none' : 'grayscale(1)', opacity: isPast ? 1 : 0.35 }}>{STAGE_EMOJIS[i]}</div>
                <div style={{ fontSize: 6, color: isCur ? '#2979FF' : '#607D9B', fontWeight: 700, textTransform: 'uppercase', marginTop: 2 }}>{s.label}</div>
                <div style={{ fontSize: 5, color: '#3A5070' }}>{s.min}+</div>
              </div>
            )
          })}
        </div>
      </div>

      <div style={{ padding: '12px 16px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
          <div style={{ fontSize: 13, fontWeight: 800, color: '#E8F0FC', textTransform: 'uppercase', letterSpacing: 1 }}>Топ-3 рейтинга</div>
          <div onClick={onSeeAll} style={{ fontSize: 10, color: '#2979FF', fontWeight: 700, cursor: 'pointer' }}>Все →</div>
        </div>
        <LeaderboardList entries={leaderboard} user={user} limit={3} />
      </div>
    </>
  )
}

// ── Вкладка "Рейтинг" ──────────────────────────────────────────

function RankView({ user, leaderboard }) {
  return (
    <div style={{ padding: '16px' }}>
      <div style={{ fontSize: 18, fontWeight: 800, marginBottom: 4 }}>Рейтинг пловцов</div>
      <div style={{ fontSize: 11, color: '#607D9B', marginBottom: 16 }}>{leaderboard.length} участников</div>
      <LeaderboardList entries={leaderboard} user={user} />
    </div>
  )
}

function LeaderboardList({ entries, user, limit }) {
  const list = limit ? entries.slice(0, limit) : entries
  const medals = ['🥇', '🥈', '🥉']

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
      {list.map((u, i) => {
        const isMe = u.id === user.id
        return (
          <div key={u.id} style={{
            display: 'flex', alignItems: 'center', gap: 8,
            background: isMe ? '#0A1E38' : '#0D1A2A',
            border: `1px solid ${isMe ? '#2979FF44' : '#1A2D45'}`,
            borderRadius: 12, padding: '9px 12px',
            boxShadow: isMe ? '0 0 12px #2979FF18' : 'none',
          }}>
            <div style={{ width: 24, textAlign: 'center', fontSize: 14 }}>{medals[i] || <span style={{ color: '#607D9B', fontSize: 11, fontWeight: 700 }}>{i + 1}</span>}</div>
            <img src={u.avatar} style={{ width: 28, height: 28, borderRadius: '50%', border: isMe ? '1.5px solid #2979FF' : '1px solid #1A2D45' }} alt="" onError={e => e.target.style.display = 'none'} />
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 12, color: isMe ? '#E8F0FC' : '#8099B8', fontWeight: isMe ? 700 : 400 }}>
                {u.name} {isMe && <span style={{ fontSize: 8, background: '#0A2050', color: '#2979FF', padding: '1px 5px', borderRadius: 6, border: '1px solid #2979FF44' }}>вы</span>}
              </div>
              <div style={{ fontSize: 9, color: '#4A6A8A' }}>{u.stage}</div>
            </div>
            <div style={{ fontSize: 12, color: isMe ? '#2979FF' : '#607D9B', fontWeight: isMe ? 700 : 400 }}>{u.totalKm.toFixed(1)} км</div>
          </div>
        )
      })}
    </div>
  )
}

// ── Вкладка "Профиль" ────────────────────────────────────────────

function ProfileView({ user, stage, onLogout }) {
  return (
    <div style={{ padding: '16px' }}>
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10, marginBottom: 24 }}>
        <img src={user.avatar} style={{ width: 84, height: 84, borderRadius: '50%', border: '3px solid #2979FF' }} alt="" />
        <div style={{ fontSize: 20, fontWeight: 800 }}>{user.name}</div>
        <div style={{ fontSize: 11, color: '#2979FF', fontWeight: 700, textTransform: 'uppercase', letterSpacing: 1 }}>{stage.label}</div>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {[
          { label: 'Всего километров', val: `${user.totalKm.toFixed(1)} км` },
          { label: 'Тренировок', val: user.workoutsCount },
          { label: 'Текущая стадия', val: stage.label },
          { label: 'До следующей стадии', val: `${Math.max(0, stage.next - user.totalKm).toFixed(1)} км` },
        ].map(row => (
          <div key={row.label} style={{ display: 'flex', justifyContent: 'space-between', padding: '12px 14px', background: '#0D1A2A', border: '1px solid #1A2D45', borderRadius: 12 }}>
            <span style={{ fontSize: 12, color: '#607D9B' }}>{row.label}</span>
            <span style={{ fontSize: 12, fontWeight: 700 }}>{row.val}</span>
          </div>
        ))}
      </div>

      <button onClick={onLogout} style={{
        marginTop: 24, width: '100%', padding: '12px', borderRadius: 12,
        background: 'rgba(255,82,82,0.1)', border: '1px solid #FF5252',
        color: '#FF5252', fontWeight: 700, fontSize: 13, cursor: 'pointer',
      }}>
        Выйти
      </button>
    </div>
  )
}

// ── Заглушка для будущих вкладок ─────────────────────────────────

function PlaceholderView({ icon, title, text }) {
  return (
    <div style={{ padding: '60px 24px', textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12 }}>
      <div style={{ fontSize: 48 }}>{icon}</div>
      <div style={{ fontSize: 18, fontWeight: 800 }}>{title}</div>
      <div style={{ fontSize: 13, color: '#607D9B', lineHeight: 1.5, maxWidth: 300 }}>{text}</div>
    </div>
  )
}

// ── Оверлей Level Up ───────────────────────────────────────────

function LevelUpOverlay({ stage, charImg, onClose }) {
  useEffect(() => {
    const t = setTimeout(onClose, 4000)
    return () => clearTimeout(t)
  }, [onClose])

  return (
    <div
      onClick={onClose}
      style={{
        position: 'fixed', inset: 0, zIndex: 1000,
        background: 'rgba(6,13,26,0.92)', backdropFilter: 'blur(4px)',
        display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
        gap: 16, cursor: 'pointer',
        animation: 'levelUpFadeIn 0.4s ease',
      }}
    >
      <style>{`
        @keyframes levelUpFadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes levelUpPop {
          0% { transform: scale(0.6); opacity: 0; }
          60% { transform: scale(1.08); opacity: 1; }
          100% { transform: scale(1); opacity: 1; }
        }
        @keyframes levelUpGlow {
          0%, 100% { filter: drop-shadow(0 0 20px #00E5FF88); }
          50% { filter: drop-shadow(0 0 40px #00E5FFcc); }
        }
      `}</style>

      <div style={{
        fontSize: 13, color: '#00E5FF', fontWeight: 800,
        letterSpacing: 4, textTransform: 'uppercase',
        animation: 'levelUpPop 0.5s ease',
      }}>
        ✦ Новая стадия ✦
      </div>

      {charImg && (
        <img src={charImg} alt={stage.label} style={{
          height: 260, width: 'auto', objectFit: 'contain',
          animation: 'levelUpPop 0.5s ease, levelUpGlow 2s ease infinite',
        }} />
      )}

      <div style={{
        fontSize: 32, fontWeight: 800, color: '#E8F0FC',
        letterSpacing: 2, animation: 'levelUpPop 0.6s ease',
      }}>
        {stage.label.toUpperCase()}
      </div>

      <div style={{ fontSize: 12, color: '#607D9B' }}>Нажмите, чтобы продолжить</div>
    </div>
  )
}
