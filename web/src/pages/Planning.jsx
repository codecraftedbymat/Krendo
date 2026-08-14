import { useEffect, useState } from 'react';
import { api } from '../lib/api';

const JOURS = ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim'];
const MOIS = ['Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin', 'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre'];

export default function Planning() {
  const [missions, setMissions] = useState([]);
  const [absences, setAbsences] = useState([]);
  const [chargement, setChargement] = useState(true);
  const [curseur, setCurseur] = useState(() => { const d = new Date(); d.setDate(1); return d; });
  const [jourOuvert, setJourOuvert] = useState(null);

  useEffect(() => {
    Promise.all([api.missions(), api.absences()])
      .then(([m, a]) => { setMissions(m); setAbsences(a.filter((x) => x.statut === 'acceptee')); })
      .finally(() => setChargement(false));
  }, []);

  const jours = construireGrille(curseur);

  function evenementsDuJour(dateISO) {
    const missionsJour = missions.filter((m) => dateISO >= m.date_debut && dateISO <= m.date_fin);
    const absencesJour = absences.filter((a) => dateISO >= a.date_debut && dateISO <= a.date_fin);
    return { missionsJour, absencesJour };
  }

  return (
    <div>
      <div style={styles.entete}>
        <div>
          <h1 style={styles.titre}>Planning</h1>
          <p style={styles.sousTitre}>Vue d'ensemble des missions et absences de l'équipe.</p>
        </div>
        <div style={styles.navMois}>
          <button style={styles.boutonNav} onClick={() => setCurseur(ajouterMois(curseur, -1))}>←</button>
          <span style={styles.libelleMois}>{MOIS[curseur.getMonth()]} {curseur.getFullYear()}</span>
          <button style={styles.boutonNav} onClick={() => setCurseur(ajouterMois(curseur, 1))}>→</button>
        </div>
      </div>

      {chargement ? (
        <p style={styles.texteAttente}>Chargement...</p>
      ) : (
        <>
          <div style={styles.grilleEntetes}>
            {JOURS.map((j) => <div key={j} style={styles.entetesJour}>{j}</div>)}
          </div>
          <div style={styles.grille}>
            {jours.map((jour, i) => {
              if (!jour) return <div key={i} style={styles.caseVide} />;
              const dateISO = formatISO(jour);
              const { missionsJour, absencesJour } = evenementsDuJour(dateISO);
              const estAujourdhui = dateISO === formatISO(new Date());
              return (
                <button
                  key={i}
                  style={{ ...styles.case, ...(estAujourdhui ? styles.caseAujourdhui : {}) }}
                  onClick={() => (missionsJour.length || absencesJour.length) && setJourOuvert({ date: jour, missionsJour, absencesJour })}
                >
                  <span style={styles.numeroJour}>{jour.getDate()}</span>
                  <div style={styles.pastilles}>
                    {missionsJour.slice(0, 2).map((m) => (
                      <div key={m.id} style={styles.pastilleMission}>{m.titre}</div>
                    ))}
                    {absencesJour.slice(0, 1).map((a) => (
                      <div key={a.id} style={styles.pastilleAbsence}>{a.prenom} absent{a.prenom.endsWith('e') ? 'e' : ''}</div>
                    ))}
                    {(missionsJour.length + absencesJour.length) > 3 && (
                      <div style={styles.pastillePlus}>+{missionsJour.length + absencesJour.length - 3}</div>
                    )}
                  </div>
                </button>
              );
            })}
          </div>

          <div style={styles.legende}>
            <span style={styles.legendeItem}><span style={{ ...styles.pointLegende, background: 'var(--emerald)' }} /> Mission</span>
            <span style={styles.legendeItem}><span style={{ ...styles.pointLegende, background: 'var(--amber)' }} /> Absence</span>
          </div>
        </>
      )}

      {jourOuvert && <PanneauJour info={jourOuvert} onFermer={() => setJourOuvert(null)} />}
    </div>
  );
}

