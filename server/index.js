const express = require('express');
const cors = require('cors');
const axios = require('axios');
const jwt = require('jsonwebtoken');
require('dotenv').config();
const { pool, migrate } = require('./db');

const app = express();

const ALLOWED_ORIGINS = [
  'http://localhost:5173',
  process.env.CLIENT_URL,
].filter(Boolean);

app.use(cors({
  origin: (origin, callback) => {
    // Разрешаем запросы без origin (например, curl/Postman) и из списка разрешённых
    if (!origin || ALLOWED_ORIGINS.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
}));
app.use(express.json());

const {
  PORT = 3001,
  STRAVA_CLIENT_ID,
  STRAVA_CLIENT_SECRET,
  STRAVA_REDIRECT_URI,
  JWT_SECRET,
  CLIENT_URL = 'http://localhost:5173',
} = process.env;

// ── STRAVA OAuth ──────────────────────────────────────────────

// Шаг 1: редирект на Strava
app.get('/auth/strava', (req, res) => {
  const url = `https://www.strava.com/oauth/authorize?client_id=${STRAVA_CLIENT_ID}&redirect_uri=${STRAVA_REDIRECT_URI}&response_type=code&scope=activity:read_all`;
  res.redirect(url);
});

// Шаг 2: Strava возвращает code, меняем на токен
app.get('/auth/strava/callback', async (req, res) => {
  const { code } = req.query;
  try {
    const response = await axios.post('https://www.strava.com/oauth/token', {
      client_id: STRAVA_CLIENT_ID,
      client_secret: STRAVA_CLIENT_SECRET,
      code,
      grant_type: 'authorization_code',
    });

    const { athlete, access_token, refresh_token, expires_at } = response.data;
    const userId = String(athlete.id);
    const name = `${athlete.firstname} ${athlete.lastname}`;
    const gender = athlete.sex === 'F' ? 'f' : 'm';

    // Upsert пользователя: создаём если новый, обновляем токены если уже есть
    await pool.query(
      `INSERT INTO users (id, name, avatar, gender, access_token, refresh_token, expires_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       ON CONFLICT (id) DO UPDATE SET
         name = EXCLUDED.name,
         avatar = EXCLUDED.avatar,
         access_token = EXCLUDED.access_token,
         refresh_token = EXCLUDED.refresh_token,
         expires_at = EXCLUDED.expires_at`,
      [userId, name, athlete.profile, gender, access_token, refresh_token, expires_at]
    );

    await syncActivities(userId);

    const token = jwt.sign({ userId }, JWT_SECRET, { expiresIn: '30d' });
    res.redirect(`${CLIENT_URL}?token=${token}`);
  } catch (err) {
    console.error('Strava auth error:', err.message);
    res.status(500).json({ error: 'Auth failed' });
  }
});

// ── Синхронизация тренировок ──────────────────────────────────

async function syncActivities(userId) {
  const { rows } = await pool.query('SELECT * FROM users WHERE id = $1', [userId]);
  const user = rows[0];
  if (!user) return;

  try {
    const response = await axios.get('https://www.strava.com/api/v3/athlete/activities', {
      headers: { Authorization: `Bearer ${user.access_token}` },
      params: { per_page: 200 },
    });

    const swims = response.data.filter(a => a.type === 'Swim' || a.sport_type === 'Swim');

    // Upsert каждую тренировку (ON CONFLICT DO UPDATE — на случай, если Strava-запись изменилась)
    for (const a of swims) {
      await pool.query(
        `INSERT INTO workouts (id, user_id, date, distance_m, duration_sec, name)
         VALUES ($1, $2, $3, $4, $5, $6)
         ON CONFLICT (id) DO UPDATE SET
           date = EXCLUDED.date,
           distance_m = EXCLUDED.distance_m,
           duration_sec = EXCLUDED.duration_sec,
           name = EXCLUDED.name`,
        [a.id, userId, a.start_date, a.distance, a.moving_time, a.name]
      );
    }

    // Пересчитываем total_km из реальных данных в БД (источник истины — таблица workouts)
    const { rows: sumRows } = await pool.query(
      'SELECT COALESCE(SUM(distance_m), 0) AS total FROM workouts WHERE user_id = $1',
      [userId]
    );
    const totalKm = Number(sumRows[0].total) / 1000;

    await pool.query('UPDATE users SET total_km = $1 WHERE id = $2', [totalKm, userId]);

    console.log(`Synced ${swims.length} swims for ${user.name}, total: ${totalKm.toFixed(1)} km`);
  } catch (err) {
    console.error('Sync error:', err.message);
  }
}

// ── API endpoints ─────────────────────────────────────────────

function auth(req, res, next) {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) return res.status(401).json({ error: 'No token' });
  try {
    req.user = jwt.verify(token, JWT_SECRET);
    next();
  } catch {
    res.status(401).json({ error: 'Invalid token' });
  }
}

// Профиль текущего пользователя
app.get('/api/me', auth, async (req, res) => {
  const { rows } = await pool.query('SELECT * FROM users WHERE id = $1', [req.user.userId]);
  const user = rows[0];
  if (!user) return res.status(404).json({ error: 'User not found' });

  const { rows: workouts } = await pool.query(
    'SELECT id, date, distance_m AS "distanceM", duration_sec AS "durationSec", name FROM workouts WHERE user_id = $1 ORDER BY date DESC LIMIT 5',
    [user.id]
  );
  const { rows: countRows } = await pool.query(
    'SELECT COUNT(*) FROM workouts WHERE user_id = $1',
    [user.id]
  );

  const totalKm = Number(user.total_km);
  const stage = getStage(totalKm);
  res.json({
    id: user.id,
    name: user.name,
    avatar: user.avatar,
    gender: user.gender,
    totalKm,
    stage: stage.name,
    stageIndex: stage.index,
    nextStageKm: stage.next,
    workoutsCount: Number(countRows[0].count),
    recentWorkouts: workouts,
  });
});

// Рейтинг
app.get('/api/leaderboard', auth, async (req, res) => {
  const { rows } = await pool.query(
    'SELECT id, name, avatar, total_km AS "totalKm" FROM users ORDER BY total_km DESC'
  );
  const sorted = rows.map((u, i) => ({
    rank: i + 1,
    id: u.id,
    name: u.name,
    avatar: u.avatar,
    totalKm: Number(u.totalKm),
    stage: getStage(Number(u.totalKm)).name,
  }));
  res.json(sorted);
});

// Синхронизировать вручную
app.post('/api/sync', auth, async (req, res) => {
  await syncActivities(req.user.userId);
  const { rows } = await pool.query(
    'SELECT total_km, (SELECT COUNT(*) FROM workouts WHERE user_id = $1) AS count FROM users WHERE id = $1',
    [req.user.userId]
  );
  res.json({ totalKm: Number(rows[0].total_km), workoutsCount: Number(rows[0].count) });
});

// ── Стадии персонажа ──────────────────────────────────────────

const STAGES = [
  { name: 'novice',   label: 'Новичок',  min: 0,    next: 100  },
  { name: 'swimmer',  label: 'Пловец',   min: 100,  next: 500  },
  { name: 'athlete',  label: 'Атлет',    min: 500,  next: 1500 },
  { name: 'champion', label: 'Чемпион',  min: 1500, next: 3000 },
  { name: 'legend',   label: 'Легенда',  min: 3000, next: 5000 },
  { name: 'neptune',  label: 'Нептун',   min: 5000, next: 9999 },
];

function getStage(km) {
  for (let i = STAGES.length - 1; i >= 0; i--) {
    if (km >= STAGES[i].min) return { ...STAGES[i], index: i };
  }
  return { ...STAGES[0], index: 0 };
}

// Тестовый endpoint — добавить km вручную (только для разработки)
app.post('/api/debug/add-km', auth, async (req, res) => {
  const { km } = req.body;
  const { rows } = await pool.query(
    'UPDATE users SET total_km = total_km + $1 WHERE id = $2 RETURNING total_km',
    [Number(km), req.user.userId]
  );
  if (!rows[0]) return res.status(404).json({ error: 'Not found' });
  const totalKm = Number(rows[0].total_km);
  res.json({ totalKm, stage: getStage(totalKm).name });
});

// ── Старт ─────────────────────────────────────────────────────

async function start() {
  await migrate();
  app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
    console.log(`Strava OAuth: http://localhost:${PORT}/auth/strava`);
  });
}

start().catch(err => {
  console.error('Failed to start server:', err);
  process.exit(1);
});
