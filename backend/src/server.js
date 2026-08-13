import express from 'express';
import cors from 'cors';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { db } from './db.js';

const app = express();
app.use(cors());
app.use(express.json());

const JWT_SECRET = 'cle-secrete-de-demo-a-changer-en-production';

// --- Middleware d'authentification : vérifie le token sur chaque route protégée ---
function authentifier(req, res, next) {
  const header = req.headers.authorization;
  if (!header) return res.status(401).json({ erreur: 'Non authentifié' });
  try {
    const payload = jwt.verify(header.replace('Bearer ', ''), JWT_SECRET);
    req.utilisateur = payload;
    next();
  } catch {
    return res.status(401).json({ erreur: 'Session invalide, reconnectez-vous' });
  }
}

// --- Middleware de permission : vérifie qu'un rôle a bien le droit demandé ---
function requiresPermission(permission) {
  return (req, res, next) => {
    const role = db.prepare('SELECT * FROM roles WHERE id = ?').get(req.utilisateur.role_id);
    if (!role || (!role[permission] && !role.peut_voir_tout)) {
      return res.status(403).json({ erreur: "Vous n'avez pas les droits pour cette action" });
    }
    next();
  };
}

// ============ AUTHENTIFICATION ============
// Seul un compte déjà créé par un admin peut se connecter (pas d'auto-inscription)
app.post('/api/connexion', (req, res) => {
  const { email, mot_de_passe } = req.body;
  const user = db.prepare('SELECT * FROM utilisateurs WHERE email = ? AND actif = 1').get(email);
  if (!user || !bcrypt.compareSync(mot_de_passe, user.mot_de_passe_hash)) {
    return res.status(401).json({ erreur: 'Email ou mot de passe incorrect' });
  }
  const role = db.prepare('SELECT * FROM roles WHERE id = ?').get(user.role_id);
  const token = jwt.sign(
    { id: user.id, entreprise_id: user.entreprise_id, role_id: user.role_id, role_nom: role.nom },
    JWT_SECRET, { expiresIn: '12h' }
  );
  res.json({
    token,
    utilisateur: { id: user.id, prenom: user.prenom, nom: user.nom, email: user.email, role: role.nom, permissions: role }
  });
});

// ============ MISSIONS ============
app.get('/api/missions', authentifier, (req, res) => {
  const missions = db.prepare('SELECT * FROM missions WHERE entreprise_id = ? ORDER BY date_debut').all(req.utilisateur.entreprise_id);
  res.json(missions);
});

app.post('/api/missions', authentifier, requiresPermission('peut_creer_missions'), (req, res) => {
  const { titre, lieu, date_debut, heure_debut, date_fin, heure_fin, nb_employes_requis, description } = req.body;
  const result = db.prepare(`INSERT INTO missions (entreprise_id, titre, lieu, date_debut, heure_debut, date_fin, heure_fin, nb_employes_requis, description, cree_par_utilisateur_id) VALUES (?,?,?,?,?,?,?,?,?,?)`)
    .run(req.utilisateur.entreprise_id, titre, lieu, date_debut, heure_debut, date_fin, heure_fin, nb_employes_requis, description, req.utilisateur.id);

  // Notifie tous les employés de l'entreprise + prépare l'email d'alerte
  const employes = db.prepare(`SELECT u.id FROM utilisateurs u JOIN roles r ON u.role_id = r.id WHERE u.entreprise_id = ? AND r.nom = 'Employé' AND u.actif = 1`).all(req.utilisateur.entreprise_id);
  const insertNotif = db.prepare(`INSERT INTO notifications (utilisateur_id, type, titre, contenu, lien_id) VALUES (?,?,?,?,?)`);
  const insertReponse = db.prepare(`INSERT INTO mission_reponses (mission_id, utilisateur_id, statut) VALUES (?,?,'en_attente')`);
  for (const emp of employes) {
    insertNotif.run(emp.id, 'nouvelle_mission', 'Nouvelle mission disponible', `${titre} - confirmez votre disponibilité`, result.lastInsertRowid);
    insertReponse.run(result.lastInsertRowid, emp.id);
    // -> ici viendra l'envoi réel de l'email (ex: "Un message a été envoyé, connectez-vous pour le consulter")
  }
  res.status(201).json({ id: result.lastInsertRowid, notifies: employes.length });
});

