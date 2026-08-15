-- ============================================================
-- SCHEMA DE BASE DE DONNEES - Application de gestion de planning
-- Version PostgreSQL (production)
-- Architecture multi-tenant : chaque table métier est rattachée
-- à une entreprise_id pour isoler les données de chaque client.
-- ============================================================

CREATE TABLE IF NOT EXISTS entreprises (
  id SERIAL PRIMARY KEY,
  nom TEXT NOT NULL,
  statut_abonnement TEXT NOT NULL DEFAULT 'essai' CHECK(statut_abonnement IN ('essai','actif','suspendu','resilie')),
  jours_travailles TEXT NOT NULL DEFAULT '1,2,3,4,5',
  travaille_jours_feries BOOLEAN NOT NULL DEFAULT FALSE,
  compte_gratuit BOOLEAN NOT NULL DEFAULT FALSE,
  note_interne TEXT,
  cree_le TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

ALTER TABLE entreprises ADD COLUMN IF NOT EXISTS jours_travailles TEXT NOT NULL DEFAULT '1,2,3,4,5';
ALTER TABLE entreprises ADD COLUMN IF NOT EXISTS travaille_jours_feries BOOLEAN NOT NULL DEFAULT FALSE;
ALTER TABLE entreprises ADD COLUMN IF NOT EXISTS compte_gratuit BOOLEAN NOT NULL DEFAULT FALSE;
ALTER TABLE entreprises ADD COLUMN IF NOT EXISTS note_interne TEXT;
ALTER TABLE entreprises ADD COLUMN IF NOT EXISTS stripe_customer_id TEXT;
ALTER TABLE entreprises ADD COLUMN IF NOT EXISTS stripe_subscription_id TEXT;
ALTER TABLE entreprises ADD COLUMN IF NOT EXISTS date_fin_abonnement DATE;

CREATE TABLE IF NOT EXISTS jours_exceptionnels (
  id SERIAL PRIMARY KEY,
  entreprise_id INTEGER NOT NULL REFERENCES entreprises(id),
  date TEXT NOT NULL,
  statut TEXT NOT NULL CHECK(statut IN ('ferme','ouvert')),
  motif TEXT,
  UNIQUE(entreprise_id, date)
);

CREATE TABLE IF NOT EXISTS roles (
  id SERIAL PRIMARY KEY,
  nom TEXT NOT NULL,
  peut_gerer_comptes BOOLEAN DEFAULT FALSE,
  peut_creer_missions BOOLEAN DEFAULT FALSE,
  peut_valider_absences BOOLEAN DEFAULT FALSE,
  peut_valider_heures BOOLEAN DEFAULT FALSE,
  peut_modifier_creneaux BOOLEAN DEFAULT FALSE,
  peut_voir_tout BOOLEAN DEFAULT FALSE
);

CREATE TABLE IF NOT EXISTS utilisateurs (
  id SERIAL PRIMARY KEY,
  entreprise_id INTEGER NOT NULL REFERENCES entreprises(id),
  role_id INTEGER NOT NULL REFERENCES roles(id),
  prenom TEXT NOT NULL,
  nom TEXT NOT NULL,
  email TEXT NOT NULL UNIQUE,
  telephone TEXT,
  mot_de_passe_hash TEXT NOT NULL,
  actif BOOLEAN DEFAULT TRUE,
  cree_par_utilisateur_id INTEGER,
  cree_le TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS missions (
  id SERIAL PRIMARY KEY,
  entreprise_id INTEGER NOT NULL REFERENCES entreprises(id),
  titre TEXT NOT NULL,
  lieu TEXT,
  date_debut TEXT NOT NULL,
  heure_debut TEXT NOT NULL,
  date_fin TEXT NOT NULL,
  heure_fin TEXT NOT NULL,
  nb_employes_requis INTEGER NOT NULL,
  description TEXT,
  planning_visible_tous BOOLEAN NOT NULL DEFAULT FALSE,
  cree_par_utilisateur_id INTEGER NOT NULL REFERENCES utilisateurs(id),
  cree_le TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

ALTER TABLE missions ADD COLUMN IF NOT EXISTS planning_visible_tous BOOLEAN NOT NULL DEFAULT FALSE;

CREATE TABLE IF NOT EXISTS mission_reponses (
  id SERIAL PRIMARY KEY,
  mission_id INTEGER NOT NULL REFERENCES missions(id),
  utilisateur_id INTEGER NOT NULL REFERENCES utilisateurs(id),
  statut TEXT NOT NULL DEFAULT 'en_attente' CHECK(statut IN ('en_attente','disponible','indisponible')),
  commentaire TEXT,
  repondu_le TIMESTAMP,
  UNIQUE(mission_id, utilisateur_id)
);

CREATE TABLE IF NOT EXISTS creneaux (
  id SERIAL PRIMARY KEY,
  mission_id INTEGER NOT NULL REFERENCES missions(id),
  utilisateur_id INTEGER NOT NULL REFERENCES utilisateurs(id),
  heure_debut TEXT NOT NULL,
  heure_fin TEXT NOT NULL,
  poste TEXT,
  est_heure_supplementaire BOOLEAN DEFAULT FALSE,
  motif TEXT,
  statut_validation TEXT NOT NULL DEFAULT 'en_attente' CHECK(statut_validation IN ('en_attente','valide','annule')),
  modifie_par_utilisateur_id INTEGER
);

ALTER TABLE creneaux ADD COLUMN IF NOT EXISTS poste TEXT;

CREATE TABLE IF NOT EXISTS absences (
  id SERIAL PRIMARY KEY,
  entreprise_id INTEGER NOT NULL REFERENCES entreprises(id),
  utilisateur_id INTEGER NOT NULL REFERENCES utilisateurs(id),
  date_debut TEXT NOT NULL,
  heure_debut TEXT NOT NULL,
  date_fin TEXT NOT NULL,
  heure_fin TEXT NOT NULL,
  motif TEXT,
  statut TEXT NOT NULL DEFAULT 'en_attente' CHECK(statut IN ('en_attente','acceptee','refusee')),
  traite_par_utilisateur_id INTEGER,
  cree_le TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS conversations (
  id SERIAL PRIMARY KEY,
  entreprise_id INTEGER NOT NULL REFERENCES entreprises(id),
  mission_id INTEGER REFERENCES missions(id),
  utilisateur_a_id INTEGER NOT NULL,
  utilisateur_b_id INTEGER NOT NULL,
  cree_le TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS messages (
  id SERIAL PRIMARY KEY,
  conversation_id INTEGER NOT NULL REFERENCES conversations(id),
  expediteur_utilisateur_id INTEGER NOT NULL,
  contenu TEXT,
  piece_jointe_nom TEXT,
  piece_jointe_type TEXT,
  piece_jointe_data TEXT,
  envoye_le TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  lu BOOLEAN DEFAULT FALSE
);

ALTER TABLE messages ADD COLUMN IF NOT EXISTS piece_jointe_nom TEXT;
ALTER TABLE messages ADD COLUMN IF NOT EXISTS piece_jointe_type TEXT;
ALTER TABLE messages ADD COLUMN IF NOT EXISTS piece_jointe_data TEXT;
ALTER TABLE messages ALTER COLUMN contenu DROP NOT NULL;

CREATE TABLE IF NOT EXISTS notifications (
  id SERIAL PRIMARY KEY,
  utilisateur_id INTEGER NOT NULL REFERENCES utilisateurs(id),
  type TEXT NOT NULL,
  titre TEXT NOT NULL,
  contenu TEXT,
  lien_id INTEGER,
  lu BOOLEAN DEFAULT FALSE,
  email_envoye BOOLEAN DEFAULT FALSE,
  cree_le TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS reinitialisations_mot_de_passe (
  id SERIAL PRIMARY KEY,
  utilisateur_id INTEGER NOT NULL REFERENCES utilisateurs(id),
  token_hash TEXT NOT NULL,
  expire_le TIMESTAMP NOT NULL,
  utilise BOOLEAN NOT NULL DEFAULT FALSE,
  cree_le TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS plateforme_admins (
  id SERIAL PRIMARY KEY,
  email TEXT NOT NULL UNIQUE,
  mot_de_passe_hash TEXT NOT NULL,
  nom TEXT NOT NULL,
  cree_le TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
