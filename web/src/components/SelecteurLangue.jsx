import { useTranslation } from '../LangueContext';

export default function SelecteurLangue({ sombre }) {
  const { langue, setLangue } = useTranslation();

  return (
    <div style={{ ...styles.conteneur, ...(sombre ? styles.conteneurSombre : {}) }}>
      <button
        style={{ ...styles.bouton, ...(langue === 'fr' ? (sombre ? styles.boutonActifSombre : styles.boutonActif) : {}) }}
        onClick={() => setLangue('fr')}
      >FR</button>
      <button
        style={{ ...styles.bouton, ...(langue === 'nl' ? (sombre ? styles.boutonActifSombre : styles.boutonActif) : {}) }}
        onClick={() => setLangue('nl')}
      >NL</button>
    </div>
  );
}

const styles = {
  conteneur: { display: 'flex', gap: 2, background: 'var(--canvas)', borderRadius: 7, padding: 2 },
  conteneurSombre: { background: 'rgba(255,255,255,0.08)' },
  bouton: {
    background: 'none', border: 'none', borderRadius: 5, padding: '4px 9px',
    fontSize: 11, fontWeight: 700, color: 'var(--text-muted)',
  },
  boutonActif: { background: 'white', color: 'var(--ink)', boxShadow: '0 1px 2px rgba(0,0,0,0.08)' },
  boutonActifSombre: { background: 'rgba(255,255,255,0.15)', color: 'white' },
};
