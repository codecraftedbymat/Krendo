import { useEffect, useState } from 'react';
import { api } from '../lib/api';
import { useTranslation } from '../LangueContext';

const CLES_JOURS = [
  { id: 1, cle: 'jour_lundi' }, { id: 2, cle: 'jour_mardi' }, { id: 3, cle: 'jour_mercredi' },
  { id: 4, cle: 'jour_jeudi' }, { id: 5, cle: 'jour_vendredi' }, { id: 6, cle: 'jour_samedi' }, { id: 0, cle: 'jour_dimanche' },
];

export default function Parametres() {
  const { t } = useTranslation();
  const [donnees, setDonnees] = useState(null);
  const [chargement, setChargement] = useState(true);
  const [enregistrement, setEnregistrement] = useState(false);

  useEffect(() => { charger(); }, []);

  async function charger() {
    setChargement(true);
    try {
      setDonnees(await api.parametres());
    } finally {
      setChargement(false);
    }
  }

  const joursActifs = donnees ? donnees.jours_travailles.split(',').map(Number) : [];

  async function basculerJour(id) {
    const nouveaux = joursActifs.includes(id)
      ? joursActifs.filter((j) => j !== id)
      : [...joursActifs, id];
    setEnregistrement(true);
    await api.majParametres({ jours_travailles: nouveaux.sort().join(',') });
    await charger();
    setEnregistrement(false);
  }

  async function basculerJoursFeries() {
    setEnregistrement(true);
    await api.majParametres({ travaille_jours_feries: !donnees.travaille_jours_feries });
    await charger();
    setEnregistrement(false);
  }

  if (chargement || !donnees) return <p style={styles.texteAttente}>{t('chargement')}</p>;

  return (
    <div style={{ maxWidth: 640 }}>
      <h1 style={styles.titre}>{t('titre_parametres')}</h1>
      <p style={styles.sousTitre}>{t('soustitre_parametres')}</p>

      <div style={styles.bloc}>
        <p style={styles.blocTitre}>{t('jours_travailles')}</p>
        <p style={styles.blocDescription}>
          {t('jours_travailles_desc')}
        </p>
        <div style={styles.joursGrille}>
          {CLES_JOURS.map((j) => (
            <button
              key={j.id}
              style={{ ...styles.jourBouton, ...(joursActifs.includes(j.id) ? styles.jourBoutonActif : {}) }}
              onClick={() => basculerJour(j.id)}
            >
              {t(j.cle)}
            </button>
          ))}
        </div>
      </div>

      <div style={styles.bloc}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <p style={styles.blocTitre}>{t('jours_feries')}</p>
            <p style={styles.blocDescription}>
              {donnees.travaille_jours_feries ? t('feries_actif_desc') : t('feries_inactif_desc')}
            </p>
          </div>
          <Interrupteur actif={donnees.travaille_jours_feries} onClick={basculerJoursFeries} />
        </div>
      </div>

      <div style={styles.bloc}>
        <p style={styles.blocTitre}>{t('heures_max_titre')}</p>
        <p style={styles.blocDescription}>
          {t('heures_max_desc')}
        </p>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <input
            type="number" min="1" max="60"
            style={{ ...styles.jourBouton, width: 70, textAlign: 'center' }}
            value={donnees.heures_max_semaine}
            onChange={(e) => setDonnees((d) => ({ ...d, heures_max_semaine: e.target.value }))}
            onBlur={(e) => api.majParametres({ heures_max_semaine: Number(e.target.value) }).then(charger)}
          />
          <span style={{ fontSize: 13, color: 'var(--text-secondary)' }}>{t('heures_semaine_unite')}</span>
        </div>
      </div>

      <SectionExceptions donnees={donnees} onChange={charger} />

      {enregistrement && <p style={styles.enregistrement}>Enregistrement...</p>}
    </div>
  );
}

