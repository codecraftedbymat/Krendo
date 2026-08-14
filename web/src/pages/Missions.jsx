import { useEffect, useState } from 'react';
import { api } from '../lib/api';

export default function Missions() {
  const [missions, setMissions] = useState([]);
  const [chargement, setChargement] = useState(true);
  const [missionOuverte, setMissionOuverte] = useState(null);
  const [formulaireOuvert, setFormulaireOuvert] = useState(false);

  useEffect(() => { chargerMissions(); }, []);

  async function chargerMissions() {
    setChargement(true);
    try {
      const data = await api.missions();
      setMissions(data.sort((a, b) => new Date(a.date_debut) - new Date(b.date_debut)));
    } finally {
      setChargement(false);
    }
  }

  return (
    <div>
      <div style={styles.entete}>
        <div>
          <h1 style={styles.titre}>Missions</h1>
          <p style={styles.sousTitre}>Créez une mission et suivez les disponibilités de votre équipe.</p>
        </div>
        <button style={styles.boutonPrincipal} onClick={() => setFormulaireOuvert(true)}>
          + Nouvelle mission
        </button>
      </div>

      {chargement ? (
        <p style={styles.texteAttente}>Chargement des missions...</p>
      ) : missions.length === 0 ? (
        <div style={styles.vide}>
          <p style={{ margin: 0, fontWeight: 600 }}>Aucune mission pour l'instant</p>
          <p style={{ margin: '4px 0 0', color: 'var(--text-secondary)', fontSize: 13.5 }}>
            Créez votre première mission pour notifier votre équipe.
          </p>
        </div>
      ) : (
        <div style={styles.grille}>
          {missions.map((m) => (
            <CarteMission key={m.id} mission={m} onOuvrir={() => setMissionOuverte(m)} />
          ))}
        </div>
      )}

      {missionOuverte && (
        <DetailMission mission={missionOuverte} onFermer={() => setMissionOuverte(null)} />
      )}

      {formulaireOuvert && (
        <FormulaireMission
          onFermer={() => setFormulaireOuvert(false)}
          onCree={() => { setFormulaireOuvert(false); chargerMissions(); }}
        />
      )}
    </div>
  );
}

function CarteMission({ mission, onOuvrir }) {
  return (
    <button style={styles.carteMission} onClick={onOuvrir}>
      <div style={styles.carteHaut}>
        <h3 style={styles.carteTitre}>{mission.titre}</h3>
        <span style={styles.badgeRequis}>{mission.nb_employes_requis} pers.</span>
      </div>
      <p style={styles.carteInfo}>
        {formatDate(mission.date_debut)} · {mission.heure_debut}–{mission.heure_fin}
      </p>
      {mission.lieu && <p style={styles.carteLieu}>📍 {mission.lieu}</p>}
    </button>
  );
}

