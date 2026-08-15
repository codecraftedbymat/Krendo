import { spawn, spawnSync } from 'child_process';
import { fileURLToPath } from 'url';
import path from 'path';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const PORT_TEST = 3099;
const DATABASE_URL_TEST = 'postgres://postgres:devpass@localhost:5432/krendo_test';
export const BASE_URL = `http://localhost:${PORT_TEST}`;

let processus = null;

export function peuplerBaseTest() {
  const resultat = spawnSync('node', ['src/seed.js'], {
    cwd: path.join(__dirname, '..'),
    env: { ...process.env, DATABASE_URL: DATABASE_URL_TEST },
    encoding: 'utf-8',
  });
  if (resultat.status !== 0) {
    throw new Error(`Échec du seed de test : ${resultat.stderr}`);
  }
}

export async function demarrerServeurTest() {
  processus = spawn('node', ['src/server.js'], {
    cwd: path.join(__dirname, '..'),
    env: {
      ...process.env,
      NODE_ENV: 'test',
      DATABASE_URL: DATABASE_URL_TEST,
      PORT: String(PORT_TEST),
      JWT_SECRET: 'cle-de-test',
      BREVO_API_KEY: '',
    },
    stdio: 'pipe',
  });

  const debut = Date.now();
  while (Date.now() - debut < 15000) {
    try {
      const res = await fetch(`${BASE_URL}/api/sante`);
      if (res.ok) return;
    } catch {
      // pas encore prêt
    }
    await new Promise((r) => setTimeout(r, 300));
  }
  throw new Error("Le serveur de test n'a pas démarré à temps.");
}

export function arreterServeurTest() {
  if (processus) processus.kill();
}

export async function api(chemin, options = {}) {
  const res = await fetch(`${BASE_URL}/api${chemin}`, {
    ...options,
    headers: { 'Content-Type': 'application/json', ...options.headers },
  });
  const data = await res.json().catch(() => ({}));
  return { status: res.status, data };
}
