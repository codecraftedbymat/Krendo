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

  missions: () => requete('/missions'),
  creerMission: (mission) => requete('/missions', { method: 'POST', body: JSON.stringify(mission) }),
  reponsesMission: (missionId) => requete(`/missions/${missionId}/reponses`),

  absences: () => requete('/absences'),
  creerAbsence: (absence) => requete('/absences', { method: 'POST', body: JSON.stringify(absence) }),
  traiterAbsence: (id, statut) => requete(`/absences/${id}`, { method: 'PATCH', body: JSON.stringify({ statut }) }),

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
