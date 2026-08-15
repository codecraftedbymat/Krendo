import { useState } from 'react';
import { api } from '../../lib/api';

export default function Profil({ utilisateur }) {
  const [actuel, setActuel] = useState('');
  const [nouveau, setNouveau] = useState('');
  const [confirmation, setConfirmation] = useState('');
  const [erreur, setErreur] = useState('');
  const [succes, setSucces] = useState(false);
  const [envoi, setEnvoi] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setErreur('');
    setSucces(false);
    if (nouveau !== confirmation) {
      setErreur('Les deux mots de passe ne correspondent pas.');
      return;
    }
    setEnvoi(true);
    try {
      await api.changerMonMotDePasse(actuel, nouveau);
      setSucces(true);
      setActuel(''); setNouveau(''); setConfirmation('');
    } catch (err) {
      setErreur(err.message);
    } finally {
      setEnvoi(false);
    }
  }

  return (
    <div>
      <h1 style={styles.titre}>Profil</h1>

      <div style={styles.carteInfo}>
        <div style={styles.avatar}>{utilisateur.prenom[0]}{utilisateur.nom[0]}</div>
        <div>
          <div style={{ fontSize: 16, fontWeight: 700 }}>{utilisateur.prenom} {utilisateur.nom}</div>
          <div style={{ fontSize: 13, color: 'var(--text-secondary)' }}>{utilisateur.email}</div>
          <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 2 }}>{utilisateur.role}</div>
        </div>
      </div>

      <p style={styles.sectionLabel}>Changer mon mot de passe</p>
      <form onSubmit={handleSubmit} style={styles.form}>
        <label style={styles.champLabel}>
          <span style={styles.champTexte}>Mot de passe actuel</span>
          <input required type="password" style={styles.input} value={actuel} onChange={(e) => setActuel(e.target.value)} />
        </label>
        <label style={styles.champLabel}>
          <span style={styles.champTexte}>Nouveau mot de passe</span>
          <input required type="password" style={styles.input} value={nouveau} onChange={(e) => setNouveau(e.target.value)} placeholder="Au moins 6 caractères" />
        </label>
        <label style={styles.champLabel}>
          <span style={styles.champTexte}>Confirmer</span>
          <input required type="password" style={styles.input} value={confirmation} onChange={(e) => setConfirmation(e.target.value)} />
        </label>

        {erreur && <div style={styles.erreur}>{erreur}</div>}
        {succes && <div style={styles.succes}>Mot de passe mis à jour.</div>}

        <button type="submit" disabled={envoi} style={styles.bouton}>
          {envoi ? 'Enregistrement...' : 'Mettre à jour le mot de passe'}
        </button>
      </form>
    </div>
  );
}

const styles = {
  titre: { fontSize: 22, fontFamily: 'var(--font-display)', fontWeight: 800, marginBottom: 16 },
  carteInfo: {
    display: 'flex', alignItems: 'center', gap: 14, background: 'var(--card)',
    border: '1px solid var(--border)', borderRadius: 'var(--radius-md)', padding: 16, marginBottom: 24,
  },
  avatar: {
    width: 48, height: 48, borderRadius: '50%', background: 'var(--emerald-soft)', color: 'var(--emerald)',
    display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16, fontWeight: 700, flexShrink: 0,
  },
  sectionLabel: { fontSize: 12, fontWeight: 700, color: 'var(--text-secondary)', marginBottom: 10 },
  form: { display: 'flex', flexDirection: 'column', gap: 12 },
  champLabel: { display: 'flex', flexDirection: 'column', gap: 5 },
  champTexte: { fontSize: 12, fontWeight: 600, color: 'var(--text-secondary)' },
  input: {
    padding: '10px 12px', borderRadius: 'var(--radius-sm)', border: '1.5px solid var(--border)',
    fontSize: 13.5, outline: 'none', width: '100%', boxSizing: 'border-box',
  },
  bouton: {
    background: 'var(--ink)', color: 'white', border: 'none', borderRadius: 'var(--radius-sm)',
    padding: '12px', fontWeight: 700, fontSize: 13.5, marginTop: 6,
  },
  erreur: { background: 'var(--red-soft)', color: 'var(--red)', padding: '10px 12px', borderRadius: 'var(--radius-sm)', fontSize: 13 },
  succes: { background: 'var(--emerald-soft)', color: 'var(--emerald)', padding: '10px 12px', borderRadius: 'var(--radius-sm)', fontSize: 13 },
};
