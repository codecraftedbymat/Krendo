import { pool, initDb } from './db.js';
import bcrypt from 'bcryptjs';

const hash = (pwd) => bcrypt.hashSync(pwd, 10);

async function creerAdminPlateformeSiBesoin() {
  if (!process.env.PLATEFORME_ADMIN_EMAIL || !process.env.PLATEFORME_ADMIN_MOT_DE_PASSE) {
    console.log('Astuce: définissez PLATEFORME_ADMIN_EMAIL et PLATEFORME_ADMIN_MOT_DE_PASSE pour créer votre accès back-office.');
    return;
  }
  const { rows: existants } = await pool.query('SELECT COUNT(*) as n FROM plateforme_admins');
  if (Number(existants[0].n) > 0) return;
  await pool.query(
    'INSERT INTO plateforme_admins (email, mot_de_passe_hash, nom) VALUES ($1,$2,$3)',
    [process.env.PLATEFORME_ADMIN_EMAIL, hash(process.env.PLATEFORME_ADMIN_MOT_DE_PASSE), process.env.PLATEFORME_ADMIN_NOM || 'Admin']
  );
  console.log('Admin plateforme (back-office) créé ->', process.env.PLATEFORME_ADMIN_EMAIL);
}

async function seed() {
  await initDb();
  await creerAdminPlateformeSiBesoin();

  const { rows: existants } = await pool.query('SELECT COUNT(*) as n FROM entreprises');
  if (Number(existants[0].n) > 0) {
    console.log('Des données de démo existent déjà, seed de démo ignoré.');
    await pool.end();
    return;
  }

  const { rows: [entreprise] } = await pool.query(
    'INSERT INTO entreprises (nom) VALUES ($1) RETURNING id',
    ['Événementiel Plus']
  );
  const entrepriseId = entreprise.id;

  const roles = [
    { nom: 'Super admin', peut_gerer_comptes: true, peut_creer_missions: true, peut_valider_absences: true, peut_valider_heures: true, peut_modifier_creneaux: true, peut_voir_tout: true },
    { nom: 'Admin planning', peut_gerer_comptes: false, peut_creer_missions: true, peut_valider_absences: false, peut_valider_heures: false, peut_modifier_creneaux: true, peut_voir_tout: false },
    { nom: 'Admin RH', peut_gerer_comptes: false, peut_creer_missions: false, peut_valider_absences: true, peut_valider_heures: true, peut_modifier_creneaux: false, peut_voir_tout: false },
    { nom: 'Employé', peut_gerer_comptes: false, peut_creer_missions: false, peut_valider_absences: false, peut_valider_heures: false, peut_modifier_creneaux: false, peut_voir_tout: false },
  ];
  const roleIds = {};
  for (const r of roles) {
    const { rows: [role] } = await pool.query(
      `INSERT INTO roles (nom, peut_gerer_comptes, peut_creer_missions, peut_valider_absences, peut_valider_heures, peut_modifier_creneaux, peut_voir_tout)
       VALUES ($1,$2,$3,$4,$5,$6,$7) RETURNING id`,
      [r.nom, r.peut_gerer_comptes, r.peut_creer_missions, r.peut_valider_absences, r.peut_valider_heures, r.peut_modifier_creneaux, r.peut_voir_tout]
    );
    roleIds[r.nom] = role.id;
  }

  const { rows: [superAdmin] } = await pool.query(
    `INSERT INTO utilisateurs (entreprise_id, role_id, prenom, nom, email, mot_de_passe_hash) VALUES ($1,$2,$3,$4,$5,$6) RETURNING id`,
    [entrepriseId, roleIds['Super admin'], 'Camille', 'Admin', 'admin@evenementielplus.fr', hash('demo1234')]
  );
  const superAdminId = superAdmin.id;

  const employes = [
    ['Sofia', 'Lambert', 'sofia.lambert@evenementielplus.fr'],
    ['Tom', 'Dubois', 'tom.dubois@evenementielplus.fr'],
    ['Marc', 'Leroy', 'marc.leroy@evenementielplus.fr'],
    ['Julie', 'Renard', 'julie.renard@evenementielplus.fr'],
  ];
  for (const [prenom, nom, email] of employes) {
    await pool.query(
      `INSERT INTO utilisateurs (entreprise_id, role_id, prenom, nom, email, mot_de_passe_hash) VALUES ($1,$2,$3,$4,$5,$6)`,
      [entrepriseId, roleIds['Employé'], prenom, nom, email, hash('demo1234')]
    );
  }

  const { rows: [mission] } = await pool.query(
    `INSERT INTO missions (entreprise_id, titre, lieu, date_debut, heure_debut, date_fin, heure_fin, nb_employes_requis, description, cree_par_utilisateur_id)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10) RETURNING id`,
    [entrepriseId, 'Salon Tech Expo', 'Paris Expo Porte de Versailles', '2026-08-18', '08:00', '2026-08-18', '18:00', 6, 'Stand accueil et démonstrations', superAdminId]
  );

  console.log('Seed terminé.');
  console.log('Entreprise ID:', entrepriseId, '| Mission ID:', mission.id);
  console.log('Connexion admin -> admin@evenementielplus.fr / demo1234');
  console.log('Connexion employé -> sofia.lambert@evenementielplus.fr / demo1234');

  await pool.end();
}

seed().catch((err) => {
  console.error('Erreur pendant le seed:', err);
  process.exit(1);
});
