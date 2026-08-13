import Database from 'better-sqlite3';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const dbPath = path.join(__dirname, '../db/planning.db');
const schemaPath = path.join(__dirname, '../db/schema.sql');

const dbExists = fs.existsSync(dbPath);
export const db = new Database(dbPath);
db.pragma('foreign_keys = ON');

if (!dbExists) {
  const schema = fs.readFileSync(schemaPath, 'utf8');
  db.exec(schema);
  console.log('Base de données créée à partir du schéma.');
}
