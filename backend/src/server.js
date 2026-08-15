import express from 'express';
import cors from 'cors';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import rateLimit from 'express-rate-limit';
import { pool, initDb } from './db.js';
import { envoyerEmail, modelesEmail } from './email.js';

const app = express();
app.use(cors());
app.use(express.json({ limit: '8mb' }));

// Anti brute-force : limite les tentatives de connexion (8 essais / 15 min / IP)
const limiteurConnexion = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 8,
  message: { erreur: 'Trop de tentatives de connexion. Réessayez dans quelques minutes.' },
  standardHeaders: true,
  legacyHeaders: false,
});

// Limite dédiée aux demandes de réinitialisation de mot de passe (plus permissive)
const limiteurMotDePasseOublie = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  message: { erreur: 'Trop de demandes. Réessayez dans quelques minutes.' },
  standardHeaders: true,
  legacyHeaders: false,
});

// Limite générale plus large sur toute l'API, pour éviter les abus automatisés
const limiteurGeneral = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 600,
  standardHeaders: true,
  legacyHeaders: false,
});
app.use('/api', limiteurGeneral);

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
app.post('/api/connexion', limiteurConnexion, async (req, res) => {
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
    `SELECT u.id, u.email, u.prenom FROM utilisateurs u JOIN roles r ON u.role_id = r.id WHERE u.entreprise_id = $1 AND r.nom = 'Employé' AND u.actif = TRUE`,
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
    envoyerEmail({
      destinataireEmail: emp.email, destinataireNom: emp.prenom,
      sujet: 'Nouvelle mission disponible sur Krendo',
      contenuHtml: modelesEmail.nouvelleMission(emp.prenom, titre),
    }).catch(() => {});
    // -> ici viendra l'envoi réel de l'email
  }
  res.status(201).json({ id: mission.id, notifies: employes.length });
});

app.patch('/api/missions/:id', authentifier, requiresPermission('peut_creer_missions'), async (req, res) => {
  const { titre, lieu, date_debut, heure_debut, date_fin, heure_fin, nb_employes_requis, description, planning_visible_tous } = req.body;
  const champs = [];
  const valeurs = [];
  let i = 1;
  const ajouter = (nom, valeur) => { if (valeur !== undefined) { champs.push(`${nom} = $${i++}`); valeurs.push(valeur); } };
  ajouter('titre', titre);
  ajouter('lieu', lieu);
  ajouter('date_debut', date_debut);
  ajouter('heure_debut', heure_debut);
  ajouter('date_fin', date_fin);
  ajouter('heure_fin', heure_fin);
  ajouter('nb_employes_requis', nb_employes_requis);
  ajouter('description', description);
  ajouter('planning_visible_tous', planning_visible_tous);
  if (champs.length === 0) return res.status(400).json({ erreur: 'Rien à mettre à jour' });
  valeurs.push(req.params.id, req.utilisateur.entreprise_id);
  await pool.query(`UPDATE missions SET ${champs.join(', ')} WHERE id = $${i++} AND entreprise_id = $${i}`, valeurs);
  res.json({ ok: true });
});

