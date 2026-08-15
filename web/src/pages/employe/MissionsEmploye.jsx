import { useEffect, useState } from 'react';
import { api } from '../../lib/api';
import { useTranslation } from '../../LangueContext';

export default function MissionsEmploye({ utilisateur }) {
  const { t } = useTranslation();
  const [missions, setMissions] = useState([]);
  const [reponses, setReponses] = useState({});
  const [chargement, setChargement] = useState(true);
  const [missionOuverte, setMissionOuverte] = useState(null);

  useEffect(() => { charger(); }, []);

  async function charger() {
    setChargement(true);
    try {
      const data = await api.missions();
      const tri = data.sort((a, b) => new Date(a.date_debut) - new Date(b.date_debut));
      setMissions(tri);

      // Récupère ma propre réponse pour chaque mission
      const toutes = await Promise.all(
        tri.map((m) => api.reponsesMission(m.id).then((r) => ({ missionId: m.id, moi: r.find((x) => x.utilisateur_id === utilisateur.id) })))
      );
      const map = {};
      toutes.forEach((t) => { map[t.missionId] = t.moi; });
      setReponses(map);
    } finally {
      setChargement(false);
    }
  }

  const aTraiter = missions.filter((m) => reponses[m.id]?.statut === 'en_attente');
  const traitees = missions.filter((m) => reponses[m.id]?.statut && reponses[m.id]?.statut !== 'en_attente');

  return (
    <div>
      <h1 style={styles.titre}>{t('titre_mes_missions')}</h1>
      <p style={styles.sousTitre}>{t('soustitre_mes_missions')}</p>

      {chargement ? (
        <p style={styles.texteAttente}>{t('chargement')}</p>
      ) : (
        <>
          {aTraiter.length > 0 && (
            <>
              <p style={styles.sectionLabel}>{t('a_confirmer')} ({aTraiter.length})</p>
              <div style={styles.liste}>
                {aTraiter.map((m) => (
                  <CarteMission key={m.id} mission={m} reponse={reponses[m.id]} onOuvrir={() => setMissionOuverte(m)} />
                ))}
              </div>
            </>
          )}

          <p style={{ ...styles.sectionLabel, marginTop: aTraiter.length ? 24 : 0 }}>{t('autres_missions')}</p>
          {traitees.length === 0 ? (
            <p style={styles.texteAttente}>{t('aucune_mission')}</p>
          ) : (
            <div style={styles.liste}>
              {traitees.map((m) => (
                <CarteMission key={m.id} mission={m} reponse={reponses[m.id]} onOuvrir={() => setMissionOuverte(m)} />
              ))}
            </div>
          )}
        </>
      )}

      {missionOuverte && (
        <PanneauReponse
          mission={missionOuverte}
          reponse={reponses[missionOuverte.id]}
          onFermer={() => setMissionOuverte(null)}
          onRepondu={() => { setMissionOuverte(null); charger(); }}
        />
      )}
    </div>
  );
}

function CarteMission({ mission, reponse, onOuvrir }) {
  return (
    <button style={styles.carte} onClick={onOuvrir}>
      <div style={{ flex: 1, textAlign: 'left' }}>
        <div style={{ fontSize: 14.5, fontWeight: 700 }}>{mission.titre}</div>
        <div style={styles.carteInfo}>
          {formatDate(mission.date_debut)} · {mission.heure_debut}–{mission.heure_fin}
          {mission.lieu ? ` · ${mission.lieu}` : ''}
        </div>
      </div>
      <StatutBadge statut={reponse?.statut} />
    </button>
  );
}

function StatutBadge({ statut }) {
  const { t } = useTranslation();
  const config = {
    en_attente: { texte: t('en_attente'), fond: 'var(--amber-soft)', couleur: 'var(--amber)' },
    disponible: { texte: t('disponible'), fond: 'var(--emerald-soft)', couleur: 'var(--emerald)' },
    indisponible: { texte: t('indisponible'), fond: 'var(--red-soft)', couleur: 'var(--red)' },
  }[statut] || { texte: '—', fond: 'var(--canvas)', couleur: 'var(--text-muted)' };
  return <span style={{ ...styles.badge, background: config.fond, color: config.couleur }}>{config.texte}</span>;
}

