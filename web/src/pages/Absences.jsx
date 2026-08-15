import { useEffect, useState } from 'react';
import { api } from '../lib/api';

export default function Absences({ utilisateur }) {
  const [absences, setAbsences] = useState([]);
  const [chargement, setChargement] = useState(true);
  const [formulaireOuvert, setFormulaireOuvert] = useState(false);

  const peutGererPourAutrui = utilisateur.permissions.peut_valider_absences || utilisateur.permissions.peut_voir_tout;

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
      <div style={styles.entete}>
        <div>
          <h1 style={styles.titre}>Absences</h1>
          <p style={styles.sousTitre}>Validez les demandes d'absence de votre équipe.</p>
        </div>
        {peutGererPourAutrui && (
          <button style={styles.boutonPrincipal} onClick={() => setFormulaireOuvert(true)}>
            + Mettre en congé
          </button>
        )}
      </div>

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
                      {a.motif ? ` · ${a.motif}` : ''}
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

      {formulaireOuvert && (
        <FormulaireConge
          onFermer={() => setFormulaireOuvert(false)}
          onCree={() => { setFormulaireOuvert(false); charger(); }}
        />
      )}
    </div>
  );
}

function FormulaireConge({ onFermer, onCree }) {
  const [employes, setEmployes] = useState([]);
  const [chargementEmployes, setChargementEmployes] = useState(true);
  const [champ, setChamp] = useState({
    utilisateur_id: '', date_debut: '', heure_debut: '00:00',
    date_fin: '', heure_fin: '23:59', motif: '',
  });
  const [erreur, setErreur] = useState('');
  const [envoi, setEnvoi] = useState(false);

  useEffect(() => {
    api.utilisateurs().then((data) => setEmployes(data.filter((u) => u.actif))).finally(() => setChargementEmployes(false));
  }, []);

  function set(nomChamp, valeur) {
    setChamp((c) => ({ ...c, [nomChamp]: valeur }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setErreur('');
    setEnvoi(true);
    try {
      await api.creerAbsence({ ...champ, utilisateur_id: Number(champ.utilisateur_id) });
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
        <div style={styles.panneauEntete}>
          <h2 style={styles.panneauTitre}>Mettre un employé en congé</h2>
          <button type="button" style={styles.fermer} onClick={onFermer}>✕</button>
        </div>
        <p style={styles.panneauNote}>
          Cette absence sera directement enregistrée comme acceptée, sans passer par une demande.
        </p>

        <label style={styles.champLabel}>
          <span style={styles.champTexte}>Employé</span>
          {chargementEmployes ? (
            <p style={styles.texteAttente}>Chargement...</p>
          ) : (
            <select required style={styles.input} value={champ.utilisateur_id} onChange={(e) => set('utilisateur_id', e.target.value)}>
              <option value="">Choisir un employé</option>
              {employes.map((e) => <option key={e.id} value={e.id}>{e.prenom} {e.nom}</option>)}
            </select>
          )}
        </label>

        <div style={styles.formGrille}>
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

        <label style={styles.champLabel}>
          <span style={styles.champTexte}>Motif (optionnel)</span>
          <input style={styles.input} value={champ.motif} onChange={(e) => set('motif', e.target.value)} placeholder="Congés payés, arrêt maladie..." />
        </label>

        {erreur && <div style={styles.erreurForm}>{erreur}</div>}

        <button type="submit" disabled={envoi} style={styles.boutonPrincipalLarge}>
          {envoi ? 'Enregistrement...' : 'Mettre en congé'}
        </button>
      </form>
    </div>
  );
}

function formatDateHeure(date, heure) {
  const d = new Date(date + 'T00:00:00');
  return `${d.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })} ${heure}`;
}

const styles = {
  entete: { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 28, flexWrap: 'wrap', gap: 12 },
  titre: { fontSize: 26 },
  sousTitre: { color: 'var(--text-secondary)', fontSize: 14, margin: '6px 0 0' },
  boutonPrincipal: {
    background: 'var(--ink)', color: 'white', border: 'none', borderRadius: 'var(--radius-sm)',
    padding: '10px 16px', fontWeight: 700, fontSize: 13.5, whiteSpace: 'nowrap',
  },
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
  overlay: {
    position: 'fixed', inset: 0, background: 'rgba(28,37,54,0.45)',
    display: 'flex', justifyContent: 'flex-end', zIndex: 50,
  },
  panneau: {
    width: 420, maxWidth: '100%', background: 'var(--card)', height: '100%',
    padding: 28, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 14,
  },
  panneauEntete: { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' },
  panneauTitre: { fontSize: 19 },
  panneauNote: { fontSize: 12.5, color: 'var(--text-secondary)', margin: 0, marginTop: -6 },
  fermer: { background: 'var(--canvas)', border: 'none', borderRadius: 8, width: 30, height: 30, fontSize: 14 },
  champLabel: { display: 'flex', flexDirection: 'column', gap: 5 },
  champTexte: { fontSize: 12.5, fontWeight: 600, color: 'var(--text-secondary)' },
  formGrille: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 },
  input: {
    padding: '10px 12px', borderRadius: 'var(--radius-sm)', border: '1.5px solid var(--border)',
    fontSize: 13.5, outline: 'none', width: '100%', fontFamily: 'var(--font-body)',
  },
  boutonPrincipalLarge: {
    background: 'var(--emerald)', color: 'white', border: 'none', borderRadius: 'var(--radius-sm)',
    padding: '13px', fontWeight: 700, fontSize: 14, marginTop: 6,
  },
  erreurForm: {
    background: 'var(--red-soft)', color: 'var(--red)', padding: '10px 12px',
    borderRadius: 'var(--radius-sm)', fontSize: 13,
  },
};