app.delete('/api/missions/:id', authentifier, requiresPermission('peut_creer_missions'), async (req, res) => {
  const { rows: [mission] } = await pool.query(
    'SELECT id FROM missions WHERE id = $1 AND entreprise_id = $2',
    [req.params.id, req.utilisateur.entreprise_id]
  );
  if (!mission) return res.status(404).json({ erreur: 'Mission introuvable.' });

  // Nettoyage des données liées avant de supprimer la mission elle-même
  const { rows: conversations } = await pool.query('SELECT id FROM conversations WHERE mission_id = $1', [req.params.id]);
  for (const conv of conversations) {
    await pool.query('DELETE FROM messages WHERE conversation_id = $1', [conv.id]);
  }
  await pool.query('DELETE FROM conversations WHERE mission_id = $1', [req.params.id]);
  await pool.query('DELETE FROM creneaux WHERE mission_id = $1', [req.params.id]);
  await pool.query('DELETE FROM mission_reponses WHERE mission_id = $1', [req.params.id]);
  await pool.query('DELETE FROM missions WHERE id = $1', [req.params.id]);

  res.json({ ok: true });
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
  const { utilisateur_id, date_debut, heure_debut, date_fin, heure_fin, motif } = req.body;

  const { rows: [role] } = await pool.query('SELECT * FROM roles WHERE id = $1', [req.utilisateur.role_id]);
  const peutGererPourAutrui = role.peut_valider_absences || role.peut_voir_tout;

  // Un admin habilité peut déclarer une absence pour un autre employé : elle est directement acceptée.
  // Sinon, c'est une demande de l'employé pour lui-même, en attente de validation.
  const cibleId = (utilisateur_id && peutGererPourAutrui) ? utilisateur_id : req.utilisateur.id;
  const estDeclarationAdmin = utilisateur_id && utilisateur_id !== req.utilisateur.id && peutGererPourAutrui;
  const statut = estDeclarationAdmin ? 'acceptee' : 'en_attente';
  const traitePar = estDeclarationAdmin ? req.utilisateur.id : null;

  const { rows: [absence] } = await pool.query(
    `INSERT INTO absences (entreprise_id, utilisateur_id, date_debut, heure_debut, date_fin, heure_fin, motif, statut, traite_par_utilisateur_id)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9) RETURNING id`,
    [req.utilisateur.entreprise_id, cibleId, date_debut, heure_debut, date_fin, heure_fin, motif, statut, traitePar]
  );

  if (estDeclarationAdmin) {
    await pool.query(
      `INSERT INTO notifications (utilisateur_id, type, titre, contenu, lien_id) VALUES ($1,$2,$3,$4,$5)`,
      [cibleId, 'absence_traitee', 'Une absence a été enregistrée pour vous', `Du ${date_debut} au ${date_fin}${motif ? ` — ${motif}` : ''}`, absence.id]
    );
    const { rows: [emp] } = await pool.query('SELECT email, prenom FROM utilisateurs WHERE id = $1', [cibleId]);
    envoyerEmail({
      destinataireEmail: emp.email, destinataireNom: emp.prenom,
      sujet: 'Une absence a été enregistrée pour vous sur Krendo',
      contenuHtml: modelesEmail.absenceTraitee(emp.prenom, 'acceptee', date_debut, date_fin),
    }).catch(() => {});
  }

  res.status(201).json({ id: absence.id, statut });
});

app.get('/api/absences', authentifier, async (req, res) => {
  const { rows } = await pool.query(
    `SELECT a.*, u.prenom, u.nom FROM absences a
     JOIN utilisateurs u ON a.utilisateur_id = u.id
     WHERE a.entreprise_id = $1 ORDER BY a.date_debut`, [req.utilisateur.entreprise_id]);
  res.json(rows);
});

app.patch('/api/absences/:id', authentifier, requiresPermission('peut_valider_absences'), async (req, res) => {
  const { statut, date_debut, heure_debut, date_fin, heure_fin, motif } = req.body;
  const champs = [];
  const valeurs = [];
  let i = 1;
  const ajouter = (nom, valeur) => { if (valeur !== undefined) { champs.push(`${nom} = $${i++}`); valeurs.push(valeur); } };
  ajouter('date_debut', date_debut);
  ajouter('heure_debut', heure_debut);
  ajouter('date_fin', date_fin);
  ajouter('heure_fin', heure_fin);
  ajouter('motif', motif);
  if (statut !== undefined) {
    champs.push(`statut = $${i++}`);
    valeurs.push(statut);
    champs.push(`traite_par_utilisateur_id = $${i++}`);
    valeurs.push(req.utilisateur.id);
  }
  if (champs.length === 0) return res.status(400).json({ erreur: 'Rien à mettre à jour' });
  valeurs.push(req.params.id);
  await pool.query(`UPDATE absences SET ${champs.join(', ')} WHERE id = $${i}`, valeurs);

  if (statut !== undefined) {
    const { rows: [absence] } = await pool.query('SELECT * FROM absences WHERE id = $1', [req.params.id]);
    await pool.query(
      `INSERT INTO notifications (utilisateur_id, type, titre, contenu, lien_id) VALUES ($1,$2,$3,$4,$5)`,
      [absence.utilisateur_id, 'absence_traitee', `Demande d'absence ${statut === 'acceptee' ? 'acceptée' : 'refusée'}`, `Du ${absence.date_debut} au ${absence.date_fin}`, absence.id]
    );
    const { rows: [emp] } = await pool.query('SELECT email, prenom FROM utilisateurs WHERE id = $1', [absence.utilisateur_id]);
    envoyerEmail({
      destinataireEmail: emp.email, destinataireNom: emp.prenom,
      sujet: `Votre demande d'absence a été ${statut === 'acceptee' ? 'acceptée' : 'refusée'}`,
      contenuHtml: modelesEmail.absenceTraitee(emp.prenom, statut, absence.date_debut, absence.date_fin),
    }).catch(() => {});
  }
  res.json({ ok: true });
});

