import { db } from './db.js';
import bcrypt from 'bcryptjs';

const dejaRempli = db.prepare('SELECT COUNT(*) as n FROM entreprises').get().n > 0;
if (dejaRempli) {
  console.log('Des données existent déjà, seed ignoré.');
  process.exit(0);
}

const hash = (pwd) => bcrypt.hashSync(pwd, 10);

// 1. Entreprise cliente
const entrepriseId = db.prepare('INSERT INTO entreprises (nom) VALUES (?)').run('Événementiel Plus').lastInsertRowid;

// 2. Les 4 rôles définis avec des droits différents
const roles = [
  { nom: 'Super admin', peut_gerer_comptes: 1, peut_creer_missions: 1, peut_valider_absences: 1, peut_valider_heures: 1, peut_modifier_creneaux: 1, peut_voir_tout: 1 },
  { nom: 'Admin planning', peut_gerer_comptes: 0, peut_creer_missions: 1, peut_valider_absences: 0, peut_valider_heures: 0, peut_modifier_creneaux: 1, peut_voir_tout: 0 },
  { nom: 'Admin RH', peut_gerer_comptes: 0, peut_creer_missions: 0, peut_valider_absences: 1, peut_valider_heures: 1, peut_modifier_creneaux: 0, peut_voir_tout: 0 },
  { nom: 'Employé', peut_gerer_comptes: 0, peut_creer_missions: 0, peut_valider_absences: 0, peut_valider_heures: 0, peut_modifier_creneaux: 0, peut_voir_tout: 0 },
];
const roleIds = {};
const insRole = db.prepare(`INSERT INTO roles (nom, peut_gerer_comptes, peut_creer_missions, peut_valider_absences, peut_valider_heures, peut_modifier_creneaux, peut_voir_tout) VALUES (@nom,@peut_gerer_comptes,@peut_creer_missions,@peut_valider_absences,@peut_valider_heures,@peut_modifier_creneaux,@peut_voir_tout)`);
for (const r of roles) {
  const id = insRole.run(r).lastInsertRowid;
  roleIds[r.nom] = id;
}

// 3. Comptes utilisateurs (mot de passe de test identique pour tous: "demo1234")
const insUser = db.prepare(`INSERT INTO utilisateurs (entreprise_id, role_id, prenom, nom, email, mot_de_passe_hash) VALUES (?,?,?,?,?,?)`);

const superAdminId = insUser.run(entrepriseId, roleIds['Super admin'], 'Camille', 'Admin', 'admin@evenementielplus.fr', hash('demo1234')).lastInsertRowid;

const employes = [
  ['Sofia', 'Lambert', 'sofia.lambert@evenementielplus.fr'],
  ['Tom', 'Dubois', 'tom.dubois@evenementielplus.fr'],
  ['Marc', 'Leroy', 'marc.leroy@evenementielplus.fr'],
  ['Julie', 'Renard', 'julie.renard@evenementielplus.fr'],
];
const employeIds = {};
for (const [prenom, nom, email] of employes) {
  const id = insUser.run(entrepriseId, roleIds['Employé'], prenom, nom, email, hash('demo1234')).lastInsertRowid;
  employeIds[prenom] = id;
}

// 4. Une mission de démo
const missionId = db.prepare(`INSERT INTO missions (entreprise_id, titre, lieu, date_debut, heure_debut, date_fin, heure_fin, nb_employes_requis, description, cree_par_utilisateur_id) VALUES (?,?,?,?,?,?,?,?,?,?)`)
  .run(entrepriseId, 'Salon Tech Expo', 'Paris Expo Porte de Versailles', '2026-08-18', '08:00', '2026-08-18', '18:00', 6, 'Stand accueil et démonstrations', superAdminId).lastInsertRowid;

console.log('Seed terminé.');
console.log('Entreprise ID:', entrepriseId, '| Mission ID:', missionId);
console.log('Connexion admin -> admin@evenementielplus.fr / demo1234');
console.log('Connexion employé -> sofia.lambert@evenementielplus.fr / demo1234');
