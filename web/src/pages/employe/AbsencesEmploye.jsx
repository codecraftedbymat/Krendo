import { useEffect, useState } from 'react';
import { api } from '../../lib/api';

export default function AbsencesEmploye({ utilisateur }) {
  const [absences, setAbsences] = useState([]);
  const [chargement, setChargement] = useState(true);
  const [formulaireOuvert, setFormulaireOuvert] = useState(false);

  useEffect(() => { charger(); }, []);

  async function charger() {
    setChargement(true);
    try {
      const toutes = await api.absences();
      setAbsences(toutes.filter((a) => a.utilisateur_id === utilisateur.id));
    } finally {
      setChargement(false);
    }
  }

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
        <div>
          <h1 style={styles.titre}>Mes absences</h1>
          <p style={styles.sousTitre}>Vos demandes d'absence et leur statut.</p>
        </div>
      </div>
      <button style={styles.boutonPrincipal} onClick={() => setFormulaireOuvert(true)}>+ Nouvelle demande</button>

      {chargement ? (
        <p style={styles.texteAttente}>Chargement...</p>
      ) : absences.length === 0 ? (
        <p style={{ ...styles.texteAttente, marginTop: 16 }}>Aucune demande pour l'instant.</p>
      ) : (
        <div style={{ ...styles.liste, marginTop: 16 }}>
          {absences.map((a) => (
            <div key={a.id} style={styles.ligne}>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 13.5, fontWeight: 600 }}>
                  Du {formatDate(a.date_debut)} au {formatDate(a.date_fin)}
                </div>
                {a.motif && <div style={{ fontSize: 12.5, color: 'var(--text-secondary)', marginTop: 2 }}>{a.motif}</div>}
              </div>
              <StatutBadge statut={a.statut} />
            </div>
          ))}
        </div>
      )}

      {formulaireOuvert && (
        <FormulaireDemande
          onFermer={() => setFormulaireOuvert(false)}
          onCree={() => { setFormulaireOuvert(false); charger(); }}
        />
      )}
    </div>
  );
}

function StatutBadge({ statut }) {
  const config = {
    en_attente: { texte: 'En attente', fond: 'var(--amber-soft)', couleur: 'var(--amber)' },
    acceptee: { texte: 'Acceptée', fond: 'var(--emerald-soft)', couleur: 'var(--emerald)' },
    refusee: { texte: 'Refusée', fond: 'var(--red-soft)', couleur: 'var(--red)' },
  }[statut];
  return <span style={{ ...styles.badge, background: config.fond, color: config.couleur }}>{config.texte}</span>;
}

function FormulaireDemande({ onFermer, onCree }) {
  const [champ, setChamp] = useState({ date_debut: '', heure_debut: '00:00', date_fin: '', heure_fin: '23:59', motif: '' });
  const [erreur, setErreur] = useState('');
  const [envoi, setEnvoi] = useState(false);

  function set(nom, valeur) { setChamp((c) => ({ ...c, [nom]: valeur })); }

  async function handleSubmit(e) {
    e.preventDefault();
    setErreur('');
    setEnvoi(true);
    try {
      await api.creerAbsence(champ);
      onCree();
    } catch (err) {
      setErreur(err.message);
    } finally {
      setEnvoi(false);
    }
  }

  return (
    <div style={styles.overlay} onClick={onFermer}>
      <form style={styles.panneau} onClick={(e) => e.stopPropagation()} onSubmit={handleSubmit}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <h2 style={{ fontSize: 19, margin: 0 }}>Nouvelle demande</h2>
          <button type="button" style={styles.fermer} onClick={onFermer}>✕</button>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginTop: 18 }}>
          <label style={styles.champLabel}>
            <span style={styles.champTexte}>Début</span>
            <input required type="date" style={styles.input} value={champ.date_debut} onChange={(e) => set('date_debut', e.target.value)} />
          </label>
          <label style={styles.champLabel}>
            <span style={styles.champTexte}>Heure</span>
            <input required type="time" style={styles.input} value={champ.heure_debut} onChange={(e) => set('heure_debut', e.target.value)} />
          </label>
          <label style={styles.champLabel}>
            <span style={styles.champTexte}>Fin</span>
            <input required type="date" style={styles.input} value={champ.date_fin} onChange={(e) => set('date_fin', e.target.value)} />
          </label>
          <label style={styles.champLabel}>
            <span style={styles.champTexte}>Heure</span>
            <input required type="time" style={styles.input} value={champ.heure_fin} onChange={(e) => set('heure_fin', e.target.value)} />
          </label>
        </div>

        <label style={{ ...styles.champLabel, marginTop: 12 }}>
          <span style={styles.champTexte}>Motif</span>
          <input style={styles.input} value={champ.motif} onChange={(e) => set('motif', e.target.value)} placeholder="Congés payés, rendez-vous médical..." />
        </label>

        {erreur && <div style={styles.erreurForm}>{erreur}</div>}

        <button type="submit" disabled={envoi} style={styles.boutonEnvoyer}>
          {envoi ? 'Envoi...' : 'Envoyer la demande'}
        </button>
      </form>
    </div>
  );
}

function formatDate(iso) {
  const d = new Date(iso + 'T00:00:00');
  return d.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' });
}

const styles = {
  titre: { fontSize: 22, fontFamily: 'var(--font-display)', fontWeight: 800 },
  sousTitre: { color: 'var(--text-secondary)', fontSize: 13.5, margin: '6px 0 0' },
  boutonPrincipal: {
    width: '100%', background: 'var(--ink)', color: 'white', border: 'none', borderRadius: 'var(--radius-sm)',
    padding: '12px', fontWeight: 700, fontSize: 13.5, marginTop: 14,
  },
  texteAttente: { color: 'var(--text-secondary)', fontSize: 13.5 },
  liste: { display: 'flex', flexDirection: 'column', gap: 8 },
  ligne: {
    display: 'flex', alignItems: 'center', gap: 10, background: 'var(--card)',
    border: '1px solid var(--border)', borderRadius: 'var(--radius-md)', padding: '12px 14px',
  },
  badge: { fontSize: 11, fontWeight: 700, padding: '4px 9px', borderRadius: 6, whiteSpace: 'nowrap' },
  overlay: { position: 'fixed', inset: 0, background: 'rgba(28,37,54,0.45)', display: 'flex', alignItems: 'flex-end', zIndex: 50 },
  panneau: { width: '100%', background: 'var(--card)', borderRadius: '20px 20px 0 0', padding: 24, maxHeight: '85vh', overflowY: 'auto' },
  fermer: { background: 'var(--canvas)', border: 'none', borderRadius: 8, width: 30, height: 30, fontSize: 14 },
  champLabel: { display: 'flex', flexDirection: 'column', gap: 5 },
  champTexte: { fontSize: 12, fontWeight: 600, color: 'var(--text-secondary)' },
  input: {
    padding: '10px 12px', borderRadius: 'var(--radius-sm)', border: '1.5px solid var(--border)',
    fontSize: 13.5, outline: 'none', width: '100%', boxSizing: 'border-box',
  },
  boutonEnvoyer: {
    width: '100%', background: 'var(--emerald)', color: 'white', border: 'none', borderRadius: 'var(--radius-sm)',
    padding: '13px', fontWeight: 700, fontSize: 14, marginTop: 16,
  },
  erreurForm: { background: 'var(--red-soft)', color: 'var(--red)', padding: '10px 12px', borderRadius: 'var(--radius-sm)', fontSize: 13, marginTop: 12 },
};