app.delete('/api/absences/:id', authentifier, requiresPermission('peut_valider_absences'), async (req, res) => {
  await pool.query('DELETE FROM absences WHERE id = $1 AND entreprise_id = $2', [req.params.id, req.utilisateur.entreprise_id]);
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
  const { heure_debut, heure_fin, poste, est_heure_supplementaire, motif } = req.body;
  const { rows: [creneau] } = await pool.query(
    `INSERT INTO creneaux (mission_id, utilisateur_id, heure_debut, heure_fin, poste, est_heure_supplementaire, motif, modifie_par_utilisateur_id)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8) RETURNING id`,
    [req.params.id, req.params.utilisateurId, heure_debut, heure_fin, poste || null, !!est_heure_supplementaire, motif || null, req.utilisateur.id]
  );
  await pool.query(
    `INSERT INTO notifications (utilisateur_id, type, titre, contenu, lien_id) VALUES ($1,$2,$3,$4,$5)`,
    [req.params.utilisateurId, 'creneau_modifie', 'Votre créneau a été modifié', `Nouveaux horaires : ${heure_debut} - ${heure_fin}${poste ? ` (${poste})` : ''}`, req.params.id]
  );
  const { rows: [emp] } = await pool.query('SELECT email, prenom FROM utilisateurs WHERE id = $1', [req.params.utilisateurId]);
  envoyerEmail({
    destinataireEmail: emp.email, destinataireNom: emp.prenom,
    sujet: 'Votre créneau a été modifié sur Krendo',
    contenuHtml: modelesEmail.creneauModifie(emp.prenom, heure_debut, heure_fin),
  }).catch(() => {});
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
       (SELECT envoye_le FROM messages m WHERE m.conversation_id = c.id ORDER BY m.envoye_le DESC LIMIT 1) as dernier_message_le,
       (SELECT expediteur_utilisateur_id FROM messages m WHERE m.conversation_id = c.id ORDER BY m.envoye_le DESC LIMIT 1) as dernier_message_expediteur_id,
       (SELECT lu FROM messages m WHERE m.conversation_id = c.id ORDER BY m.envoye_le DESC LIMIT 1) as dernier_message_lu
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
  // Marque comme lus tous les messages de l'autre participant dès que je consulte la conversation
  await pool.query(
    `UPDATE messages SET lu = TRUE
     WHERE conversation_id = $1 AND expediteur_utilisateur_id != $2 AND lu = FALSE`,
    [req.params.id, req.utilisateur.id]
  );

  const { rows } = await pool.query(
    `SELECT m.*, u.prenom, u.nom FROM messages m
     JOIN utilisateurs u ON m.expediteur_utilisateur_id = u.id
     WHERE m.conversation_id = $1 ORDER BY m.envoye_le ASC`,
    [req.params.id]
  );
  res.json(rows);
});

