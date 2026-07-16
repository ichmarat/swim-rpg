const express = require('express');
const cors = require('cors');
const axios = require('axios');
const jwt = require('jsonwebtoken');
require('dotenv').config();

const app = express();
app.use(cors({ origin: 'http://localhost:5173', credentials: true }));
app.use(express.json());

const {
  PORT = 3001,
  STRAVA_CLIENT_ID,
  STRAVA_CLIENT_SECRET,
  STRAVA_REDIRECT_URI,
  JWT_SECRET,
} = process.env;

// Временная база в памяти (потом заменим на PostgreSQL)
const users = {};

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

    // Сохраняем пользователя
    const userId = String(athlete.id);
    if (!users[userId]) {
      users[userId] = {
        id: userId,
        name: `${athlete.firstname} ${athlete.lastname}`,
        avatar: athlete.profile,
        gender: athlete.sex === 'F' ? 'f' : 'm',
        totalKm: 0,
        workouts: [],
      };
    }
    users[userId].accessToken = access_token;
    users[userId].refreshToken = refresh_token;
    users[userId].expiresAt = expires_at;

    // Синхронизируем тренировки
    await syncActivities(userId);

    // Создаём JWT
    const token = jwt.sign({ userId }, JWT_SECRET, { expiresIn: '30d' });

    // Редиректим на фронт с токеном
    res.redirect(`http://localhost:5173?token=${token}`);
  } catch (err) {
    console.error('Strava auth error:', err.message);
    res.status(500).json({ error: 'Auth failed' });
  }
});

// ── Синхронизация тренировок ──────────────────────────────────

async function syncActivities(userId) {
  const user = users[userId];
  try {
    const response = await axios.get('https://www.strava.com/api/v3/athlete/activities', {
      headers: { Authorization: `Bearer ${user.accessToken}` },
      params: { per_page: 200 },
    });

    // Берём только плавание
    const swims = response.data.filter(a => a.type === 'Swim' || a.sport_type === 'Swim');
    
    user.workouts = swims.map(a => ({
      id: a.id,
      date: a.start_date,
      distanceM: a.distance,
      durationSec: a.moving_time,
      name: a.name,
    }));

    user.totalKm = swims.reduce((sum, a) => sum + a.distance, 0) / 1000;
    console.log(`Synced ${swims.length} swims for ${user.name}, total: ${user.totalKm.toFixed(1)} km`);
  } catch (err) {
    console.error('Sync error:', err.message);
  }
}

// ── API endpoints ─────────────────────────────────────────────

// Middleware: проверяем JWT
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
app.get('/api/me', auth, (req, res) => {
  const user = users[req.user.userId];
  if (!user) return res.status(404).json({ error: 'User not found' });
  
  const stage = getStage(user.totalKm);
  res.json({
    id: user.id,
    name: user.name,
    avatar: user.avatar,
    gender: user.gender,
    totalKm: user.totalKm,
    stage: stage.name,
    stageIndex: stage.index,
    nextStageKm: stage.next,
    workoutsCount: user.workouts.length,
    recentWorkouts: user.workouts.slice(0, 5),
  });
});

// Рейтинг
app.get('/api/leaderboard', auth, (req, res) => {
  const sorted = Object.values(users)
    .sort((a, b) => b.totalKm - a.totalKm)
    .map((u, i) => ({
      rank: i + 1,
      id: u.id,
      name: u.name,
      avatar: u.avatar,
      totalKm: u.totalKm,
      stage: getStage(u.totalKm).name,
    }));
  res.json(sorted);
});

// Синхронизировать вручную
app.post('/api/sync', auth, async (req, res) => {
  await syncActivities(req.user.userId);
  const user = users[req.user.userId];
  res.json({ totalKm: user.totalKm, workoutsCount: user.workouts.length });
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

// ── Старт ─────────────────────────────────────────────────────
// Тестовый endpoint — добавить km вручную (только для разработки)
app.post('/api/debug/add-km', auth, (req, res) => {
  const { km } = req.body;
  const user = users[req.user.userId];
  if (!user) return res.status(404).json({ error: 'Not found' });
  user.totalKm += Number(km);
  res.json({ totalKm: user.totalKm, stage: getStage(user.totalKm).name });
});
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
  console.log(`Strava OAuth: http://localhost:${PORT}/auth/strava`);
});