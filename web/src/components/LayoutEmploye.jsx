import { NavLink } from 'react-router-dom';
import { effacerSession } from '../lib/api';

const liens = [
  { to: '/', label: 'Missions', icon: '📋' },
  { to: '/absences', label: 'Absences', icon: '🗓️' },
  { to: '/messages', label: 'Messages', icon: '💬' },
  { to: '/profil', label: 'Profil', icon: '👤' },
];

export default function LayoutEmploye({ utilisateur, children }) {
  function deconnexion() {
    effacerSession();
    window.location.href = '/';
  }

  return (
    <div style={styles.page}>
      <header style={styles.entete}>
        <div style={styles.marque}>
          <div style={styles.logoMark}>K</div>
          <span style={styles.logoText}>Krendo</span>
        </div>
        <div style={styles.profil}>
          <div style={styles.avatar}>{utilisateur.prenom[0]}{utilisateur.nom[0]}</div>
          <button onClick={deconnexion} style={styles.deconnexion} title="Se déconnecter">⏻</button>
        </div>
      </header>

      <main style={styles.contenu}>{children}</main>

      <nav style={styles.navBas}>
        {liens.map((l) => (
          <NavLink
            key={l.to}
            to={l.to}
            end={l.to === '/'}
            style={({ isActive }) => ({ ...styles.navLien, ...(isActive ? styles.navLienActif : {}) })}
          >
            <span style={{ fontSize: 18 }}>{l.icon}</span>
            <span style={{ fontSize: 10.5, fontWeight: 600 }}>{l.label}</span>
          </NavLink>
        ))}
      </nav>
    </div>
  );
}

const styles = {
  page: { minHeight: '100vh', display: 'flex', flexDirection: 'column', paddingBottom: 64 },
  entete: {
    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
    padding: '14px 20px', background: 'var(--card)', borderBottom: '1px solid var(--border)',
    position: 'sticky', top: 0, zIndex: 10,
  },
  marque: { display: 'flex', alignItems: 'center', gap: 8 },
  logoMark: {
    width: 26, height: 26, borderRadius: 7, background: 'var(--emerald)', color: 'white',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 13,
  },
  logoText: { fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 16, color: 'var(--ink)' },
  profil: { display: 'flex', alignItems: 'center', gap: 10 },
  avatar: {
    width: 30, height: 30, borderRadius: '50%', background: 'var(--emerald-soft)', color: 'var(--emerald)',
    display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 700,
  },
  deconnexion: { background: 'none', border: 'none', color: 'var(--text-muted)', fontSize: 16, padding: 4 },
  contenu: { flex: 1, padding: '20px 16px', maxWidth: 560, width: '100%', margin: '0 auto', boxSizing: 'border-box' },
  navBas: {
    position: 'fixed', bottom: 0, left: 0, right: 0, background: 'var(--card)',
    borderTop: '1px solid var(--border)', display: 'flex', justifyContent: 'space-around', padding: '8px 0',
  },
  navLien: {
    display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3,
    color: 'var(--text-muted)', textDecoration: 'none', padding: '4px 12px', borderRadius: 10,
  },
  navLienActif: { color: 'var(--emerald)' },
};