app.post('/api/conversations/:id/messages', authentifier, async (req, res) => {
  const { contenu, piece_jointe } = req.body;
  const texte = (contenu || '').trim();

  if (!texte && !piece_jointe) return res.status(400).json({ erreur: 'Message vide' });
  if (piece_jointe?.data && piece_jointe.data.length > 7_000_000) {
    return res.status(413).json({ erreur: 'Fichier trop volumineux (max ~5 Mo).' });
  }

  const { rows: [message] } = await pool.query(
    `INSERT INTO messages (conversation_id, expediteur_utilisateur_id, contenu, piece_jointe_nom, piece_jointe_type, piece_jointe_data)
     VALUES ($1,$2,$3,$4,$5,$6) RETURNING *`,
    [req.params.id, req.utilisateur.id, texte || null, piece_jointe?.nom || null, piece_jointe?.type || null, piece_jointe?.data || null]
  );

  // Notifie l'autre participant + email d'alerte (sans le contenu, par confidentialité)
  const { rows: [conv] } = await pool.query('SELECT * FROM conversations WHERE id = $1', [req.params.id]);
  const destinataireId = conv.utilisateur_a_id === req.utilisateur.id ? conv.utilisateur_b_id : conv.utilisateur_a_id;
  await pool.query(
    `INSERT INTO notifications (utilisateur_id, type, titre, contenu, lien_id) VALUES ($1,$2,$3,$4,$5)`,
    [destinataireId, 'nouveau_message', 'Nouveau message', 'Un nouveau message vous concernant a été envoyé — connectez-vous pour le consulter.', conv.id]
  );
  const { rows: [destinataire] } = await pool.query('SELECT email, prenom FROM utilisateurs WHERE id = $1', [destinataireId]);
  envoyerEmail({
    destinataireEmail: destinataire.email, destinataireNom: destinataire.prenom,
    sujet: 'Nouveau message sur Krendo',
    contenuHtml: modelesEmail.nouveauMessage(destinataire.prenom),
  }).catch(() => {});

  res.status(201).json(message);
});

// ============ PARAMÈTRES ENTREPRISE (jours travaillés, jours fériés) ============
app.get('/api/parametres', authentifier, async (req, res) => {
  const { rows: [entreprise] } = await pool.query(
    'SELECT nom, jours_travailles, travaille_jours_feries FROM entreprises WHERE id = $1',
    [req.utilisateur.entreprise_id]
  );
  const { rows: exceptions } = await pool.query(
    'SELECT * FROM jours_exceptionnels WHERE entreprise_id = $1 ORDER BY date',
    [req.utilisateur.entreprise_id]
  );
  res.json({ ...entreprise, exceptions });
});

app.patch('/api/parametres', authentifier, requiresPermission('peut_gerer_comptes'), async (req, res) => {
  const { jours_travailles, travaille_jours_feries } = req.body;
  const champs = [];
  const valeurs = [];
  let i = 1;
  if (jours_travailles !== undefined) { champs.push(`jours_travailles = $${i++}`); valeurs.push(jours_travailles); }
  if (travaille_jours_feries !== undefined) { champs.push(`travaille_jours_feries = $${i++}`); valeurs.push(travaille_jours_feries); }
  if (champs.length === 0) return res.status(400).json({ erreur: 'Rien à mettre à jour' });
  valeurs.push(req.utilisateur.entreprise_id);
  await pool.query(`UPDATE entreprises SET ${champs.join(', ')} WHERE id = $${i}`, valeurs);
  res.json({ ok: true });
});

app.post('/api/jours-exceptionnels', authentifier, requiresPermission('peut_gerer_comptes'), async (req, res) => {
  const { date, statut, motif } = req.body;
  const { rows: [jour] } = await pool.query(
    `INSERT INTO jours_exceptionnels (entreprise_id, date, statut, motif) VALUES ($1,$2,$3,$4)
     ON CONFLICT (entreprise_id, date) DO UPDATE SET statut = EXCLUDED.statut, motif = EXCLUDED.motif
     RETURNING *`,
    [req.utilisateur.entreprise_id, date, statut, motif || null]
  );
  res.status(201).json(jour);
});

app.delete('/api/jours-exceptionnels/:id', authentifier, requiresPermission('peut_gerer_comptes'), async (req, res) => {
  await pool.query('DELETE FROM jours_exceptionnels WHERE id = $1 AND entreprise_id = $2', [req.params.id, req.utilisateur.entreprise_id]);
  res.json({ ok: true });
});