function PanneauJour({ info, onFermer }) {
  const { date, missionsJour, absencesJour } = info;
  return (
    <div style={styles.overlay} onClick={onFermer}>
      <div style={styles.panneau} onClick={(e) => e.stopPropagation()}>
        <div style={styles.panneauEntete}>
          <h2 style={styles.panneauTitre}>
            {date.toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' })}
          </h2>
          <button style={styles.fermer} onClick={onFermer}>✕</button>
        </div>

        {missionsJour.length > 0 && (
          <>
            <p style={styles.sectionLabel}>Missions</p>
            <div style={styles.listeEvenements}>
              {missionsJour.map((m) => (
                <div key={m.id} style={styles.itemEvenement}>
                  <div style={{ ...styles.puce, background: 'var(--emerald)' }} />
                  <div>
                    <div style={{ fontSize: 13.5, fontWeight: 600 }}>{m.titre}</div>
                    <div style={{ fontSize: 12, color: 'var(--text-secondary)' }}>
                      {m.heure_debut}–{m.heure_fin}{m.lieu ? ` · ${m.lieu}` : ''} · {m.nb_employes_requis} pers. requises
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}

        {absencesJour.length > 0 && (
          <>
            <p style={{ ...styles.sectionLabel, marginTop: missionsJour.length ? 20 : 0 }}>Absences</p>
            <div style={styles.listeEvenements}>
              {absencesJour.map((a) => (
                <div key={a.id} style={styles.itemEvenement}>
                  <div style={{ ...styles.puce, background: 'var(--amber)' }} />
                  <div>
                    <div style={{ fontSize: 13.5, fontWeight: 600 }}>{a.prenom} {a.nom}</div>
                    <div style={{ fontSize: 12, color: 'var(--text-secondary)' }}>
                      Du {a.date_debut} {a.heure_debut} au {a.date_fin} {a.heure_fin}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}

function construireGrille(curseur) {
  const annee = curseur.getFullYear();
  const mois = curseur.getMonth();
  const premierJour = new Date(annee, mois, 1);
  const dernierJour = new Date(annee, mois + 1, 0);
  const decalage = (premierJour.getDay() + 6) % 7; // lundi = 0

  const jours = [];
  for (let i = 0; i < decalage; i++) jours.push(null);
  for (let d = 1; d <= dernierJour.getDate(); d++) jours.push(new Date(annee, mois, d));
  return jours;
}

function ajouterMois(date, delta) {
  const d = new Date(date);
  d.setMonth(d.getMonth() + delta);
  return d;
}

function formatISO(date) {
  return date.toISOString().slice(0, 10);
}

const styles = {
  entete: { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 24, flexWrap: 'wrap', gap: 12 },
  titre: { fontSize: 26 },
  sousTitre: { color: 'var(--text-secondary)', fontSize: 14, margin: '6px 0 0' },
  navMois: { display: 'flex', alignItems: 'center', gap: 12 },
  boutonNav: {
    background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 8,
    width: 30, height: 30, fontSize: 14, color: 'var(--text-secondary)',
  },
  libelleMois: { fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 15, minWidth: 140, textAlign: 'center' },
  texteAttente: { color: 'var(--text-secondary)', fontSize: 14 },
  grilleEntetes: { display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 6, marginBottom: 6 },
  entetesJour: { fontSize: 11.5, fontWeight: 700, color: 'var(--text-muted)', textAlign: 'center', padding: '4px 0' },
  grille: { display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 6 },
  caseVide: { minHeight: 84 },
  case: {
    minHeight: 84, background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 10,
    padding: 6, textAlign: 'left', display: 'flex', flexDirection: 'column', gap: 4, cursor: 'pointer',
  },
  caseAujourdhui: { borderColor: 'var(--emerald)', borderWidth: 1.5 },
  numeroJour: { fontSize: 12, fontWeight: 700, color: 'var(--text-secondary)' },
  pastilles: { display: 'flex', flexDirection: 'column', gap: 2 },
  pastilleMission: {
    fontSize: 10, fontWeight: 600, background: 'var(--emerald-soft)', color: 'var(--emerald)',
    padding: '2px 5px', borderRadius: 4, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
  },
  pastilleAbsence: {
    fontSize: 10, fontWeight: 600, background: 'var(--amber-soft)', color: 'var(--amber)',
    padding: '2px 5px', borderRadius: 4, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
  },
  pastillePlus: { fontSize: 10, color: 'var(--text-muted)', paddingLeft: 5 },
  legende: { display: 'flex', gap: 16, marginTop: 16 },
  legendeItem: { display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: 'var(--text-secondary)' },
  pointLegende: { width: 8, height: 8, borderRadius: '50%', display: 'inline-block' },
  overlay: {
    position: 'fixed', inset: 0, background: 'rgba(28,37,54,0.45)',
    display: 'flex', justifyContent: 'flex-end', zIndex: 50,
  },
  panneau: {
    width: 420, maxWidth: '100%', background: 'var(--card)', height: '100%',
    padding: 28, overflowY: 'auto',
  },
  panneauEntete: { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 20 },
  panneauTitre: { fontSize: 18, textTransform: 'capitalize' },
  fermer: { background: 'var(--canvas)', border: 'none', borderRadius: 8, width: 30, height: 30, fontSize: 14 },
  sectionLabel: { fontSize: 12.5, fontWeight: 700, color: 'var(--text-secondary)', marginBottom: 10 },
  listeEvenements: { display: 'flex', flexDirection: 'column', gap: 8 },
  itemEvenement: {
    display: 'flex', alignItems: 'flex-start', gap: 10,
    padding: '10px 12px', background: 'var(--canvas)', borderRadius: 'var(--radius-sm)',
  },
  puce: { width: 8, height: 8, borderRadius: '50%', marginTop: 5, flexShrink: 0 },
};