function PanneauReponse({ mission, reponse, onFermer, onRepondu }) {
  const { t } = useTranslation();
  const [commentaire, setCommentaire] = useState('');
  const [envoi, setEnvoi] = useState(false);

  async function repondre(statut) {
    setEnvoi(true);
    try {
      await api.repondreMission(mission.id, statut, statut === 'indisponible' ? commentaire : undefined);
      onRepondu();
    } finally {
      setEnvoi(false);
    }
  }

  return (
    <div style={styles.overlay} onClick={onFermer}>
      <div style={styles.panneau} onClick={(e) => e.stopPropagation()}>
        <div style={styles.panneauEntete}>
          <h2 style={{ fontSize: 19, margin: 0 }}>{mission.titre}</h2>
          <button style={styles.fermer} onClick={onFermer}>✕</button>
        </div>
        <p style={styles.carteInfo}>
          {formatDate(mission.date_debut)} · {mission.heure_debut}–{mission.heure_fin}
          {mission.lieu ? ` · ${mission.lieu}` : ''}
        </p>
        {mission.description && <p style={{ fontSize: 13.5, color: 'var(--text-secondary)', marginTop: 10 }}>{mission.description}</p>}

        <div style={{ marginTop: 20 }}>
          <p style={{ fontSize: 12.5, fontWeight: 700, color: 'var(--text-secondary)', marginBottom: 8 }}>Votre statut actuel</p>
          <StatutBadge statut={reponse?.statut} />
        </div>

        <label style={{ display: 'block', marginTop: 20 }}>
          <span style={{ fontSize: 12.5, fontWeight: 600, color: 'var(--text-secondary)' }}>Motif si indisponible (optionnel)</span>
          <input
            style={styles.input}
            value={commentaire}
            onChange={(e) => setCommentaire(e.target.value)}
            placeholder="Ex : déjà en mission ce jour-là"
          />
        </label>

        <div style={{ display: 'flex', gap: 10, marginTop: 16 }}>
          <button disabled={envoi} style={styles.boutonDisponible} onClick={() => repondre('disponible')}>{t('disponible')}</button>
          <button disabled={envoi} style={styles.boutonIndisponible} onClick={() => repondre('indisponible')}>{t('indisponible')}</button>
        </div>
      </div>
    </div>
  );
}

function formatDate(iso) {
  const d = new Date(iso + 'T00:00:00');
  return d.toLocaleDateString('fr-FR', { day: 'numeric', month: 'long' });
}

const styles = {
  titre: { fontSize: 22, fontFamily: 'var(--font-display)', fontWeight: 800 },
  sousTitre: { color: 'var(--text-secondary)', fontSize: 13.5, margin: '6px 0 20px' },
  sectionLabel: { fontSize: 12, fontWeight: 700, color: 'var(--text-secondary)', marginBottom: 8 },
  texteAttente: { color: 'var(--text-secondary)', fontSize: 13.5 },
  liste: { display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 8 },
  carte: {
    display: 'flex', alignItems: 'center', gap: 10, background: 'var(--card)',
    border: '1px solid var(--border)', borderRadius: 'var(--radius-md)', padding: '12px 14px', textAlign: 'left',
  },
  carteInfo: { fontSize: 12.5, color: 'var(--text-secondary)', marginTop: 4 },
  badge: { fontSize: 11, fontWeight: 700, padding: '4px 9px', borderRadius: 6, whiteSpace: 'nowrap' },
  overlay: { position: 'fixed', inset: 0, background: 'rgba(28,37,54,0.45)', display: 'flex', alignItems: 'flex-end', zIndex: 50 },
  panneau: { width: '100%', background: 'var(--card)', borderRadius: '20px 20px 0 0', padding: 24, maxHeight: '85vh', overflowY: 'auto' },
  panneauEntete: { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' },
  fermer: { background: 'var(--canvas)', border: 'none', borderRadius: 8, width: 30, height: 30, fontSize: 14 },
  input: {
    width: '100%', padding: '10px 12px', borderRadius: 'var(--radius-sm)', border: '1.5px solid var(--border)',
    fontSize: 13.5, outline: 'none', marginTop: 6, boxSizing: 'border-box',
  },
  boutonDisponible: {
    flex: 1, background: 'var(--emerald)', color: 'white', border: 'none', borderRadius: 'var(--radius-sm)',
    padding: '13px', fontWeight: 700, fontSize: 14,
  },
  boutonIndisponible: {
    flex: 1, background: 'var(--canvas)', color: 'var(--text-secondary)', border: 'none', borderRadius: 'var(--radius-sm)',
    padding: '13px', fontWeight: 700, fontSize: 14,
  },
};
