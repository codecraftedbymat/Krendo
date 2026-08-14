import { useEffect, useState } from 'react';
import { api } from '../lib/api';

export default function Absences() {
  const [absences, setAbsences] = useState([]);
  const [chargement, setChargement] = useState(true);

  useEffect(() => { charger(); }, []);

  async function charger() {
    setChargement(true);
    try {
      setAbsences(await api.absences());
    } finally {
      setChargement(false);
    }
  }

  async function traiter(id, statut) {
    await api.traiterAbsence(id, statut);
    charger();
  }

  const enAttente = absences.filter((a) => a.statut === 'en_attente');
  const traitees = absences.filter((a) => a.statut !== 'en_attente');

  return (
    <div>
      <h1 style={styles.titre}>Absences</h1>
      <p style={styles.sousTitre}>Validez les demandes d'absence de votre équipe.</p>

      {chargement ? (
        <p style={styles.texteAttente}>Chargement...</p>
      ) : (
        <>
          {enAttente.length > 0 && (
            <>
              <p style={styles.sectionLabel}>En attente ({enAttente.length})</p>
              <div style={styles.liste}>
                {enAttente.map((a) => (
                  <div key={a.id} style={styles.ligne}>
                    <div style={styles.avatarPetit}>{a.prenom[0]}{a.nom[0]}</div>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: 13.5, fontWeight: 600 }}>{a.prenom} {a.nom}</div>
                      <div style={{ fontSize: 12.5, color: 'var(--text-secondary)' }}>
                        Du {formatDateHeure(a.date_debut, a.heure_debut)} au {formatDateHeure(a.date_fin, a.heure_fin)}
                        {a.motif ? ` · ${a.motif}` : ''}
                      </div>
                    </div>
                    <div style={{ display: 'flex', gap: 6 }}>
                      <button style={styles.boutonAccepter} onClick={() => traiter(a.id, 'acceptee')}>Accepter</button>
                      <button style={styles.boutonRefuser} onClick={() => traiter(a.id, 'refusee')}>Refuser</button>
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}

          <p style={{ ...styles.sectionLabel, marginTop: enAttente.length ? 28 : 0 }}>Historique</p>
          {traitees.length === 0 ? (
            <p style={styles.texteAttente}>Aucune absence traitée pour l'instant.</p>
          ) : (
            <div style={styles.liste}>
              {traitees.map((a) => (
                <div key={a.id} style={styles.ligne}>
                  <div style={styles.avatarPetit}>{a.prenom[0]}{a.nom[0]}</div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 13.5, fontWeight: 600 }}>{a.prenom} {a.nom}</div>
                    <div style={{ fontSize: 12.5, color: 'var(--text-secondary)' }}>
                      Du {formatDateHeure(a.date_debut, a.heure_debut)} au {formatDateHeure(a.date_fin, a.heure_fin)}
                    </div>
                  </div>
                  <span style={{
                    ...styles.badge,
                    background: a.statut === 'acceptee' ? 'var(--emerald-soft)' : 'var(--red-soft)',
                    color: a.statut === 'acceptee' ? 'var(--emerald)' : 'var(--red)',
                  }}>
                    {a.statut === 'acceptee' ? 'Acceptée' : 'Refusée'}
                  </span>
                </div>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}

function formatDateHeure(date, heure) {
  const d = new Date(date + 'T00:00:00');
  return `${d.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })} ${heure}`;
}

const styles = {
  titre: { fontSize: 26 },
  sousTitre: { color: 'var(--text-secondary)', fontSize: 14, margin: '6px 0 28px' },
  sectionLabel: { fontSize: 12.5, fontWeight: 700, color: 'var(--text-secondary)', marginBottom: 10 },
  texteAttente: { color: 'var(--text-secondary)', fontSize: 14 },
  liste: { display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 8 },
  ligne: {
    display: 'flex', alignItems: 'center', gap: 12,
    background: 'var(--card)', border: '1px solid var(--border)',
    borderRadius: 'var(--radius-md)', padding: '12px 14px',
  },
  avatarPetit: {
    width: 32, height: 32, borderRadius: '50%', background: 'var(--emerald-soft)', color: 'var(--emerald)',
    display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 700, flexShrink: 0,
  },
  boutonAccepter: {
    background: 'var(--emerald)', color: 'white', border: 'none', borderRadius: 7,
    padding: '7px 12px', fontSize: 12.5, fontWeight: 700,
  },
  boutonRefuser: {
    background: 'var(--canvas)', color: 'var(--text-secondary)', border: 'none', borderRadius: 7,
    padding: '7px 12px', fontSize: 12.5, fontWeight: 700,
  },
  badge: { fontSize: 11.5, fontWeight: 700, padding: '4px 10px', borderRadius: 6, whiteSpace: 'nowrap' },
};
