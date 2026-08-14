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

app.patch('/api/utilisateurs/:id', authentifier, requiresPermission('peut_gerer_comptes'), async (req, res) => {
  const { actif, role_id } = req.body;
  const champs = [];
  const valeurs = [];
  let i = 1;
  if (actif !== undefined) { champs.push(`actif = $${i++}`); valeurs.push(actif); }
  if (role_id !== undefined) { champs.push(`role_id = $${i++}`); valeurs.push(role_id); }
  if (champs.length === 0) return res.status(400).json({ erreur: 'Rien à mettre à jour' });
  valeurs.push(req.params.id, req.utilisateur.entreprise_id);
  await pool.query(`UPDATE utilisateurs SET ${champs.join(', ')} WHERE id = $${i++} AND entreprise_id = $${i}`, valeurs);
  res.json({ ok: true });
});

app.delete('/api/utilisateurs/:id', authentifier, requiresPermission('peut_gerer_comptes'), async (req, res) => {
  const idACible = Number(req.params.id);

  if (idACible === req.utilisateur.id) {
    return res.status(400).json({ erreur: 'Vous ne pouvez pas supprimer votre propre compte.' });
  }

  const { rows: [cible] } = await pool.query(
    'SELECT u.*, r.nom as role_nom FROM utilisateurs u JOIN roles r ON u.role_id = r.id WHERE u.id = $1 AND u.entreprise_id = $2',
    [idACible, req.utilisateur.entreprise_id]
  );
  if (!cible) return res.status(404).json({ erreur: 'Utilisateur introuvable.' });

  if (cible.role_nom === 'Super admin') {
    const { rows: [{ count }] } = await pool.query(
      `SELECT COUNT(*) FROM utilisateurs u JOIN roles r ON u.role_id = r.id
       WHERE u.entreprise_id = $1 AND r.nom = 'Super admin' AND u.actif = TRUE`,
      [req.utilisateur.entreprise_id]
    );
    if (Number(count) <= 1) {
      return res.status(400).json({ erreur: 'Impossible de supprimer le dernier super admin de l\'entreprise.' });
    }
  }

  try {
    await pool.query('DELETE FROM utilisateurs WHERE id = $1 AND entreprise_id = $2', [idACible, req.utilisateur.entreprise_id]);
    res.json({ ok: true, supprime: true });
  } catch (err) {
    if (err.code === '23503') {
      // Contrainte de clé étrangère : cette personne a déjà des missions/messages/heures liés à elle.
      // On désactive son compte plutôt que de perdre l'historique.
      await pool.query('UPDATE utilisateurs SET actif = FALSE WHERE id = $1 AND entreprise_id = $2', [idACible, req.utilisateur.entreprise_id]);
      return res.json({ ok: true, supprime: false, desactive: true, message: "Ce compte a un historique (missions, messages ou heures) et ne peut pas être supprimé sans perdre ces données. Il a été désactivé à la place." });
    }
    throw err;
  }
});

// ============ RÔLES (pour peupler le formulaire de création de compte) ============
app.get('/api/roles', authentifier, async (req, res) => {
  const { rows } = await pool.query('SELECT id, nom FROM roles ORDER BY id');
  res.json(rows);
});

// ============ CRÉNEAUX & HEURES ============
// Liste des créneaux d'une mission (un par employé ayant répondu "disponible" ou déjà assigné)
app.get('/api/missions/:id/creneaux', authentifier, async (req, res) => {
  const { rows } = await pool.query(
    `SELECT c.*, u.prenom, u.nom FROM creneaux c
     JOIN utilisateurs u ON c.utilisateur_id = u.id
     WHERE c.mission_id = $1 ORDER BY c.est_heure_supplementaire, u.prenom`,
    [req.params.id]
  );
  res.json(rows);
});

// Tous les créneaux de l'entreprise, toutes missions confondues (vue globale pour la page Heures)
app.get('/api/creneaux', authentifier, async (req, res) => {
  const { rows } = await pool.query(
    `SELECT c.*, u.prenom, u.nom, m.titre as mission_titre, m.date_debut as mission_date
     FROM creneaux c
     JOIN utilisateurs u ON c.utilisateur_id = u.id
     JOIN missions m ON c.mission_id = m.id
     WHERE m.entreprise_id = $1
     ORDER BY m.date_debut DESC, c.est_heure_supplementaire, u.prenom`,
    [req.utilisateur.entreprise_id]
  );
  res.json(rows);
});

// Crée ou modifie le créneau d'un employé sur une mission (admin uniquement)
app.put('/api/missions/:id/creneaux/:utilisateurId', authentifier, requiresPermission('peut_modifier_creneaux'), async (req, res) => {
  const { heure_debut, heure_fin, est_heure_supplementaire, motif } = req.body;
  const { rows: [creneau] } = await pool.query(
    `INSERT INTO creneaux (mission_id, utilisateur_id, heure_debut, heure_fin, est_heure_supplementaire, motif, modifie_par_utilisateur_id)
     VALUES ($1,$2,$3,$4,$5,$6,$7) RETURNING id`,
    [req.params.id, req.params.utilisateurId, heure_debut, heure_fin, !!est_heure_supplementaire, motif || null, req.utilisateur.id]
  );
  await pool.query(
    `INSERT INTO notifications (utilisateur_id, type, titre, contenu, lien_id) VALUES ($1,$2,$3,$4,$5)`,
    [req.params.utilisateurId, 'creneau_modifie', 'Votre créneau a été modifié', `Nouveaux horaires : ${heure_debut} - ${heure_fin}`, req.params.id]
  );
  res.status(201).json({ id: creneau.id });
});

