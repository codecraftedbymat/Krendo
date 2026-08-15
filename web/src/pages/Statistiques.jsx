import { useEffect, useState } from 'react';
import { api } from '../lib/api';

export default function Statistiques() {
  const [mois, setMois] = useState(new Date().toISOString().slice(0, 7));
  const [stats, setStats] = useState(null);
  const [chargement, setChargement] = useState(true);

  useEffect(() => { charger(); }, [mois]);

  async function charger() {
    setChargement(true);
    try {
      setStats(await api.statistiques(mois));
    } finally {
      setChargement(false);
    }
  }

  function changerMois(delta) {
    const [a, m] = mois.split('-').map(Number);
    const d = new Date(a, m - 1 + delta, 1);
    setMois(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`);
  }

  const maxHeures = stats?.heures_par_employe.length ? Math.max(...stats.heures_par_employe.map((e) => e.heures)) : 1;

  return (
    <div>
      <div style={styles.entete}>
        <div>
          <h1 style={styles.titre}>Statistiques</h1>
          <p style={styles.sousTitre}>Vue d'ensemble de l'activité de votre équipe.</p>
        </div>
        <div style={styles.navMois}>
          <button style={styles.boutonNav} onClick={() => changerMois(-1)}>←</button>
          <span style={styles.libelleMois}>{formatMois(mois)}</span>
          <button style={styles.boutonNav} onClick={() => changerMois(1)}>→</button>
        </div>
      </div>

      {chargement || !stats ? (
        <p style={styles.texteAttente}>Chargement...</p>
      ) : (
        <>
          <div style={styles.cartesResume}>
            <CarteResume label="Heures validées" valeur={`${stats.total_heures}h`} />
            <CarteResume label="Missions ce mois" valeur={stats.nb_missions} />
            <CarteResume label="Taux de remplissage moyen" valeur={`${stats.taux_remplissage_moyen}%`} couleur={stats.taux_remplissage_moyen >= 80 ? 'var(--emerald)' : stats.taux_remplissage_moyen >= 50 ? 'var(--amber)' : 'var(--red)'} />
            <CarteResume label="Absences en attente" valeur={stats.absences.en_attente} couleur={stats.absences.en_attente > 0 ? 'var(--amber)' : undefined} />
          </div>

          <p style={styles.sectionLabel}>Heures par employé</p>
          {stats.heures_par_employe.length === 0 ? (
            <p style={styles.texteAttente}>Aucune heure validée ce mois-ci.</p>
          ) : (
            <div style={styles.listeBarres}>
              {stats.heures_par_employe.map((e) => (
                <div key={e.id} style={styles.ligneBarre}>
                  <span style={styles.nomEmploye}>{e.prenom} {e.nom}</span>
                  <div style={styles.pisteBarre}>
                    <div style={{ ...styles.remplissageBarre, width: `${(e.heures / maxHeures) * 100}%` }} />
                  </div>
                  <span style={styles.valeurBarre}>{e.heures}h</span>
                </div>
              ))}
            </div>
          )}

          <p style={{ ...styles.sectionLabel, marginTop: 28 }}>Remplissage des missions</p>
          {stats.missions.length === 0 ? (
            <p style={styles.texteAttente}>Aucune mission ce mois-ci.</p>
          ) : (
            <div style={styles.liste}>
              {stats.missions.map((m) => (
                <div key={m.id} style={styles.ligneMission}>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 13.5, fontWeight: 600 }}>{m.titre}</div>
                    <div style={{ fontSize: 12, color: 'var(--text-secondary)' }}>
                      {formatDate(m.date_debut)} · {m.nb_disponibles}/{m.nb_employes_requis} confirmés
                    </div>
                  </div>
                  <span style={{
                    ...styles.badgeTaux,
                    background: m.taux_remplissage >= 80 ? 'var(--emerald-soft)' : m.taux_remplissage >= 50 ? 'var(--amber-soft)' : 'var(--red-soft)',
                    color: m.taux_remplissage >= 80 ? 'var(--emerald)' : m.taux_remplissage >= 50 ? '#8A6416' : 'var(--red)',
                  }}>
                    {m.taux_remplissage}%
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

function CarteResume({ label, valeur, couleur }) {
  return (
    <div style={styles.carteResume}>
      <div style={{ fontSize: 12, color: 'var(--text-secondary)', fontWeight: 600 }}>{label}</div>
      <div style={{ fontFamily: 'var(--font-mono)', fontSize: 26, fontWeight: 600, marginTop: 4, color: couleur || 'var(--ink)' }}>{valeur}</div>
    </div>
  );
}

function formatMois(mois) {
  const [a, m] = mois.split('-').map(Number);
  return new Date(a, m - 1, 1).toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' });
}

function formatDate(iso) {
  const d = new Date(iso + 'T00:00:00');
  return d.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' });
}

const styles = {
  entete: { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 28, flexWrap: 'wrap', gap: 12 },
  titre: { fontSize: 26 },
  sousTitre: { color: 'var(--text-secondary)', fontSize: 14, margin: '6px 0 0' },
  navMois: { display: 'flex', alignItems: 'center', gap: 12 },
  boutonNav: {
    background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 8,
    width: 30, height: 30, fontSize: 14, color: 'var(--text-secondary)',
  },
  libelleMois: { fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 15, minWidth: 140, textAlign: 'center', textTransform: 'capitalize' },
  texteAttente: { color: 'var(--text-secondary)', fontSize: 14 },
  cartesResume: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: 12, marginBottom: 32 },
  carteResume: { background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 'var(--radius-md)', padding: 16 },
  sectionLabel: { fontSize: 12.5, fontWeight: 700, color: 'var(--text-secondary)', marginBottom: 12 },
  listeBarres: { display: 'flex', flexDirection: 'column', gap: 10 },
  ligneBarre: { display: 'flex', alignItems: 'center', gap: 12 },
  nomEmploye: { fontSize: 13, fontWeight: 600, width: 140, flexShrink: 0 },
  pisteBarre: { flex: 1, height: 10, background: 'var(--canvas)', borderRadius: 5, overflow: 'hidden' },
  remplissageBarre: { height: '100%', background: 'var(--emerald)', borderRadius: 5 },
  valeurBarre: { fontFamily: 'var(--font-mono)', fontSize: 12.5, fontWeight: 600, width: 44, textAlign: 'right', flexShrink: 0 },
  liste: { display: 'flex', flexDirection: 'column', gap: 8 },
  ligneMission: {
    display: 'flex', alignItems: 'center', gap: 12, background: 'var(--card)',
    border: '1px solid var(--border)', borderRadius: 'var(--radius-md)', padding: '12px 14px',
  },
  badgeTaux: { fontSize: 12, fontWeight: 700, padding: '4px 10px', borderRadius: 6 },
};
