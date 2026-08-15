import { useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { api } from '../lib/api';

export default function Reinitialiser() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const token = searchParams.get('token');

  const [motDePasse, setMotDePasse] = useState('');
  const [confirmation, setConfirmation] = useState('');
  const [erreur, setErreur] = useState('');
  const [chargement, setChargement] = useState(false);
  const [reussi, setReussi] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setErreur('');
    if (motDePasse.length < 6) {
      setErreur('Le mot de passe doit contenir au moins 6 caractères.');
      return;
    }
    if (motDePasse !== confirmation) {
      setErreur('Les deux mots de passe ne correspondent pas.');
      return;
    }
    setChargement(true);
    try {
      await api.reinitialiserMotDePasse(token, motDePasse);
      setReussi(true);
      setTimeout(() => navigate('/'), 2000);
    } catch (err) {
      setErreur(err.message);
    } finally {
      setChargement(false);
    }
  }

  if (!token) {
    return (
      <div style={styles.page}>
        <div style={styles.carte}>
          <div style={styles.marque}>
            <div style={styles.logoMark}>K</div>
            <span style={styles.logoText}>Krendo</span>
          </div>
          <p style={styles.erreur}>Ce lien est invalide. Refaites une demande de réinitialisation depuis l'écran de connexion.</p>
        </div>
      </div>
    );
  }

  return (
    <div style={styles.page}>
      <div style={styles.carte}>
        <div style={styles.marque}>
          <div style={styles.logoMark}>K</div>
          <span style={styles.logoText}>Krendo</span>
        </div>

        {reussi ? (
          <>
            <p style={styles.sousTitre}>Mot de passe mis à jour</p>
            <p style={{ fontSize: 13.5, color: 'var(--text-secondary)' }}>Redirection vers la connexion...</p>
          </>
        ) : (
          <>
            <p style={styles.sousTitre}>Choisissez un nouveau mot de passe</p>
            <form onSubmit={handleSubmit} style={styles.form}>
              <label style={styles.label}>
                Nouveau mot de passe
                <input
                  type="password"
                  value={motDePasse}
                  onChange={(e) => setMotDePasse(e.target.value)}
                  placeholder="Au moins 6 caractères"
                  required
                  style={styles.input}
                />
              </label>
              <label style={styles.label}>
                Confirmer le mot de passe
                <input
                  type="password"
                  value={confirmation}
                  onChange={(e) => setConfirmation(e.target.value)}
                  required
                  style={styles.input}
                />
              </label>

              {erreur && <div style={styles.erreur}>{erreur}</div>}

              <button type="submit" disabled={chargement} style={styles.bouton}>
                {chargement ? 'Enregistrement...' : 'Réinitialiser mon mot de passe'}
              </button>
            </form>
          </>
        )}
      </div>
    </div>
  );
}

const styles = {
  page: {
    minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center',
    background: 'var(--ink)', backgroundImage: 'radial-gradient(circle at 20% 20%, #2A3548 0%, #1C2536 60%)', padding: 24,
  },
  carte: {
    background: 'var(--card)', borderRadius: 'var(--radius-lg)', padding: '40px 36px',
    width: '100%', maxWidth: 380, boxShadow: '0 20px 60px rgba(0,0,0,0.35)',
  },
  marque: { display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4 },
  logoMark: {
    width: 34, height: 34, borderRadius: 9, background: 'var(--emerald)', color: 'white',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 17,
  },
  logoText: { fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 20, color: 'var(--ink)' },
  sousTitre: { color: 'var(--text-secondary)', fontSize: 14, margin: '20px 0 24px' },
  form: { display: 'flex', flexDirection: 'column', gap: 16 },
  label: { display: 'flex', flexDirection: 'column', gap: 6, fontSize: 13, fontWeight: 600, color: 'var(--text-primary)' },
  input: { padding: '11px 13px', borderRadius: 'var(--radius-sm)', border: '1.5px solid var(--border)', fontSize: 14, outline: 'none' },
  bouton: {
    marginTop: 8, padding: '12px', borderRadius: 'var(--radius-sm)', border: 'none',
    background: 'var(--ink)', color: 'white', fontWeight: 700, fontSize: 14,
  },
  erreur: { background: 'var(--red-soft)', color: 'var(--red)', padding: '10px 12px', borderRadius: 'var(--radius-sm)', fontSize: 13 },
};
