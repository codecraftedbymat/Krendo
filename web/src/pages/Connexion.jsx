import { useState } from 'react';
import { api, sauvegarderSession } from '../lib/api';

export default function Connexion({ onConnecte }) {
  const [mode, setMode] = useState('connexion'); // 'connexion' | 'oublie'

  return (
    <div style={styles.page}>
      <div style={styles.carte}>
        <div style={styles.marque}>
          <div style={styles.logoMark}>K</div>
          <span style={styles.logoText}>Krendo</span>
        </div>

        {mode === 'connexion' ? (
          <FormulaireConnexion onConnecte={onConnecte} onMotDePasseOublie={() => setMode('oublie')} />
        ) : (
          <FormulaireMotDePasseOublie onRetour={() => setMode('connexion')} />
        )}
      </div>
    </div>
  );
}

function FormulaireConnexion({ onConnecte, onMotDePasseOublie }) {
  const [email, setEmail] = useState('');
  const [motDePasse, setMotDePasse] = useState('');
  const [erreur, setErreur] = useState('');
  const [chargement, setChargement] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setErreur('');
    setChargement(true);
    try {
      const data = await api.connexion(email, motDePasse);
      sauvegarderSession(data.token, data.utilisateur);
      onConnecte(data.utilisateur);
    } catch (err) {
      setErreur(err.message);
    } finally {
      setChargement(false);
    }
  }

  return (
    <>
      <p style={styles.sousTitre}>Connexion à votre espace</p>

      <form onSubmit={handleSubmit} style={styles.form}>
        <label style={styles.label}>
          Adresse email
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="vous@entreprise.fr"
            required
            style={styles.input}
          />
        </label>

        <label style={styles.label}>
          Mot de passe
          <input
            type="password"
            value={motDePasse}
            onChange={(e) => setMotDePasse(e.target.value)}
            placeholder="••••••••"
            required
            style={styles.input}
          />
        </label>

        {erreur && <div style={styles.erreur}>{erreur}</div>}

        <button type="submit" disabled={chargement} style={styles.bouton}>
          {chargement ? 'Connexion...' : 'Se connecter'}
        </button>

        <button type="button" style={styles.lienDiscret} onClick={onMotDePasseOublie}>
          Mot de passe oublié ?
        </button>
      </form>

      <p style={styles.note}>
        Pas de compte ? Seul un administrateur peut vous en créer un.
      </p>
    </>
  );
}

function FormulaireMotDePasseOublie({ onRetour }) {
  const [email, setEmail] = useState('');
  const [envoye, setEnvoye] = useState(false);
  const [chargement, setChargement] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setChargement(true);
    try {
      await api.motDePasseOublie(email);
      setEnvoye(true);
    } finally {
      setChargement(false);
    }
  }

  if (envoye) {
    return (
      <>
        <p style={styles.sousTitre}>Vérifiez votre boîte mail</p>
        <p style={{ fontSize: 13.5, color: 'var(--text-secondary)', lineHeight: 1.5, marginBottom: 24 }}>
          Si un compte existe avec l'adresse <strong>{email}</strong>, un lien de réinitialisation vient de lui être envoyé. Il est valable 1 heure.
        </p>
        <button type="button" style={styles.bouton} onClick={onRetour}>Retour à la connexion</button>
      </>
    );
  }

  return (
    <>
      <p style={styles.sousTitre}>Réinitialiser votre mot de passe</p>
      <form onSubmit={handleSubmit} style={styles.form}>
        <label style={styles.label}>
          Adresse email
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="vous@entreprise.fr"
            required
            style={styles.input}
          />
        </label>
        <button type="submit" disabled={chargement} style={styles.bouton}>
          {chargement ? 'Envoi...' : 'Envoyer le lien de réinitialisation'}
        </button>
        <button type="button" style={styles.lienDiscret} onClick={onRetour}>
          Retour à la connexion
        </button>
      </form>
    </>
  );
}

const styles = {
  page: {
    minHeight: '100vh',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    background: 'var(--ink)',
    backgroundImage: 'radial-gradient(circle at 20% 20%, #2A3548 0%, #1C2536 60%)',
    padding: 24,
  },
  carte: {
    background: 'var(--card)',
    borderRadius: 'var(--radius-lg)',
    padding: '40px 36px',
    width: '100%',
    maxWidth: 380,
    boxShadow: '0 20px 60px rgba(0,0,0,0.35)',
  },
  marque: {
    display: 'flex',
    alignItems: 'center',
    gap: 10,
    marginBottom: 4,
  },
  logoMark: {
    width: 34,
    height: 34,
    borderRadius: 9,
    background: 'var(--emerald)',
    color: 'white',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontFamily: 'var(--font-display)',
    fontWeight: 800,
    fontSize: 17,
  },
  logoText: {
    fontFamily: 'var(--font-display)',
    fontWeight: 800,
    fontSize: 20,
    color: 'var(--ink)',
  },
  sousTitre: {
    color: 'var(--text-secondary)',
    fontSize: 14,
    margin: '4px 0 28px',
  },
  form: {
    display: 'flex',
    flexDirection: 'column',
    gap: 16,
  },
  label: {
    display: 'flex',
    flexDirection: 'column',
    gap: 6,
    fontSize: 13,
    fontWeight: 600,
    color: 'var(--text-primary)',
  },
  input: {
    padding: '11px 13px',
    borderRadius: 'var(--radius-sm)',
    border: '1.5px solid var(--border)',
    fontSize: 14,
    outline: 'none',
  },
  bouton: {
    marginTop: 8,
    padding: '12px',
    borderRadius: 'var(--radius-sm)',
    border: 'none',
    background: 'var(--ink)',
    color: 'white',
    fontWeight: 700,
    fontSize: 14,
  },
  lienDiscret: {
    background: 'none',
    border: 'none',
    color: 'var(--text-secondary)',
    fontSize: 12.5,
    fontWeight: 600,
    textAlign: 'center',
    textDecoration: 'underline',
  },
  erreur: {
    background: 'var(--red-soft)',
    color: 'var(--red)',
    padding: '10px 12px',
    borderRadius: 'var(--radius-sm)',
    fontSize: 13,
  },
  note: {
    marginTop: 24,
    fontSize: 12.5,
    color: 'var(--text-muted)',
    textAlign: 'center',
  },
};
