-- ============================================================
-- SCHEMA DE BASE DE DONNEES - Application de gestion de planning
-- Architecture multi-tenant : chaque table métier est rattachée
-- à une entreprise_id pour isoler les données de chaque client.
-- ============================================================

-- Une entreprise cliente (ex: "Evenementiel Plus", "Acme Corp")
CREATE TABLE entreprises (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  nom TEXT NOT NULL,
  cree_le TEXT DEFAULT CURRENT_TIMESTAMP
);

-- Les rôles possibles (super_admin, admin_planning, admin_rh, employe)
-- On stocke les droits sous forme de "permissions" pour être flexible
CREATE TABLE roles (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  nom TEXT NOT NULL,               -- ex: "Super admin", "Admin planning"
  peut_gerer_comptes INTEGER DEFAULT 0,     -- créer/supprimer des utilisateurs
  peut_creer_missions INTEGER DEFAULT 0,
  peut_valider_absences INTEGER DEFAULT 0,
  peut_valider_heures INTEGER DEFAULT 0,
  peut_modifier_creneaux INTEGER DEFAULT 0,
  peut_voir_tout INTEGER DEFAULT 0          -- accès total (super admin)
);

-- Tous les comptes qui peuvent se connecter (admins ET employés)
-- IMPORTANT : un compte ne peut être créé QUE par un admin (jamais d'auto-inscription)
CREATE TABLE utilisateurs (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  entreprise_id INTEGER NOT NULL,
  role_id INTEGER NOT NULL,
  prenom TEXT NOT NULL,
  nom TEXT NOT NULL,
  email TEXT NOT NULL UNIQUE,
  telephone TEXT,
  mot_de_passe_hash TEXT NOT NULL,
  actif INTEGER DEFAULT 1,          -- permet de désactiver un compte sans le supprimer
  cree_par_utilisateur_id INTEGER,  -- traçabilité: quel admin a créé ce compte
  cree_le TEXT DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (entreprise_id) REFERENCES entreprises(id),
  FOREIGN KEY (role_id) REFERENCES roles(id)
);

-- Une mission (ex: "Salon Tech Expo", le 18 août)
CREATE TABLE missions (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  entreprise_id INTEGER NOT NULL,
  titre TEXT NOT NULL,
  lieu TEXT,
  date_debut TEXT NOT NULL,
  heure_debut TEXT NOT NULL,
  date_fin TEXT NOT NULL,
  heure_fin TEXT NOT NULL,
  nb_employes_requis INTEGER NOT NULL,
  description TEXT,
  cree_par_utilisateur_id INTEGER NOT NULL,
  cree_le TEXT DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (entreprise_id) REFERENCES entreprises(id),
  FOREIGN KEY (cree_par_utilisateur_id) REFERENCES utilisateurs(id)
);

-- La réponse de chaque employé à une mission (disponible / indisponible / en attente)
CREATE TABLE mission_reponses (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  mission_id INTEGER NOT NULL,
  utilisateur_id INTEGER NOT NULL,
  statut TEXT NOT NULL DEFAULT 'en_attente' CHECK(statut IN ('en_attente','disponible','indisponible')),
  commentaire TEXT,               -- motif si indisponible
  repondu_le TEXT,
  FOREIGN KEY (mission_id) REFERENCES missions(id),
  FOREIGN KEY (utilisateur_id) REFERENCES utilisateurs(id),
  UNIQUE(mission_id, utilisateur_id)
);

-- Le créneau horaire réel confirmé pour un employé sur une mission
-- (peut être différent du créneau standard de la mission)
CREATE TABLE creneaux (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  mission_id INTEGER NOT NULL,
  utilisateur_id INTEGER NOT NULL,
  heure_debut TEXT NOT NULL,
  heure_fin TEXT NOT NULL,
  est_heure_supplementaire INTEGER DEFAULT 0,
  motif TEXT,
  statut_validation TEXT NOT NULL DEFAULT 'en_attente' CHECK(statut_validation IN ('en_attente','valide','annule')),
  modifie_par_utilisateur_id INTEGER,
  FOREIGN KEY (mission_id) REFERENCES missions(id),
  FOREIGN KEY (utilisateur_id) REFERENCES utilisateurs(id)
);

-- Demande d'absence / congé
CREATE TABLE absences (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  entreprise_id INTEGER NOT NULL,
  utilisateur_id INTEGER NOT NULL,
  date_debut TEXT NOT NULL,
  heure_debut TEXT NOT NULL,
  date_fin TEXT NOT NULL,
  heure_fin TEXT NOT NULL,
  motif TEXT,
  statut TEXT NOT NULL DEFAULT 'en_attente' CHECK(statut IN ('en_attente','acceptee','refusee')),
  traite_par_utilisateur_id INTEGER,
  cree_le TEXT DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (entreprise_id) REFERENCES entreprises(id),
  FOREIGN KEY (utilisateur_id) REFERENCES utilisateurs(id)
);

-- Conversations de chat (peut être liée à une mission ou libre)
CREATE TABLE conversations (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  entreprise_id INTEGER NOT NULL,
  mission_id INTEGER,              -- NULL si conversation libre
  utilisateur_a_id INTEGER NOT NULL,
  utilisateur_b_id INTEGER NOT NULL,
  cree_le TEXT DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (entreprise_id) REFERENCES entreprises(id),
  FOREIGN KEY (mission_id) REFERENCES missions(id)
);

CREATE TABLE messages (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  conversation_id INTEGER NOT NULL,
  expediteur_utilisateur_id INTEGER NOT NULL,
  contenu TEXT NOT NULL,
  envoye_le TEXT DEFAULT CURRENT_TIMESTAMP,
  lu INTEGER DEFAULT 0,
  FOREIGN KEY (conversation_id) REFERENCES conversations(id)
);

-- Notifications (in-app + déclenche l'envoi d'un email)
CREATE TABLE notifications (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  utilisateur_id INTEGER NOT NULL,
  type TEXT NOT NULL,              -- 'nouveau_message', 'rappel_mission', 'absence_traitee', ...
  titre TEXT NOT NULL,
  contenu TEXT,
  lien_id INTEGER,                 -- id de la mission/absence/conversation concernée
  lu INTEGER DEFAULT 0,
  email_envoye INTEGER DEFAULT 0,
  cree_le TEXT DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (utilisateur_id) REFERENCES utilisateurs(id)
);
