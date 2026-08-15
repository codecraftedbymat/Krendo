import { NavLink } from 'react-router-dom';
import { effacerSession } from '../lib/api';
import BandeauAbonnement from './BandeauAbonnement';
import SelecteurLangue from './SelecteurLangue';
import { useTranslation } from '../LangueContext';

const cleLiens = [
  { to: '/', cle: 'nav_missions', icon: '📋' },
  { to: '/statistiques', cle: 'nav_statistiques', icon: '📊' },
  { to: '/planning', cle: 'nav_planning', icon: '📅' },
  { to: '/heures', cle: 'nav_heures', icon: '⏱️' },
  { to: '/absences', cle: 'nav_absences', icon: '🗓️' },
  { to: '/messages', cle: 'nav_messages', icon: '💬' },
  { to: '/equipe', cle: 'nav_equipe', icon: '👥' },
];

export default function Layout({ utilisateur, children }) {
  const { t } = useTranslation();

  function deconnexion() {
    effacerSession();
    window.location.href = '/';
  }

  const peutGererComptes = utilisateur.permissions.peut_gerer_comptes || utilisateur.permissions.peut_voir_tout;
  const tousLiens = peutGererComptes ? [...cleLiens, { to: '/parametres', cle: 'nav_parametres', icon: '⚙️' }] : cleLiens;

  return (
    <div style={styles.page}>
      <aside style={styles.sidebar}>
        <div style={styles.marque}>
          <div style={styles.logoMark}>K</div>
          <span style={styles.logoText}>Krendo</span>
        </div>

        <nav style={styles.nav}>
          {tousLiens.map((l) => (
            <NavLink
              key={l.to}
              to={l.to}
              end={l.to === '/'}
              style={({ isActive }) => ({
                ...styles.navLink,
                ...(isActive ? styles.navLinkActif : {}),
              })}
            >
              <span>{l.icon}</span> {t(l.cle)}
            </NavLink>
          ))}
        </nav>

        <div style={{ padding: '0 8px 10px' }}>
          <SelecteurLangue sombre />
        </div>

        <div style={styles.profil}>
          <div style={styles.avatar}>
            {utilisateur.prenom[0]}{utilisateur.nom[0]}
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={styles.profilNom}>{utilisateur.prenom} {utilisateur.nom}</div>
            <div style={styles.profilRole}>{utilisateur.role}</div>
          </div>
          <button onClick={deconnexion} style={styles.deconnexion} title={t('deconnexion')}>⏻</button>
        </div>
      </aside>

      <main style={styles.contenuZone}>
        <BandeauAbonnement utilisateur={utilisateur} />
        <div style={styles.contenu}>{children}</div>
      </main>
    </div>
  );
}

const styles = {
  page: {
    display: 'flex',
    minHeight: '100vh',
  },
  sidebar: {
    width: 220,
    background: 'var(--ink)',
    color: 'white',
    display: 'flex',
    flexDirection: 'column',
    padding: '20px 14px',
    flexShrink: 0,
  },
  marque: {
    display: 'flex',
    alignItems: 'center',
    gap: 9,
    padding: '6px 8px 24px',
  },
  logoMark: {
    width: 28,
    height: 28,
    borderRadius: 7,
    background: 'var(--emerald)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontFamily: 'var(--font-display)',
    fontWeight: 800,
    fontSize: 14,
  },
  logoText: {
    fontFamily: 'var(--font-display)',
    fontWeight: 800,
    fontSize: 17,
  },
  nav: {
    display: 'flex',
    flexDirection: 'column',
    gap: 2,
    flex: 1,
  },
  navLink: {
    display: 'flex',
    alignItems: 'center',
    gap: 10,
    padding: '10px 12px',
    borderRadius: 'var(--radius-sm)',
    color: 'rgba(255,255,255,0.65)',
    textDecoration: 'none',
    fontSize: 14,
    fontWeight: 600,
  },
  navLinkActif: {
    background: 'rgba(255,255,255,0.08)',
    color: 'white',
  },
  profil: {
    display: 'flex',
    alignItems: 'center',
    gap: 10,
    padding: '10px 8px',
    borderTop: '1px solid rgba(255,255,255,0.1)',
  },
  avatar: {
    width: 32,
    height: 32,
    borderRadius: '50%',
    background: 'var(--emerald)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: 11,
    fontWeight: 700,
    flexShrink: 0,
  },
  profilNom: {
    fontSize: 13,
    fontWeight: 600,
    whiteSpace: 'nowrap',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
  },
  profilRole: {
    fontSize: 11,
    color: 'rgba(255,255,255,0.5)',
  },
  deconnexion: {
    background: 'none',
    border: 'none',
    color: 'rgba(255,255,255,0.5)',
    fontSize: 16,
    padding: 4,
  },
  contenuZone: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    minWidth: 0,
  },
  contenu: {
    padding: '32px 40px',
    maxWidth: 1100,
  },
};
