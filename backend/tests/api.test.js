import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { demarrerServeurTest, arreterServeurTest, peuplerBaseTest, api } from './helpers.js';

const ADMIN = { email: 'admin@evenementielplus.fr', mot_de_passe: 'demo1234' };
const EMPLOYE = { email: 'sofia.lambert@evenementielplus.fr', mot_de_passe: 'demo1234' };

let tokenAdmin;
let tokenEmploye;

beforeAll(async () => {
  peuplerBaseTest();
  await demarrerServeurTest();

  const { data: dataAdmin } = await api('/connexion', { method: 'POST', body: JSON.stringify(ADMIN) });
  tokenAdmin = dataAdmin.token;

  const { data: dataEmploye } = await api('/connexion', { method: 'POST', body: JSON.stringify(EMPLOYE) });
  tokenEmploye = dataEmploye.token;
}, 20000);

afterAll(() => {
  arreterServeurTest();
});

function avecToken(token) {
  return { Authorization: `Bearer ${token}` };
}

describe('Authentification', () => {
  it('refuse un mauvais mot de passe', async () => {
    const { status, data } = await api('/connexion', {
      method: 'POST',
      body: JSON.stringify({ email: ADMIN.email, mot_de_passe: 'mauvais' }),
    });
    expect(status).toBe(401);
    expect(data.erreur).toBeDefined();
  });

  it('connecte un admin avec le bon rôle et les bonnes permissions', async () => {
    const { status, data } = await api('/connexion', { method: 'POST', body: JSON.stringify(ADMIN) });
    expect(status).toBe(200);
    expect(data.token).toBeDefined();
    expect(data.utilisateur.role).toBe('Super admin');
    expect(data.utilisateur.permissions.peut_creer_missions).toBe(true);
  });

  it('connecte un employé avec des permissions limitées', async () => {
    const { data } = await api('/connexion', { method: 'POST', body: JSON.stringify(EMPLOYE) });
    expect(data.utilisateur.role).toBe('Employé');
    expect(data.utilisateur.permissions.peut_creer_missions).toBe(false);
  });

  it('refuse l\'accès aux routes protégées sans token', async () => {
    const { status } = await api('/missions');
    expect(status).toBe(401);
  });
});

describe('Permissions (contrôle d\'accès)', () => {
  it('empêche un employé de créer une mission', async () => {
    const { status, data } = await api('/missions', {
      method: 'POST',
      headers: avecToken(tokenEmploye),
      body: JSON.stringify({ titre: 'Test interdit', date_debut: '2026-09-01', heure_debut: '08:00', date_fin: '2026-09-01', heure_fin: '18:00', nb_employes_requis: 1 }),
    });
    expect(status).toBe(403);
    expect(data.erreur).toBeDefined();
  });

  it('autorise un admin à créer une mission', async () => {
    const { status, data } = await api('/missions', {
      method: 'POST',
      headers: avecToken(tokenAdmin),
      body: JSON.stringify({ titre: 'Mission de test', date_debut: '2026-09-01', heure_debut: '08:00', date_fin: '2026-09-01', heure_fin: '18:00', nb_employes_requis: 2 }),
    });
    expect(status).toBe(201);
    expect(data.id).toBeDefined();
  });
});

describe('Missions et disponibilités', () => {
  let missionId;

  it('crée une mission et notifie les employés', async () => {
    const { status, data } = await api('/missions', {
      method: 'POST',
      headers: avecToken(tokenAdmin),
      body: JSON.stringify({ titre: 'Salon Test', date_debut: '2026-09-05', heure_debut: '09:00', date_fin: '2026-09-05', heure_fin: '17:00', nb_employes_requis: 3 }),
    });
    expect(status).toBe(201);
    expect(data.notifies).toBeGreaterThan(0);
    missionId = data.id;
  });

  it('permet à un employé de répondre disponible', async () => {
    const { status } = await api(`/missions/${missionId}/repondre`, {
      method: 'POST',
      headers: avecToken(tokenEmploye),
      body: JSON.stringify({ statut: 'disponible' }),
    });
    expect(status).toBe(200);
  });

  it('reflète la réponse dans la liste des réponses admin', async () => {
    const { data } = await api(`/missions/${missionId}/reponses`, { headers: avecToken(tokenAdmin) });
    const reponseSofia = data.find((r) => r.statut === 'disponible');
    expect(reponseSofia).toBeDefined();
    expect(reponseSofia.prenom).toBe('Sofia');
  });

  it('permet de modifier une mission', async () => {
    const { status } = await api(`/missions/${missionId}`, {
      method: 'PATCH',
      headers: avecToken(tokenAdmin),
      body: JSON.stringify({ titre: 'Salon Test Modifié' }),
    });
    expect(status).toBe(200);
  });
});

describe('Absences', () => {
  it('un employé peut faire une demande, elle reste en attente', async () => {
    const { status, data } = await api('/absences', {
      method: 'POST',
      headers: avecToken(tokenEmploye),
      body: JSON.stringify({ date_debut: '2026-10-01', heure_debut: '00:00', date_fin: '2026-10-02', heure_fin: '23:59', motif: 'Test' }),
    });
    expect(status).toBe(201);
    expect(data.statut).toBe('en_attente');
  });

  it('un admin déclarant une absence pour un employé, elle est directement acceptée', async () => {
    const { data: utilisateurs } = await api('/utilisateurs', { headers: avecToken(tokenAdmin) });
    const marc = utilisateurs.find((u) => u.prenom === 'Marc');

    const { status, data } = await api('/absences', {
      method: 'POST',
      headers: avecToken(tokenAdmin),
      body: JSON.stringify({ utilisateur_id: marc.id, date_debut: '2026-10-05', heure_debut: '00:00', date_fin: '2026-10-06', heure_fin: '23:59', motif: 'Congé' }),
    });
    expect(status).toBe(201);
    expect(data.statut).toBe('acceptee');
  });
});

describe('Licence / abonnement', () => {
  it('expose un statut d\'abonnement valide via les paramètres', async () => {
    const { data } = await api('/parametres', { headers: avecToken(tokenAdmin) });
    expect(data.statut_abonnement).toBeDefined();
    expect(['essai', 'actif', 'suspendu', 'resilie']).toContain(data.statut_abonnement);
  });
});

describe('Santé du serveur', () => {
  it('répond sur /api/sante', async () => {
    const { status, data } = await api('/sante');
    expect(status).toBe(200);
    expect(data.ok).toBe(true);
  });
});