// ============ MOT DE PASSE OUBLIÉ ============
app.post('/api/mot-de-passe-oublie', limiteurMotDePasseOublie, async (req, res) => {
  const { email } = req.body;
  const { rows: [user] } = await pool.query('SELECT * FROM utilisateurs WHERE email = $1 AND actif = TRUE', [email]);

  // Réponse identique que le compte existe ou non, pour ne pas révéler quels emails sont enregistrés
  if (user) {
    const token = crypto.randomBytes(32).toString('hex');
    const tokenHash = crypto.createHash('sha256').update(token).digest('hex');
    const expireLe = new Date(Date.now() + 60 * 60 * 1000); // 1h

    await pool.query(
      `INSERT INTO reinitialisations_mot_de_passe (utilisateur_id, token_hash, expire_le) VALUES ($1,$2,$3)`,
      [user.id, tokenHash, expireLe]
    );

    const lien = `${process.env.FRONTEND_URL || ''}/reinitialiser?token=${token}`;
    envoyerEmail({
      destinataireEmail: user.email, destinataireNom: user.prenom,
      sujet: 'Réinitialisation de votre mot de passe Krendo',
      contenuHtml: modelesEmail.reinitialisationMotDePasse(user.prenom, lien),
    }).catch(() => {});
  }

  res.json({ ok: true, message: 'Si un compte existe avec cet email, un lien de réinitialisation a été envoyé.' });
});

app.post('/api/reinitialiser-mot-de-passe', async (req, res) => {
  const { token, nouveau_mot_de_passe } = req.body;
  if (!token || !nouveau_mot_de_passe || nouveau_mot_de_passe.length < 6) {
    return res.status(400).json({ erreur: 'Requête invalide (mot de passe trop court).' });
  }

  const tokenHash = crypto.createHash('sha256').update(token).digest('hex');
  const { rows: [entree] } = await pool.query(
    `SELECT * FROM reinitialisations_mot_de_passe WHERE token_hash = $1 AND utilise = FALSE AND expire_le > NOW()`,
    [tokenHash]
  );
  if (!entree) return res.status(400).json({ erreur: 'Lien invalide ou expiré. Refaites une demande.' });

  const hash = bcrypt.hashSync(nouveau_mot_de_passe, 10);
  await pool.query('UPDATE utilisateurs SET mot_de_passe_hash = $1 WHERE id = $2', [hash, entree.utilisateur_id]);
  await pool.query('UPDATE reinitialisations_mot_de_passe SET utilise = TRUE WHERE id = $1', [entree.id]);

  res.json({ ok: true });
});

// ============ BACK-OFFICE (administration de la plateforme Krendo) ============
function authentifierPlateforme(req, res, next) {
  const header = req.headers.authorization;
  if (!header) return res.status(401).json({ erreur: 'Non authentifié' });
  try {
    const payload = jwt.verify(header.replace('Bearer ', ''), JWT_SECRET);
    if (!payload.plateforme_admin) return res.status(403).json({ erreur: 'Accès réservé au back-office.' });
    req.plateformeAdmin = payload;
    next();
  } catch {
    return res.status(401).json({ erreur: 'Session invalide, reconnectez-vous' });
  }
}

app.post('/api/plateforme/connexion', limiteurConnexion, async (req, res) => {
  const { email, mot_de_passe } = req.body;
  const { rows: [admin] } = await pool.query('SELECT * FROM plateforme_admins WHERE email = $1', [email]);
  if (!admin || !bcrypt.compareSync(mot_de_passe, admin.mot_de_passe_hash)) {
    return res.status(401).json({ erreur: 'Email ou mot de passe incorrect' });
  }
  const token = jwt.sign({ id: admin.id, plateforme_admin: true }, JWT_SECRET, { expiresIn: '12h' });
  res.json({ token, admin: { id: admin.id, nom: admin.nom, email: admin.email } });
});

app.get('/api/plateforme/entreprises', authentifierPlateforme, async (req, res) => {
  const { rows } = await pool.query(`
    SELECT e.*, COUNT(u.id) as nb_utilisateurs
    FROM entreprises e
    LEFT JOIN utilisateurs u ON u.entreprise_id = e.id AND u.actif = TRUE
    GROUP BY e.id ORDER BY e.cree_le DESC
  `);
  res.json(rows);
});

