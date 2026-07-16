const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');

// Render даёт DATABASE_URL автоматически, если вы прикрепили Postgres к сервису.
// Локально положи такую же переменную в .env для разработки.
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.DATABASE_URL?.includes('render.com')
    ? { rejectUnauthorized: false }
    : false,
});

// Прогоняем schema.sql при старте — CREATE TABLE IF NOT EXISTS безопасен для повторных запусков
async function migrate() {
  const schema = fs.readFileSync(path.join(__dirname, 'schema.sql'), 'utf8');
  await pool.query(schema);
  console.log('DB migration: OK');
}

module.exports = { pool, migrate };
