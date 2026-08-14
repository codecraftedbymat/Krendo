import { useEffect, useState } from 'react';
import { api } from '../lib/api';

export default function Equipe() {
  const [utilisateurs, setUtilisateurs] = useState([]);
  const [chargement, setChargement] = useState(true);

  useEffect(() => {
    api.utilisateurs().then(setUtilisateurs).finally(() => setChargement(false));
  }, []);

  return (
    <div>
      <h1 style={styles.titre}>Équipe</h1>
      <p style={styles.sousTitre}>Les comptes de votre entreprise. Seul un admin peut en créer.</p>

      {chargement ? (
        <p style={styles.texteAttente}>Chargement...</p>
      ) : (
        <div style={styles.liste}>
          {utilisateurs.map((u) => (
            <div key={u.id} style={styles.ligne}>
              <div style={styles.avatarPetit}>{u.prenom[0]}{u.nom[0]}</div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 13.5, fontWeight: 600 }}>{u.prenom} {u.nom}</div>
                <div style={{ fontSize: 12.5, color: 'var(--text-secondary)' }}>{u.email}</div>
              </div>
              <span style={styles.badgeRole}>{u.role}</span>
              {!u.actif && <span style={styles.badgeInactif}>Désactivé</span>}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

const styles = {
  titre: { fontSize: 26 },
  sousTitre: { color: 'var(--text-secondary)', fontSize: 14, margin: '6px 0 28px' },
  texteAttente: { color: 'var(--text-secondary)', fontSize: 14 },
  liste: { display: 'flex', flexDirection: 'column', gap: 8 },
  ligne: {
    display: 'flex', alignItems: 'center', gap: 12,
    background: 'var(--card)', border: '1px solid var(--border)',
    borderRadius: 'var(--radius-md)', padding: '12px 14px',
  },
  avatarPetit: {
    width: 32, height: 32, borderRadius: '50%', background: 'var(--emerald-soft)', color: 'var(--emerald)',
    display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 700, flexShrink: 0,
  },
  badgeRole: {
    fontSize: 11.5, fontWeight: 700, padding: '4px 10px', borderRadius: 6,
    background: 'var(--canvas)', color: 'var(--text-secondary)', whiteSpace: 'nowrap',
  },
  badgeInactif: {
    fontSize: 11.5, fontWeight: 700, padding: '4px 10px', borderRadius: 6,
    background: 'var(--red-soft)', color: 'var(--red)', whiteSpace: 'nowrap', marginLeft: 6,
  },
};
