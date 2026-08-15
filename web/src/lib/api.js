const API_URL = 'https://krendo-production.up.railway.app/api';

function getToken() {
  return localStorage.getItem('krendo_token');
}

async function requete(chemin, options = {}) {
  const token = getToken();
  const res = await fetch(`${API_URL}${chemin}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options.headers,
    },
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(data.erreur || 'Une erreur est survenue');
  }
  return data;
}

export const api = {
  connexion: (email, mot_de_passe) =>
    requete('/connexion', { method: 'POST', body: JSON.stringify({ email, mot_de_passe }) }),
  motDePasseOublie: (email) => requete('/mot-de-passe-oublie', { method: 'POST', body: JSON.stringify({ email }) }),
  reinitialiserMotDePasse: (token, nouveau_mot_de_passe) =>
    requete('/reinitialiser-mot-de-passe', { method: 'POST', body: JSON.stringify({ token, nouveau_mot_de_passe }) }),

  missions: () => requete('/missions'),
  creerMission: (mission) => requete('/missions', { method: 'POST', body: JSON.stringify(mission) }),
  reponsesMission: (missionId) => requete(`/missions/${missionId}/reponses`),
  repondreMission: (missionId, statut, commentaire) =>
    requete(`/missions/${missionId}/repondre`, { method: 'POST', body: JSON.stringify({ statut, commentaire }) }),
  notifications: () => requete('/notifications'),
  marquerNotificationLue: (id) => requete(`/notifications/${id}`, { method: 'PATCH' }),
  changerMonMotDePasse: (mot_de_passe_actuel, nouveau_mot_de_passe) =>
    requete('/mon-mot-de-passe', { method: 'POST', body: JSON.stringify({ mot_de_passe_actuel, nouveau_mot_de_passe }) }),

  absences: () => requete('/absences'),
  creerAbsence: (absence) => requete('/absences', { method: 'POST', body: JSON.stringify(absence) }),
  traiterAbsence: (id, statut) => requete(`/absences/${id}`, { method: 'PATCH', body: JSON.stringify({ statut }) }),
  majAbsence: (id, champs) => requete(`/absences/${id}`, { method: 'PATCH', body: JSON.stringify(champs) }),
  supprimerAbsence: (id) => requete(`/absences/${id}`, { method: 'DELETE' }),

  utilisateurs: () => requete('/utilisateurs'),
  creerUtilisateur: (u) => requete('/utilisateurs', { method: 'POST', body: JSON.stringify(u) }),
  majUtilisateur: (id, champs) => requete(`/utilisateurs/${id}`, { method: 'PATCH', body: JSON.stringify(champs) }),
  supprimerUtilisateur: (id) => requete(`/utilisateurs/${id}`, { method: 'DELETE' }),
  roles: () => requete('/roles'),

  parametres: () => requete('/parametres'),
  majParametres: (champs) => requete('/parametres', { method: 'PATCH', body: JSON.stringify(champs) }),
  ajouterJourExceptionnel: (jour) => requete('/jours-exceptionnels', { method: 'POST', body: JSON.stringify(jour) }),
  supprimerJourExceptionnel: (id) => requete(`/jours-exceptionnels/${id}`, { method: 'DELETE' }),

  creneauxMission: (missionId) => requete(`/missions/${missionId}/creneaux`),
  tousLesCreneaux: () => requete('/creneaux'),
  exporterHeuresCsv: async () => {
    const token = getToken();
    const res = await fetch(`${API_URL}/creneaux/export-csv`, {
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    });
    if (!res.ok) throw new Error("Impossible d'exporter les heures.");
    const blob = await res.blob();
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `heures_${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  },
  definirCreneau: (missionId, utilisateurId, creneau) =>
    requete(`/missions/${missionId}/creneaux/${utilisateurId}`, { method: 'PUT', body: JSON.stringify(creneau) }),
  majMission: (missionId, champs) => requete(`/missions/${missionId}`, { method: 'PATCH', body: JSON.stringify(champs) }),
  supprimerMission: (missionId) => requete(`/missions/${missionId}`, { method: 'DELETE' }),
  supprimerCreneau: (id) => requete(`/creneaux/${id}`, { method: 'DELETE' }),
  validerCreneau: (id, statut_validation) => requete(`/creneaux/${id}/statut`, { method: 'PATCH', body: JSON.stringify({ statut_validation }) }),

  conversations: () => requete('/conversations'),
  ouvrirConversation: (utilisateur_id, mission_id) =>
    requete('/conversations', { method: 'POST', body: JSON.stringify({ utilisateur_id, mission_id }) }),
  messages: (conversationId) => requete(`/conversations/${conversationId}/messages`),
  envoyerMessage: (conversationId, contenu, piece_jointe) =>
    requete(`/conversations/${conversationId}/messages`, { method: 'POST', body: JSON.stringify({ contenu, piece_jointe }) }),
};

export function sauvegarderSession(token, utilisateur) {
  localStorage.setItem('krendo_token', token);
  localStorage.setItem('krendo_utilisateur', JSON.stringify(utilisateur));
}

export function chargerSession() {
  const token = getToken();
  const utilisateur = localStorage.getItem('krendo_utilisateur');
  if (!token || !utilisateur) return null;
  return { token, utilisateur: JSON.parse(utilisateur) };
}

export function effacerSession() {
  localStorage.removeItem('krendo_token');
  localStorage.removeItem('krendo_utilisateur');
}

// ============ BACK-OFFICE (gestion multi-clients, session séparée) ============
function getTokenPlateforme() {
  return localStorage.getItem('krendo_plateforme_token');
}

async function requetePlateforme(chemin, options = {}) {
  const token = getTokenPlateforme();
  const res = await fetch(`${API_URL}${chemin}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options.headers,
    },
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.erreur || 'Une erreur est survenue');
  return data;
}

export const apiPlateforme = {
  connexion: (email, mot_de_passe) =>
    requetePlateforme('/plateforme/connexion', { method: 'POST', body: JSON.stringify({ email, mot_de_passe }) }),
  entreprises: () => requetePlateforme('/plateforme/entreprises'),
  creerEntreprise: (donnees) => requetePlateforme('/plateforme/entreprises', { method: 'POST', body: JSON.stringify(donnees) }),
  majEntreprise: (id, champs) => requetePlateforme(`/plateforme/entreprises/${id}`, { method: 'PATCH', body: JSON.stringify(champs) }),
  supprimerEntreprise: (id, confirmation_nom) =>
    requetePlateforme(`/plateforme/entreprises/${id}`, { method: 'DELETE', body: JSON.stringify({ confirmation_nom }) }),

  utilisateursEntreprise: (id) => requetePlateforme(`/plateforme/entreprises/${id}/utilisateurs`),
  creerUtilisateurEntreprise: (id, donnees) =>
    requetePlateforme(`/plateforme/entreprises/${id}/utilisateurs`, { method: 'POST', body: JSON.stringify(donnees) }),
  majUtilisateurEntreprise: (id, userId, champs) =>
    requetePlateforme(`/plateforme/entreprises/${id}/utilisateurs/${userId}`, { method: 'PATCH', body: JSON.stringify(champs) }),
  supprimerUtilisateurEntreprise: (id, userId) =>
    requetePlateforme(`/plateforme/entreprises/${id}/utilisateurs/${userId}`, { method: 'DELETE' }),
  roles: () => requetePlateforme('/plateforme/roles'),
};

export function sauvegarderSessionPlateforme(token, admin) {
  localStorage.setItem('krendo_plateforme_token', token);
  localStorage.setItem('krendo_plateforme_admin', JSON.stringify(admin));
}

export function chargerSessionPlateforme() {
  const token = getTokenPlateforme();
  const admin = localStorage.getItem('krendo_plateforme_admin');
  if (!token || !admin) return null;
  return { token, admin: JSON.parse(admin) };
}

export function effacerSessionPlateforme() {
  localStorage.removeItem('krendo_plateforme_token');
  localStorage.removeItem('krendo_plateforme_admin');
}