app.post('/api/plateforme/entreprises', authentifierPlateforme, async (req, res) => {
  const { nom, admin_prenom, admin_nom, admin_email, admin_mot_de_passe } = req.body;

  const { rows: [entreprise] } = await pool.query(
    'INSERT INTO entreprises (nom) VALUES ($1) RETURNING id',
    [nom]
  );

  const { rows: [roleSuperAdmin] } = await pool.query(`SELECT id FROM roles WHERE nom = 'Super admin' LIMIT 1`);
  const hash = bcrypt.hashSync(admin_mot_de_passe, 10);
  await pool.query(
    `INSERT INTO utilisateurs (entreprise_id, role_id, prenom, nom, email, mot_de_passe_hash) VALUES ($1,$2,$3,$4,$5,$6)`,
    [entreprise.id, roleSuperAdmin.id, admin_prenom, admin_nom, admin_email, hash]
  );

  res.status(201).json({ id: entreprise.id });
});

app.patch('/api/plateforme/entreprises/:id', authentifierPlateforme, async (req, res) => {
  const { statut_abonnement } = req.body;
  if (!statut_abonnement) return res.status(400).json({ erreur: 'Rien à mettre à jour' });
  await pool.query('UPDATE entreprises SET statut_abonnement = $1 WHERE id = $2', [statut_abonnement, req.params.id]);
  res.json({ ok: true });
});

// Suppression DÉFINITIVE d'une entreprise et de toutes ses données. Action irréversible.
// Par sécurité, il faut renvoyer le nom exact de l'entreprise en confirmation.
app.delete('/api/plateforme/entreprises/:id', authentifierPlateforme, async (req, res) => {
  const { confirmation_nom } = req.body;
  const { rows: [entreprise] } = await pool.query('SELECT * FROM entreprises WHERE id = $1', [req.params.id]);
  if (!entreprise) return res.status(404).json({ erreur: 'Entreprise introuvable.' });
  if (confirmation_nom !== entreprise.nom) {
    return res.status(400).json({ erreur: "Le nom de confirmation ne correspond pas. Rien n'a été supprimé." });
  }

  const id = req.params.id;
  const { rows: utilisateurs } = await pool.query('SELECT id FROM utilisateurs WHERE entreprise_id = $1', [id]);
  const idsUtilisateurs = utilisateurs.map((u) => u.id);

  if (idsUtilisateurs.length > 0) {
    await pool.query('DELETE FROM messages WHERE expediteur_utilisateur_id = ANY($1::int[])', [idsUtilisateurs]);
  }
  await pool.query('DELETE FROM conversations WHERE entreprise_id = $1', [id]);
  await pool.query(
    `DELETE FROM creneaux WHERE mission_id IN (SELECT id FROM missions WHERE entreprise_id = $1)`, [id]
  );
  await pool.query(
    `DELETE FROM mission_reponses WHERE mission_id IN (SELECT id FROM missions WHERE entreprise_id = $1)`, [id]
  );
  await pool.query('DELETE FROM missions WHERE entreprise_id = $1', [id]);
  await pool.query('DELETE FROM absences WHERE entreprise_id = $1', [id]);
  await pool.query('DELETE FROM jours_exceptionnels WHERE entreprise_id = $1', [id]);
  if (idsUtilisateurs.length > 0) {
    await pool.query('DELETE FROM notifications WHERE utilisateur_id = ANY($1::int[])', [idsUtilisateurs]);
  }
  await pool.query('DELETE FROM utilisateurs WHERE entreprise_id = $1', [id]);
  await pool.query('DELETE FROM entreprises WHERE id = $1', [id]);

  res.json({ ok: true });
});

// ============ BACK-OFFICE : gestion des utilisateurs d'une entreprise cliente ============
app.get('/api/plateforme/entreprises/:id/utilisateurs', authentifierPlateforme, async (req, res) => {
  const { rows } = await pool.query(
    `SELECT u.id, u.prenom, u.nom, u.email, u.actif, u.role_id, r.nom as role
     FROM utilisateurs u JOIN roles r ON u.role_id = r.id
     WHERE u.entreprise_id = $1 ORDER BY u.prenom`,
    [req.params.id]
  );
  res.json(rows);
});