app.delete('/api/creneaux/:id', authentifier, requiresPermission('peut_modifier_creneaux'), async (req, res) => {
  await pool.query('DELETE FROM creneaux WHERE id = $1', [req.params.id]);
  res.json({ ok: true });
});

// Validation / annulation des heures (admin RH ou super admin)
app.patch('/api/creneaux/:id/statut', authentifier, requiresPermission('peut_valider_heures'), async (req, res) => {
  const { statut_validation } = req.body; // 'valide' ou 'annule'
  await pool.query('UPDATE creneaux SET statut_validation = $1 WHERE id = $2', [statut_validation, req.params.id]);
  res.json({ ok: true });
});

// ============ CHAT ============
// Liste des conversations de l'utilisateur connecté
app.get('/api/conversations', authentifier, async (req, res) => {
  const { rows } = await pool.query(
    `SELECT c.*,
       ua.prenom as prenom_a, ua.nom as nom_a,
       ub.prenom as prenom_b, ub.nom as nom_b,
       (SELECT contenu FROM messages m WHERE m.conversation_id = c.id ORDER BY m.envoye_le DESC LIMIT 1) as dernier_message,
       (SELECT envoye_le FROM messages m WHERE m.conversation_id = c.id ORDER BY m.envoye_le DESC LIMIT 1) as dernier_message_le
     FROM conversations c
     JOIN utilisateurs ua ON c.utilisateur_a_id = ua.id
     JOIN utilisateurs ub ON c.utilisateur_b_id = ub.id
     WHERE c.entreprise_id = $1 AND (c.utilisateur_a_id = $2 OR c.utilisateur_b_id = $2)
     ORDER BY dernier_message_le DESC NULLS LAST`,
    [req.utilisateur.entreprise_id, req.utilisateur.id]
  );
  res.json(rows);
});

// Récupère (ou crée) la conversation avec un autre utilisateur
app.post('/api/conversations', authentifier, async (req, res) => {
  const { utilisateur_id, mission_id } = req.body;
  const a = Math.min(req.utilisateur.id, utilisateur_id);
  const b = Math.max(req.utilisateur.id, utilisateur_id);

  const { rows: existantes } = await pool.query(
    `SELECT * FROM conversations WHERE entreprise_id = $1 AND utilisateur_a_id = $2 AND utilisateur_b_id = $3 AND mission_id IS NOT DISTINCT FROM $4`,
    [req.utilisateur.entreprise_id, a, b, mission_id || null]
  );
  if (existantes[0]) return res.json(existantes[0]);

  const { rows: [conv] } = await pool.query(
    `INSERT INTO conversations (entreprise_id, mission_id, utilisateur_a_id, utilisateur_b_id) VALUES ($1,$2,$3,$4) RETURNING *`,
    [req.utilisateur.entreprise_id, mission_id || null, a, b]
  );
  res.status(201).json(conv);
});

app.get('/api/conversations/:id/messages', authentifier, async (req, res) => {
  const { rows } = await pool.query(
    `SELECT m.*, u.prenom, u.nom FROM messages m
     JOIN utilisateurs u ON m.expediteur_utilisateur_id = u.id
     WHERE m.conversation_id = $1 ORDER BY m.envoye_le ASC`,
    [req.params.id]
  );
  res.json(rows);
});

app.post('/api/conversations/:id/messages', authentifier, async (req, res) => {
  const { contenu } = req.body;
  if (!contenu || !contenu.trim()) return res.status(400).json({ erreur: 'Message vide' });

  const { rows: [message] } = await pool.query(
    `INSERT INTO messages (conversation_id, expediteur_utilisateur_id, contenu) VALUES ($1,$2,$3) RETURNING *`,
    [req.params.id, req.utilisateur.id, contenu.trim()]
  );

  // Notifie l'autre participant + email d'alerte (sans le contenu, par confidentialité)
  const { rows: [conv] } = await pool.query('SELECT * FROM conversations WHERE id = $1', [req.params.id]);
  const destinataireId = conv.utilisateur_a_id === req.utilisateur.id ? conv.utilisateur_b_id : conv.utilisateur_a_id;
  await pool.query(
    `INSERT INTO notifications (utilisateur_id, type, titre, contenu, lien_id) VALUES ($1,$2,$3,$4,$5)`,
    [destinataireId, 'nouveau_message', 'Nouveau message', 'Un nouveau message vous concernant a été envoyé — connectez-vous pour le consulter.', conv.id]
  );

  res.status(201).json(message);
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
