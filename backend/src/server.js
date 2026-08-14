import express from 'express';
import cors from 'cors';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { pool, initDb } from './db.js';

const app = express();
app.use(cors());
app.use(express.json());

const JWT_SECRET = process.env.JWT_SECRET || 'cle-secrete-de-demo-a-changer-en-production';

// --- Middleware d'authentification : vérifie le token + le statut de l'entreprise ---
async function authentifier(req, res, next) {
  const header = req.headers.authorization;
  if (!header) return res.status(401).json({ erreur: 'Non authentifié' });
  try {
    const payload = jwt.verify(header.replace('Bearer ', ''), JWT_SECRET);
    const { rows } = await pool.query('SELECT statut_abonnement FROM entreprises WHERE id = $1', [payload.entreprise_id]);
    const entreprise = rows[0];
    if (!entreprise || entreprise.statut_abonnement === 'suspendu' || entreprise.statut_abonnement === 'resilie') {
      return res.status(403).json({ erreur: "L'accès de votre entreprise est actuellement suspendu." });
    }
    req.utilisateur = payload;
    next();
  } catch {
    return res.status(401).json({ erreur: 'Session invalide, reconnectez-vous' });
  }
}

// --- Middleware de permission ---
function requiresPermission(permission) {
  return async (req, res, next) => {
    const { rows } = await pool.query('SELECT * FROM roles WHERE id = $1', [req.utilisateur.role_id]);
    const role = rows[0];
    if (!role || (!role[permission] && !role.peut_voir_tout)) {
      return res.status(403).json({ erreur: "Vous n'avez pas les droits pour cette action" });
    }
    next();
  };
}