app.post('/api/plateforme/entreprises/:id/utilisateurs', authentifierPlateforme, async (req, res) => {
  const { prenom, nom, email, mot_de_passe, role_id } = req.body;
  const hash = bcrypt.hashSync(mot_de_passe, 10);
  const { rows: [user] } = await pool.query(
    `INSERT INTO utilisateurs (entreprise_id, role_id, prenom, nom, email, mot_de_passe_hash) VALUES ($1,$2,$3,$4,$5,$6) RETURNING id`,
    [req.params.id, role_id, prenom, nom, email, hash]
  );
  res.status(201).json({ id: user.id });
});

app.patch('/api/plateforme/entreprises/:id/utilisateurs/:userId', authentifierPlateforme, async (req, res) => {
  const { actif, role_id, nouveau_mot_de_passe } = req.body;
  const champs = [];
  const valeurs = [];
  let i = 1;
  if (actif !== undefined) { champs.push(`actif = $${i++}`); valeurs.push(actif); }
  if (role_id !== undefined) { champs.push(`role_id = $${i++}`); valeurs.push(role_id); }
  if (nouveau_mot_de_passe) { champs.push(`mot_de_passe_hash = $${i++}`); valeurs.push(bcrypt.hashSync(nouveau_mot_de_passe, 10)); }
  if (champs.length === 0) return res.status(400).json({ erreur: 'Rien à mettre à jour' });
  valeurs.push(req.params.userId, req.params.id);
  await pool.query(`UPDATE utilisateurs SET ${champs.join(', ')} WHERE id = $${i++} AND entreprise_id = $${i}`, valeurs);
  res.json({ ok: true });
});

app.delete('/api/plateforme/entreprises/:id/utilisateurs/:userId', authentifierPlateforme, async (req, res) => {
  try {
    await pool.query('DELETE FROM utilisateurs WHERE id = $1 AND entreprise_id = $2', [req.params.userId, req.params.id]);
    res.json({ ok: true, supprime: true });
  } catch (err) {
    if (err.code === '23503') {
      await pool.query('UPDATE utilisateurs SET actif = FALSE WHERE id = $1 AND entreprise_id = $2', [req.params.userId, req.params.id]);
      return res.json({ ok: true, supprime: false, desactive: true, message: 'Ce compte a un historique et a été désactivé au lieu d\'être supprimé.' });
    }
    throw err;
  }
});

app.get('/api/plateforme/roles', authentifierPlateforme, async (req, res) => {
  const { rows } = await pool.query('SELECT id, nom FROM roles ORDER BY id');
  res.json(rows);
});

app.post('/api/mon-mot-de-passe', authentifier, async (req, res) => {
  const { mot_de_passe_actuel, nouveau_mot_de_passe } = req.body;
  if (!nouveau_mot_de_passe || nouveau_mot_de_passe.length < 6) {
    return res.status(400).json({ erreur: 'Le nouveau mot de passe doit contenir au moins 6 caractères.' });
  }
  const { rows: [user] } = await pool.query('SELECT * FROM utilisateurs WHERE id = $1', [req.utilisateur.id]);
  if (!bcrypt.compareSync(mot_de_passe_actuel, user.mot_de_passe_hash)) {
    return res.status(401).json({ erreur: 'Mot de passe actuel incorrect.' });
  }
  const hash = bcrypt.hashSync(nouveau_mot_de_passe, 10);
  await pool.query('UPDATE utilisateurs SET mot_de_passe_hash = $1 WHERE id = $2', [hash, req.utilisateur.id]);
  res.json({ ok: true });
});

// ============ NOTIFICATIONS ============
app.get('/api/notifications', authentifier, async (req, res) => {
  const { rows } = await pool.query(
    'SELECT * FROM notifications WHERE utilisateur_id = $1 ORDER BY cree_le DESC LIMIT 50',
    [req.utilisateur.id]
  );
  res.json(rows);
});

app.patch('/api/notifications/:id', authentifier, async (req, res) => {
  await pool.query('UPDATE notifications SET lu = TRUE WHERE id = $1 AND utilisateur_id = $2', [req.params.id, req.utilisateur.id]);
  res.json({ ok: true });
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
