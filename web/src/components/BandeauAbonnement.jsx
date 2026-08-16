import { useEffect, useState } from 'react';
import { api } from '../lib/api';
import { useTranslation } from '../LangueContext';

export default function BandeauAbonnement({ utilisateur }) {
  const { t } = useTranslation();
  const [parametres, setParametres] = useState(null);
  const [chargement, setChargement] = useState(false);
  const [erreur, setErreur] = useState('');

  const peutGerer = utilisateur.permissions.peut_gerer_comptes || utilisateur.permissions.peut_voir_tout;

  useEffect(() => {
    api.parametres().then(setParametres).catch(() => {});
  }, []);

  if (!parametres || !peutGerer) return null;
  if (!['essai', 'suspendu'].includes(parametres.statut_abonnement) || parametres.compte_gratuit) return null;

  async function payer(plan) {
    setChargement(true);
    setErreur('');
    try {
      const { url } = await api.genererLienPaiementMonEntreprise(plan);
      window.location.href = url;
    } catch (err) {
      setErreur(err.message);
      setChargement(false);
    }
  }

  const suspendu = parametres.statut_abonnement === 'suspendu';

  return (
    <div style={{ ...styles.bandeau, ...(suspendu ? styles.bandeauSuspendu : {}) }}>
      <div style={styles.texteZone}>
        <span style={styles.titre}>
          {suspendu ? t('suspendu_titre') : t('essai_titre')}
        </span>
        <span style={styles.texte}>
          {suspendu ? t('suspendu_texte') : t('essai_texte')}
        </span>
      </div>
      <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
        <button style={styles.boutonSecondaire} onClick={() => payer('mensuel')} disabled={chargement}>
          {t('mensuel')} <span style={styles.prixSecondaire}>3€{t('par_employe')}</span>
        </button>
        <button style={styles.bouton} onClick={() => payer('annuel')} disabled={chargement}>
          {chargement ? t('redirection') : t('annuel')}
          {!chargement && <span style={styles.prix}>{t('deux_mois_offerts')}</span>}
        </button>
      </div>
      {erreur && <span style={styles.erreur}>{erreur}</span>}
    </div>
  );
}

const styles = {
  bandeau: {
    display: 'flex', alignItems: 'center', gap: 18, flexWrap: 'wrap',
    background: 'linear-gradient(90deg, #FBF1DE, #F5E6C8)', color: '#8A6416', padding: '12px 24px', fontSize: 13,
  },
  bandeauSuspendu: { background: 'linear-gradient(90deg, #FBEBEB, #F7DADA)', color: 'var(--red)' },
  texteZone: { display: 'flex', flexDirection: 'column', gap: 1, flex: 1, minWidth: 200 },
  titre: { fontWeight: 800, fontSize: 13.5 },
  texte: { fontWeight: 500, opacity: 0.9 },
  bouton: {
    display: 'flex', alignItems: 'center', gap: 8,
    background: 'var(--ink)', color: 'white', border: 'none', borderRadius: 8,
    padding: '9px 16px', fontSize: 13, fontWeight: 700, whiteSpace: 'nowrap',
  },
  boutonSecondaire: {
    display: 'flex', alignItems: 'center', gap: 6,
    background: 'white', color: 'var(--ink)', border: '1.5px solid rgba(28,37,54,0.15)', borderRadius: 8,
    padding: '9px 14px', fontSize: 13, fontWeight: 700, whiteSpace: 'nowrap',
  },
  prix: { fontSize: 10.5, fontWeight: 600, opacity: 0.75, borderLeft: '1px solid rgba(255,255,255,0.3)', paddingLeft: 8 },
  prixSecondaire: { fontSize: 10.5, fontWeight: 600, opacity: 0.6 },
  erreur: { fontSize: 11.5, color: 'var(--red)' },
};