app.get('/api/missions/:id/reponses', authentifier, (req, res) => {
  const reponses = db.prepare(`
    SELECT mr.*, u.prenom, u.nom FROM mission_reponses mr
    JOIN utilisateurs u ON mr.utilisateur_id = u.id
    WHERE mr.mission_id = ?`).all(req.params.id);
  res.json(reponses);
});

// L'employé répond disponible/indisponible (avec motif si indisponible)
app.post('/api/missions/:id/repondre', authentifier, (req, res) => {
  const { statut, commentaire } = req.body;
  if (!['disponible', 'indisponible'].includes(statut)) {
    return res.status(400).json({ erreur: 'Statut invalide' });
  }
  db.prepare(`
    INSERT INTO mission_reponses (mission_id, utilisateur_id, statut, commentaire, repondu_le)
    VALUES (?, ?, ?, ?, CURRENT_TIMESTAMP)
    ON CONFLICT(mission_id, utilisateur_id) DO UPDATE SET
      statut = excluded.statut, commentaire = excluded.commentaire, repondu_le = excluded.repondu_le
  `).run(req.params.id, req.utilisateur.id, statut, commentaire || null);
  res.json({ ok: true });
});

// ============ ABSENCES ============
app.post('/api/absences', authentifier, (req, res) => {
  const { date_debut, heure_debut, date_fin, heure_fin, motif } = req.body;
  const result = db.prepare(`INSERT INTO absences (entreprise_id, utilisateur_id, date_debut, heure_debut, date_fin, heure_fin, motif) VALUES (?,?,?,?,?,?,?)`)
    .run(req.utilisateur.entreprise_id, req.utilisateur.id, date_debut, heure_debut, date_fin, heure_fin, motif);
  res.status(201).json({ id: result.lastInsertRowid });
});

app.get('/api/absences', authentifier, (req, res) => {
  const absences = db.prepare(`
    SELECT a.*, u.prenom, u.nom FROM absences a
    JOIN utilisateurs u ON a.utilisateur_id = u.id
    WHERE a.entreprise_id = ? ORDER BY a.date_debut`).all(req.utilisateur.entreprise_id);
  res.json(absences);
});

app.patch('/api/absences/:id', authentifier, requiresPermission('peut_valider_absences'), (req, res) => {
  const { statut } = req.body; // 'acceptee' ou 'refusee'
  db.prepare(`UPDATE absences SET statut = ?, traite_par_utilisateur_id = ? WHERE id = ?`).run(statut, req.utilisateur.id, req.params.id);
  const absence = db.prepare('SELECT * FROM absences WHERE id = ?').get(req.params.id);
  db.prepare(`INSERT INTO notifications (utilisateur_id, type, titre, contenu, lien_id) VALUES (?,?,?,?,?)`)
    .run(absence.utilisateur_id, 'absence_traitee', `Demande d'absence ${statut === 'acceptee' ? 'acceptée' : 'refusée'}`, `Du ${absence.date_debut} au ${absence.date_fin}`, absence.id);
  res.json({ ok: true });
});

// ============ EMPLOYÉS (créés uniquement par un admin) ============
app.get('/api/utilisateurs', authentifier, (req, res) => {
  const users = db.prepare(`SELECT u.id, u.prenom, u.nom, u.email, u.actif, r.nom as role FROM utilisateurs u JOIN roles r ON u.role_id = r.id WHERE u.entreprise_id = ?`).all(req.utilisateur.entreprise_id);
  res.json(users);
});

app.post('/api/utilisateurs', authentifier, requiresPermission('peut_gerer_comptes'), (req, res) => {
  const { prenom, nom, email, mot_de_passe, role_id } = req.body;
  const hash = bcrypt.hashSync(mot_de_passe, 10);
  const result = db.prepare(`INSERT INTO utilisateurs (entreprise_id, role_id, prenom, nom, email, mot_de_passe_hash, cree_par_utilisateur_id) VALUES (?,?,?,?,?,?,?)`)
    .run(req.utilisateur.entreprise_id, role_id, prenom, nom, email, hash, req.utilisateur.id);
  res.status(201).json({ id: result.lastInsertRowid });
});

const PORT = 3001;
app.listen(PORT, () => console.log(`Serveur backend démarré sur http://localhost:${PORT}`));