// ============ AUTHENTIFICATION ============
app.post('/api/connexion', async (req, res) => {
  const { email, mot_de_passe } = req.body;
  const { rows: userRows } = await pool.query('SELECT * FROM utilisateurs WHERE email = $1 AND actif = TRUE', [email]);
  const user = userRows[0];
  if (!user || !bcrypt.compareSync(mot_de_passe, user.mot_de_passe_hash)) {
    return res.status(401).json({ erreur: 'Email ou mot de passe incorrect' });
  }
  const { rows: entrepriseRows } = await pool.query('SELECT * FROM entreprises WHERE id = $1', [user.entreprise_id]);
  const entreprise = entrepriseRows[0];
  if (entreprise.statut_abonnement === 'suspendu' || entreprise.statut_abonnement === 'resilie') {
    return res.status(403).json({ erreur: "L'accès de votre entreprise est actuellement suspendu. Contactez votre administrateur." });
  }
  const { rows: roleRows } = await pool.query('SELECT * FROM roles WHERE id = $1', [user.role_id]);
  const role = roleRows[0];
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
app.get('/api/missions', authentifier, async (req, res) => {
  const { rows } = await pool.query('SELECT * FROM missions WHERE entreprise_id = $1 ORDER BY date_debut', [req.utilisateur.entreprise_id]);
  res.json(rows);
});

app.post('/api/missions', authentifier, requiresPermission('peut_creer_missions'), async (req, res) => {
  const { titre, lieu, date_debut, heure_debut, date_fin, heure_fin, nb_employes_requis, description } = req.body;
  const { rows: [mission] } = await pool.query(
    `INSERT INTO missions (entreprise_id, titre, lieu, date_debut, heure_debut, date_fin, heure_fin, nb_employes_requis, description, cree_par_utilisateur_id)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10) RETURNING id`,
    [req.utilisateur.entreprise_id, titre, lieu, date_debut, heure_debut, date_fin, heure_fin, nb_employes_requis, description, req.utilisateur.id]
  );

  const { rows: employes } = await pool.query(
    `SELECT u.id FROM utilisateurs u JOIN roles r ON u.role_id = r.id WHERE u.entreprise_id = $1 AND r.nom = 'Employé' AND u.actif = TRUE`,
    [req.utilisateur.entreprise_id]
  );
  for (const emp of employes) {
    await pool.query(
      `INSERT INTO notifications (utilisateur_id, type, titre, contenu, lien_id) VALUES ($1,$2,$3,$4,$5)`,
      [emp.id, 'nouvelle_mission', 'Nouvelle mission disponible', `${titre} - confirmez votre disponibilité`, mission.id]
    );
    await pool.query(
      `INSERT INTO mission_reponses (mission_id, utilisateur_id, statut) VALUES ($1,$2,'en_attente')`,
      [mission.id, emp.id]
    );
    // -> ici viendra l'envoi réel de l'email
  }
  res.status(201).json({ id: mission.id, notifies: employes.length });
});

app.get('/api/missions/:id/reponses', authentifier, async (req, res) => {
  const { rows } = await pool.query(
    `SELECT mr.*, u.prenom, u.nom FROM mission_reponses mr
     JOIN utilisateurs u ON mr.utilisateur_id = u.id
     WHERE mr.mission_id = $1`, [req.params.id]);
  res.json(rows);
});

app.post('/api/missions/:id/repondre', authentifier, async (req, res) => {
  const { statut, commentaire } = req.body;
  if (!['disponible', 'indisponible'].includes(statut)) {
    return res.status(400).json({ erreur: 'Statut invalide' });
  }
  await pool.query(
    `INSERT INTO mission_reponses (mission_id, utilisateur_id, statut, commentaire, repondu_le)
     VALUES ($1, $2, $3, $4, CURRENT_TIMESTAMP)
     ON CONFLICT (mission_id, utilisateur_id) DO UPDATE SET
       statut = EXCLUDED.statut, commentaire = EXCLUDED.commentaire, repondu_le = EXCLUDED.repondu_le`,
    [req.params.id, req.utilisateur.id, statut, commentaire || null]
  );
  res.json({ ok: true });
});

// ============ ABSENCES ============
app.post('/api/absences', authentifier, async (req, res) => {
  const { date_debut, heure_debut, date_fin, heure_fin, motif } = req.body;
  const { rows: [absence] } = await pool.query(
    `INSERT INTO absences (entreprise_id, utilisateur_id, date_debut, heure_debut, date_fin, heure_fin, motif) VALUES ($1,$2,$3,$4,$5,$6,$7) RETURNING id`,
    [req.utilisateur.entreprise_id, req.utilisateur.id, date_debut, heure_debut, date_fin, heure_fin, motif]
  );
  res.status(201).json({ id: absence.id });
});

app.get('/api/absences', authentifier, async (req, res) => {
  const { rows } = await pool.query(
    `SELECT a.*, u.prenom, u.nom FROM absences a
     JOIN utilisateurs u ON a.utilisateur_id = u.id
     WHERE a.entreprise_id = $1 ORDER BY a.date_debut`, [req.utilisateur.entreprise_id]);
  res.json(rows);
});

app.patch('/api/absences/:id', authentifier, requiresPermission('peut_valider_absences'), async (req, res) => {
  const { statut } = req.body;
  await pool.query(`UPDATE absences SET statut = $1, traite_par_utilisateur_id = $2 WHERE id = $3`, [statut, req.utilisateur.id, req.params.id]);
  const { rows: [absence] } = await pool.query('SELECT * FROM absences WHERE id = $1', [req.params.id]);
  await pool.query(
    `INSERT INTO notifications (utilisateur_id, type, titre, contenu, lien_id) VALUES ($1,$2,$3,$4,$5)`,
    [absence.utilisateur_id, 'absence_traitee', `Demande d'absence ${statut === 'acceptee' ? 'acceptée' : 'refusée'}`, `Du ${absence.date_debut} au ${absence.date_fin}`, absence.id]
  );
  res.json({ ok: true });
});

// ============ EMPLOYÉS ============
app.get('/api/utilisateurs', authentifier, async (req, res) => {
  const { rows } = await pool.query(
    `SELECT u.id, u.prenom, u.nom, u.email, u.actif, r.nom as role FROM utilisateurs u JOIN roles r ON u.role_id = r.id WHERE u.entreprise_id = $1`,
    [req.utilisateur.entreprise_id]
  );
  res.json(rows);
});

app.post('/api/utilisateurs', authentifier, requiresPermission('peut_gerer_comptes'), async (req, res) => {
  const { prenom, nom, email, mot_de_passe, role_id } = req.body;
  const hash = bcrypt.hashSync(mot_de_passe, 10);
  const { rows: [user] } = await pool.query(
    `INSERT INTO utilisateurs (entreprise_id, role_id, prenom, nom, email, mot_de_passe_hash, cree_par_utilisateur_id) VALUES ($1,$2,$3,$4,$5,$6,$7) RETURNING id`,
    [req.utilisateur.entreprise_id, role_id, prenom, nom, email, hash, req.utilisateur.id]
  );
  res.status(201).json({ id: user.id });
});

app.get('/api/sante', (req, res) => res.json({ ok: true }));

const PORT = process.env.PORT || 3001;

initDb()
  .then(() => {
    app.listen(PORT, () => console.log(`Serveur backend démarré sur le port ${PORT}`));
  })
  .catch((err) => {
    console.error('Erreur de connexion à la base de données:', err);
    process.exit(1);
  });
