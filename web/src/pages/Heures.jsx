import { useEffect, useState } from 'react';
import { api } from '../lib/api';

export default function Heures({ utilisateur }) {
  const [creneaux, setCreneaux] = useState([]);
  const [chargement, setChargement] = useState(true);
  const [edition, setEdition] = useState(null);
  const [filtre, setFiltre] = useState('en_attente');
  const [export_, setExport] = useState(false);

  const peutValider = utilisateur.permissions.peut_valider_heures || utilisateur.permissions.peut_voir_tout;
  const peutModifier = utilisateur.permissions.peut_modifier_creneaux || utilisateur.permissions.peut_voir_tout;

  useEffect(() => { charger(); }, []);

  async function charger() {
    setChargement(true);
    try {
      setCreneaux(await api.tousLesCreneaux());
    } finally {
      setChargement(false);
    }
  }

  async function exporter() {
    setExport(true);
    try {
      await api.exporterHeuresCsv();
    } finally {
      setExport(false);
    }
  }

  const filtres = creneaux.filter((c) => filtre === 'tous' || c.statut_validation === filtre);

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 12 }}>
        <div>
          <h1 style={styles.titre}>Heures</h1>
          <p style={styles.sousTitre}>Validez ou modifiez les heures de toute l'équipe, tous chantiers confondus.</p>
        </div>
        {peutValider && (
          <button style={styles.boutonExport} onClick={exporter} disabled={export_}>
            {export_ ? 'Export...' : '⬇ Exporter en CSV (heures validées)'}
          </button>
        )}
      </div>

      <div style={styles.filtres}>
        {[
          { id: 'en_attente', label: 'À valider' },
          { id: 'valide', label: 'Validées' },
          { id: 'annule', label: 'Annulées' },
          { id: 'tous', label: 'Tout' },
        ].map((f) => (
          <button
            key={f.id}
            style={{ ...styles.filtreBouton, ...(filtre === f.id ? styles.filtreBoutonActif : {}) }}
            onClick={() => setFiltre(f.id)}
          >
            {f.label}
          </button>
        ))}
      </div>

      {chargement ? (
        <p style={styles.texteAttente}>Chargement...</p>
      ) : filtres.length === 0 ? (
        <p style={styles.texteAttente}>Rien à afficher ici.</p>
      ) : (
        <div style={styles.liste}>
          {filtres.map((c) => (
            <div key={c.id} style={styles.ligne}>
              <div style={styles.gauche}>
                <div style={styles.avatarPetit}>{c.prenom[0]}{c.nom[0]}</div>
                <div>
                  <div style={{ fontSize: 13.5, fontWeight: 600 }}>
                    {c.prenom} {c.nom}
                    {c.est_heure_supplementaire && <span style={styles.badgeSup}>Heure sup</span>}
                  </div>
                  <div style={{ fontSize: 12, color: 'var(--text-secondary)' }}>
                    {c.mission_titre} · {formatDate(c.mission_date)}
                  </div>
                </div>
              </div>

              {edition === c.id ? (
                <FormulaireEdition
                  creneau={c}
                  onAnnuler={() => setEdition(null)}
                  onEnregistre={() => { setEdition(null); charger(); }}
                />
              ) : (
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span style={styles.heureTexte}>{c.heure_debut}–{c.heure_fin}</span>
                  <StatutBadge statut={c.statut_validation} />
                  {peutValider && c.statut_validation === 'en_attente' && (
                    <>
                      <button style={styles.boutonMini} onClick={() => api.validerCreneau(c.id, 'valide').then(charger)}>Valider</button>
                      <button style={styles.boutonMiniAnnuler} onClick={() => api.validerCreneau(c.id, 'annule').then(charger)}>Annuler</button>
                    </>
                  )}
                  {peutModifier && (
                    <button style={styles.boutonMini} onClick={() => setEdition(c.id)}>Modifier</button>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function FormulaireEdition({ creneau, onAnnuler, onEnregistre }) {
  const [heureDebut, setHeureDebut] = useState(creneau.heure_debut);
  const [heureFin, setHeureFin] = useState(creneau.heure_fin);
  const [heureSup, setHeureSup] = useState(creneau.est_heure_supplementaire);

  async function enregistrer() {
    await api.definirCreneau(creneau.mission_id, creneau.utilisateur_id, {
      heure_debut: heureDebut, heure_fin: heureFin, est_heure_supplementaire: heureSup,
    });
    onEnregistre();
  }

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
      <input type="time" value={heureDebut} onChange={(e) => setHeureDebut(e.target.value)} style={styles.inputHeure} />
      <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>à</span>
      <input type="time" value={heureFin} onChange={(e) => setHeureFin(e.target.value)} style={styles.inputHeure} />
      <label style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 11.5, color: 'var(--text-secondary)' }}>
        <input type="checkbox" checked={heureSup} onChange={(e) => setHeureSup(e.target.checked)} /> H. sup.
      </label>
      <button style={styles.boutonMini} onClick={enregistrer}>OK</button>
      <button style={styles.boutonMiniAnnuler} onClick={onAnnuler}>✕</button>
    </div>
  );
}

function StatutBadge({ statut }) {
  const config = {
    en_attente: { texte: 'À valider', fond: 'var(--amber-soft)', couleur: 'var(--amber)' },
    valide: { texte: 'Validé', fond: 'var(--emerald-soft)', couleur: 'var(--emerald)' },
    annule: { texte: 'Annulé', fond: 'var(--red-soft)', couleur: 'var(--red)' },
  }[statut];
  return <span style={{ ...styles.badge, background: config.fond, color: config.couleur }}>{config.texte}</span>;
}

function formatDate(iso) {
  const d = new Date(iso + 'T00:00:00');
  return d.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' });
}

const styles = {
  titre: { fontSize: 26 },
  sousTitre: { color: 'var(--text-secondary)', fontSize: 14, margin: '6px 0 20px' },
  boutonExport: {
    background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)',
    padding: '9px 14px', fontSize: 12.5, fontWeight: 700, color: 'var(--text-primary)', whiteSpace: 'nowrap',
  },
  filtres: { display: 'flex', gap: 6, marginBottom: 20 },
  filtreBouton: {
    background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 20,
    padding: '7px 14px', fontSize: 12.5, fontWeight: 700, color: 'var(--text-secondary)',
  },
  filtreBoutonActif: { background: 'var(--ink)', color: 'white', borderColor: 'var(--ink)' },
  texteAttente: { color: 'var(--text-secondary)', fontSize: 14 },
  liste: { display: 'flex', flexDirection: 'column', gap: 8 },
  ligne: {
    display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 10,
    background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 'var(--radius-md)', padding: '12px 14px',
  },
  gauche: { display: 'flex', alignItems: 'center', gap: 10 },
  avatarPetit: {
    width: 32, height: 32, borderRadius: '50%', background: 'var(--emerald-soft)', color: 'var(--emerald)',
    display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 700, flexShrink: 0,
  },
  badgeSup: {
    marginLeft: 8, fontSize: 10, fontWeight: 700, background: 'var(--amber-soft)', color: 'var(--amber)',
    padding: '2px 7px', borderRadius: 5,
  },
  heureTexte: { fontFamily: 'var(--font-mono)', fontSize: 13, fontWeight: 600 },
  badge: { fontSize: 11.5, fontWeight: 700, padding: '4px 10px', borderRadius: 6, whiteSpace: 'nowrap' },
  inputHeure: { padding: '5px 7px', borderRadius: 6, border: '1.5px solid var(--border)', fontSize: 12.5, width: 84 },
  boutonMini: {
    background: 'var(--ink)', color: 'white', border: 'none', borderRadius: 6,
    padding: '5px 10px', fontSize: 11.5, fontWeight: 700,
  },
  boutonMiniAnnuler: {
    background: 'var(--canvas)', color: 'var(--text-secondary)', border: '1px solid var(--border)', borderRadius: 6,
    padding: '5px 10px', fontSize: 11.5, fontWeight: 700,
  },
};
