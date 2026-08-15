import { useEffect, useState } from 'react';
import { api } from '../lib/api';

export default function BandeauAbonnement({ utilisateur }) {
  const [parametres, setParametres] = useState(null);
  const [chargement, setChargement] = useState(false);
  const [erreur, setErreur] = useState('');

  const peutGerer = utilisateur.permissions.peut_gerer_comptes || utilisateur.permissions.peut_voir_tout;

  useEffect(() => {
    api.parametres().then(setParametres).catch(() => {});
  }, []);

  if (!parametres || !peutGerer) return null;
  if (!['essai', 'suspendu'].includes(parametres.statut_abonnement) || parametres.compte_gratuit) return null;

  async function payer() {
    setChargement(true);
    setErreur('');
    try {
      const { url } = await api.genererLienPaiementMonEntreprise();
      window.location.href = url;
    } catch (err) {
      setErreur(err.message);
      setChargement(false);
    }
  }

  const suspendu = parametres.statut_abonnement === 'suspendu';

  return (
    <div style={{ ...styles.bandeau, ...(suspendu ? styles.bandeauSuspendu : {}) }}>
      <span style={styles.texte}>
        {suspendu
          ? "Votre abonnement est suspendu. Réactivez-le pour retrouver l'accès complet."
          : "Vous êtes en période d'essai. Passez à l'abonnement pour continuer sans interruption."}
      </span>
      <button style={styles.bouton} onClick={payer} disabled={chargement}>
        {chargement ? 'Redirection...' : "S'abonner (3€ / employé actif / mois)"}
      </button>
      {erreur && <span style={styles.erreur}>{erreur}</span>}
    </div>
  );
}

const styles = {
  bandeau: {
    display: 'flex', alignItems: 'center', gap: 14, flexWrap: 'wrap',
    background: 'var(--amber-soft)', color: '#8A6416', padding: '10px 20px', fontSize: 13,
  },
  bandeauSuspendu: { background: 'var(--red-soft)', color: 'var(--red)' },
  texte: { flex: 1, fontWeight: 600 },
  bouton: {
    background: 'var(--ink)', color: 'white', border: 'none', borderRadius: 7,
    padding: '7px 14px', fontSize: 12.5, fontWeight: 700, whiteSpace: 'nowrap',
  },
  erreur: { fontSize: 11.5, color: 'var(--red)' },
};