function DetailMission({ mission, onFermer }) {
  const [reponses, setReponses] = useState([]);
  const [chargement, setChargement] = useState(true);

  useEffect(() => {
    api.reponsesMission(mission.id).then(setReponses).finally(() => setChargement(false));
  }, [mission.id]);

  const disponibles = reponses.filter((r) => r.statut === 'disponible').length;
  const indisponibles = reponses.filter((r) => r.statut === 'indisponible').length;
  const enAttente = reponses.filter((r) => r.statut === 'en_attente').length;

  return (
    <div style={styles.overlay} onClick={onFermer}>
      <div style={styles.panneau} onClick={(e) => e.stopPropagation()}>
        <div style={styles.panneauEntete}>
          <div>
            <h2 style={styles.panneauTitre}>{mission.titre}</h2>
            <p style={styles.carteInfo}>
              {formatDate(mission.date_debut)} · {mission.heure_debut}–{mission.heure_fin}
              {mission.lieu ? ` · ${mission.lieu}` : ''}
            </p>
          </div>
          <button style={styles.fermer} onClick={onFermer}>✕</button>
        </div>

        <div style={styles.statsRangee}>
          <StatBloc label="Requis" valeur={mission.nb_employes_requis} couleur="var(--ink)" />
          <StatBloc label="Disponibles" valeur={disponibles} couleur="var(--emerald)" fond="var(--emerald-soft)" />
          <StatBloc label="Indisponibles" valeur={indisponibles} couleur="var(--red)" fond="var(--red-soft)" />
        </div>

        <BarreSegmentee disponibles={disponibles} indisponibles={indisponibles} enAttente={enAttente} />

        <p style={styles.sectionLabel}>Réponses des employés</p>
        {chargement ? (
          <p style={styles.texteAttente}>Chargement...</p>
        ) : (
          <div style={styles.listeReponses}>
            {reponses.map((r) => (
              <div key={r.id} style={styles.ligneReponse}>
                <div style={styles.reponseGauche}>
                  <div style={styles.avatarPetit}>{r.prenom[0]}{r.nom[0]}</div>
                  <div>
                    <div style={{ fontSize: 13.5, fontWeight: 600 }}>{r.prenom} {r.nom}</div>
                    {r.commentaire && (
                      <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>Motif : {r.commentaire}</div>
                    )}
                  </div>
                </div>
                <StatutBadge statut={r.statut} />
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function StatBloc({ label, valeur, couleur, fond }) {
  return (
    <div style={{ ...styles.statBloc, background: fond || 'var(--canvas)' }}>
      <div style={{ fontSize: 12.5, color: couleur, fontWeight: 600 }}>{label}</div>
      <div style={{ fontFamily: 'var(--font-mono)', fontSize: 22, fontWeight: 600, color: couleur }}>{valeur}</div>
    </div>
  );
}

function BarreSegmentee({ disponibles, indisponibles, enAttente }) {
  const total = disponibles + indisponibles + enAttente || 1;
  return (
    <div style={styles.barreConteneur}>
      <div style={{ width: `${(disponibles / total) * 100}%`, background: 'var(--emerald)' }} />
      <div style={{ width: `${(indisponibles / total) * 100}%`, background: 'var(--red)' }} />
      <div style={{ width: `${(enAttente / total) * 100}%`, background: 'var(--border)' }} />
    </div>
  );
}

function StatutBadge({ statut }) {
  const config = {
    disponible: { texte: 'Disponible', fond: 'var(--emerald-soft)', couleur: 'var(--emerald)' },
    indisponible: { texte: 'Indisponible', fond: 'var(--red-soft)', couleur: 'var(--red)' },
    en_attente: { texte: 'En attente', fond: 'var(--canvas)', couleur: 'var(--text-secondary)' },
  }[statut];
  return (
    <span style={{ ...styles.badge, background: config.fond, color: config.couleur }}>{config.texte}</span>
  );
}

function FormulaireMission({ onFermer, onCree }) {
  const [champ, setChamp] = useState({
    titre: '', lieu: '', date_debut: '', heure_debut: '08:00',
    date_fin: '', heure_fin: '18:00', nb_employes_requis: 1, description: '',
  });
  const [erreur, setErreur] = useState('');
  const [envoi, setEnvoi] = useState(false);

  function set(champNom, valeur) {
    setChamp((c) => ({ ...c, [champNom]: valeur }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setErreur('');
    setEnvoi(true);
    try {
      await api.creerMission({ ...champ, nb_employes_requis: Number(champ.nb_employes_requis) });
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
          <h2 style={styles.panneauTitre}>Nouvelle mission</h2>
          <button type="button" style={styles.fermer} onClick={onFermer}>✕</button>
        </div>

        <div style={styles.formGrille}>
          <Champ label="Titre" span={2}>
            <input required style={styles.input} value={champ.titre} onChange={(e) => set('titre', e.target.value)} placeholder="Salon Tech Expo" />
          </Champ>
          <Champ label="Lieu" span={2}>
            <input style={styles.input} value={champ.lieu} onChange={(e) => set('lieu', e.target.value)} placeholder="Paris Expo" />
          </Champ>
          <Champ label="Date de début">
            <input required type="date" style={styles.input} value={champ.date_debut} onChange={(e) => set('date_debut', e.target.value)} />
          </Champ>
          <Champ label="Heure de début">
            <input required type="time" style={styles.input} value={champ.heure_debut} onChange={(e) => set('heure_debut', e.target.value)} />
          </Champ>
          <Champ label="Date de fin">
            <input required type="date" style={styles.input} value={champ.date_fin} onChange={(e) => set('date_fin', e.target.value)} />
          </Champ>
          <Champ label="Heure de fin">
            <input required type="time" style={styles.input} value={champ.heure_fin} onChange={(e) => set('heure_fin', e.target.value)} />
          </Champ>
          <Champ label="Employés requis">
            <input required type="number" min="1" style={styles.input} value={champ.nb_employes_requis} onChange={(e) => set('nb_employes_requis', e.target.value)} />
          </Champ>
          <Champ label="Description" span={2}>
            <textarea style={{ ...styles.input, resize: 'vertical', minHeight: 60 }} value={champ.description} onChange={(e) => set('description', e.target.value)} />
          </Champ>
        </div>

        {erreur && <div style={styles.erreurForm}>{erreur}</div>}

        <button type="submit" disabled={envoi} style={styles.boutonPrincipalLarge}>
          {envoi ? 'Création...' : 'Créer et notifier l\'équipe'}
        </button>
      </form>
    </div>
  );
}

function Champ({ label, children, span }) {
  return (
    <label style={{ display: 'flex', flexDirection: 'column', gap: 5, gridColumn: span ? `span ${span}` : undefined }}>
      <span style={{ fontSize: 12.5, fontWeight: 600, color: 'var(--text-secondary)' }}>{label}</span>
      {children}
    </label>
  );
}

function formatDate(iso) {
  const d = new Date(iso + 'T00:00:00');
  return d.toLocaleDateString('fr-FR', { day: 'numeric', month: 'long' });
}

const styles = {
  entete: { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 28 },
  titre: { fontSize: 26 },
  sousTitre: { color: 'var(--text-secondary)', fontSize: 14, margin: '6px 0 0' },
  boutonPrincipal: {
    background: 'var(--ink)', color: 'white', border: 'none', borderRadius: 'var(--radius-sm)',
    padding: '10px 16px', fontWeight: 700, fontSize: 13.5, whiteSpace: 'nowrap',
  },
  boutonPrincipalLarge: {
    background: 'var(--emerald)', color: 'white', border: 'none', borderRadius: 'var(--radius-sm)',
    padding: '13px', fontWeight: 700, fontSize: 14, marginTop: 22,
  },
  grille: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: 14 },
  carteMission: {
    textAlign: 'left', background: 'var(--card)', border: '1px solid var(--border)',
    borderRadius: 'var(--radius-md)', padding: 18, cursor: 'pointer',
  },
  carteHaut: { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 8 },
  carteTitre: { fontSize: 15.5, margin: 0 },
  badgeRequis: {
    fontSize: 11, fontWeight: 700, background: 'var(--canvas)', color: 'var(--text-secondary)',
    padding: '3px 8px', borderRadius: 6, whiteSpace: 'nowrap',
  },
  carteInfo: { fontSize: 13, color: 'var(--text-secondary)', margin: '8px 0 0' },
  carteLieu: { fontSize: 12.5, color: 'var(--text-muted)', margin: '4px 0 0' },
  texteAttente: { color: 'var(--text-secondary)', fontSize: 14 },
  vide: {
    background: 'var(--card)', border: '1px dashed var(--border)', borderRadius: 'var(--radius-md)',
    padding: 36, textAlign: 'center',
  },
  overlay: {
    position: 'fixed', inset: 0, background: 'rgba(28,37,54,0.45)',
    display: 'flex', justifyContent: 'flex-end', zIndex: 50,
  },
  panneau: {
    width: 440, maxWidth: '100%', background: 'var(--card)', height: '100%',
    padding: 28, overflowY: 'auto', display: 'flex', flexDirection: 'column',
  },
  panneauEntete: { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 20 },
  panneauTitre: { fontSize: 20 },
  fermer: { background: 'var(--canvas)', border: 'none', borderRadius: 8, width: 30, height: 30, fontSize: 14 },
  statsRangee: { display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10, marginBottom: 14 },
  statBloc: { borderRadius: 'var(--radius-sm)', padding: '10px 12px' },
  barreConteneur: { display: 'flex', height: 8, borderRadius: 4, overflow: 'hidden', marginBottom: 24, background: 'var(--border)' },
  sectionLabel: { fontSize: 12.5, fontWeight: 700, color: 'var(--text-secondary)', marginBottom: 10 },
  listeReponses: { display: 'flex', flexDirection: 'column', gap: 8 },
  ligneReponse: {
    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
    padding: '10px 12px', background: 'var(--canvas)', borderRadius: 'var(--radius-sm)',
  },
  reponseGauche: { display: 'flex', alignItems: 'center', gap: 10 },
  avatarPetit: {
    width: 28, height: 28, borderRadius: '50%', background: 'var(--emerald-soft)', color: 'var(--emerald)',
    display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10.5, fontWeight: 700,
  },
  badge: { fontSize: 11.5, fontWeight: 700, padding: '4px 10px', borderRadius: 6, whiteSpace: 'nowrap' },
  formGrille: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 },
  input: {
    padding: '10px 12px', borderRadius: 'var(--radius-sm)', border: '1.5px solid var(--border)',
    fontSize: 13.5, outline: 'none', width: '100%',
  },
  erreurForm: {
    background: 'var(--red-soft)', color: 'var(--red)', padding: '10px 12px',
    borderRadius: 'var(--radius-sm)', fontSize: 13, marginTop: 16,
  },
};
