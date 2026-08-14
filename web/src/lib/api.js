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