function SectionExceptions({ donnees, onChange }) {
  const { t } = useTranslation();
  const [date, setDate] = useState('');
  const [statut, setStatut] = useState('ferme');
  const [motif, setMotif] = useState('');

  async function ajouter(e) {
    e.preventDefault();
    if (!date) return;
    await api.ajouterJourExceptionnel({ date, statut, motif: motif || null });
    setDate(''); setMotif('');
    onChange();
  }

  async function supprimer(id) {
    await api.supprimerJourExceptionnel(id);
    onChange();
  }

  return (
    <div style={styles.bloc}>
      <p style={styles.blocTitre}>{t('exceptions_ponctuelles')}</p>
      <p style={styles.blocDescription}>
        {t('exceptions_desc')}
      </p>

      <form onSubmit={ajouter} style={styles.formException}>
        <input type="date" required value={date} onChange={(e) => setDate(e.target.value)} style={styles.input} />
        <select value={statut} onChange={(e) => setStatut(e.target.value)} style={styles.input}>
          <option value="ferme">{t('fermer_ce_jour')}</option>
          <option value="ouvert">{t('ouvrir_ce_jour')}</option>
        </select>
        <input placeholder={t('motif_optionnel')} value={motif} onChange={(e) => setMotif(e.target.value)} style={{ ...styles.input, flex: 1 }} />
        <button type="submit" style={styles.boutonAjouter}>{t('ajouter')}</button>
      </form>

      {donnees.exceptions.length === 0 ? (
        <p style={styles.texteAttente}>{t('aucune_exception')}</p>
      ) : (
        <div style={styles.listeExceptions}>
          {donnees.exceptions.map((ex) => (
            <div key={ex.id} style={styles.ligneException}>
              <span style={{
                ...styles.badgeException,
                background: ex.statut === 'ferme' ? 'var(--red-soft)' : 'var(--emerald-soft)',
                color: ex.statut === 'ferme' ? 'var(--red)' : 'var(--emerald)',
              }}>
                {ex.statut === 'ferme' ? t('ferme') : t('ouvert_statut')}
              </span>
              <span style={{ fontSize: 13, fontWeight: 600 }}>{formatDate(ex.date)}</span>
              {ex.motif && <span style={{ fontSize: 12.5, color: 'var(--text-secondary)' }}>{ex.motif}</span>}
              <button style={styles.boutonSupprimer} onClick={() => supprimer(ex.id)}>✕</button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function Interrupteur({ actif, onClick }) {
  return (
    <button onClick={onClick} style={{ ...styles.interrupteur, background: actif ? 'var(--emerald)' : 'var(--border)' }}>
      <span style={{ ...styles.interrupteurRond, transform: actif ? 'translateX(18px)' : 'translateX(2px)' }} />
    </button>
  );
}

function formatDate(iso) {
  const d = new Date(iso + 'T00:00:00');
  return d.toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' });
}

const styles = {
  titre: { fontSize: 26 },
  sousTitre: { color: 'var(--text-secondary)', fontSize: 14, margin: '6px 0 24px' },
  texteAttente: { color: 'var(--text-secondary)', fontSize: 13.5 },
  bloc: {
    background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 'var(--radius-md)',
    padding: 20, marginBottom: 16,
  },
  blocTitre: { fontSize: 14.5, fontWeight: 700, margin: 0 },
  blocDescription: { fontSize: 12.5, color: 'var(--text-secondary)', margin: '4px 0 14px' },
  joursGrille: { display: 'flex', gap: 6, flexWrap: 'wrap' },
  jourBouton: {
    background: 'var(--canvas)', border: '1.5px solid var(--border)', borderRadius: 8,
    padding: '8px 12px', fontSize: 12.5, fontWeight: 600, color: 'var(--text-secondary)',
  },
  jourBoutonActif: { background: 'var(--emerald-soft)', borderColor: 'var(--emerald)', color: 'var(--emerald)' },
  interrupteur: {
    width: 40, height: 22, borderRadius: 11, border: 'none', position: 'relative', flexShrink: 0, padding: 0,
    outline: 'none', boxShadow: 'none', WebkitAppearance: 'none', appearance: 'none', overflow: 'hidden',
  },
  interrupteurRond: {
    position: 'absolute', top: 2, width: 18, height: 18, borderRadius: '50%', background: 'white',
    transition: 'transform 0.15s',
  },
  formException: { display: 'flex', gap: 8, marginBottom: 14, flexWrap: 'wrap' },
  input: {
    padding: '9px 11px', borderRadius: 'var(--radius-sm)', border: '1.5px solid var(--border)',
    fontSize: 13, outline: 'none', fontFamily: 'var(--font-body)',
  },
  boutonAjouter: {
    background: 'var(--ink)', color: 'white', border: 'none', borderRadius: 'var(--radius-sm)',
    padding: '9px 16px', fontSize: 12.5, fontWeight: 700,
  },
  listeExceptions: { display: 'flex', flexDirection: 'column', gap: 6 },
  ligneException: {
    display: 'flex', alignItems: 'center', gap: 10, padding: '8px 10px',
    background: 'var(--canvas)', borderRadius: 'var(--radius-sm)',
  },
  badgeException: { fontSize: 10.5, fontWeight: 700, padding: '3px 8px', borderRadius: 5, textTransform: 'uppercase' },
  boutonSupprimer: {
    marginLeft: 'auto', background: 'none', border: 'none', color: 'var(--text-muted)', fontSize: 13, padding: 4,
  },
  enregistrement: { fontSize: 12, color: 'var(--text-muted)' },
};
