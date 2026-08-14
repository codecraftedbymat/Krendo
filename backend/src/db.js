import pg from 'pg';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const { Pool } = pg;
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const schemaPath = path.join(__dirname, '../db/schema.postgres.sql');

// DATABASE_URL est fournie automatiquement par Railway quand on ajoute
// un service PostgreSQL. En local, on utilise une valeur par défaut.
const connectionString = process.env.DATABASE_URL || 'postgres://postgres:devpass@localhost:5432/krendo_dev';

export const pool = new Pool({
  connectionString,
  ssl: process.env.DATABASE_URL ? { rejectUnauthorized: false } : false,
});

export async function initDb() {
  const schema = fs.readFileSync(schemaPath, 'utf8');
  await pool.query(schema);
  console.log('Base de données PostgreSQL prête (schéma appliqué).');
}
