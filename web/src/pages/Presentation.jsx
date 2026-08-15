import { Link } from 'react-router-dom';

export default function Presentation() {
  return (
    <div style={styles.page}>
      <header style={styles.entete}>
        <div style={styles.marque}>
          <div style={styles.logoMark}>K</div>
          <span style={styles.logoText}>Krendo</span>
        </div>
        <Link to="/" style={styles.boutonConnexion}>Se connecter</Link>
      </header>

      <section style={styles.hero}>
        <h1 style={styles.titreHero}>La gestion de planning, simplifiée pour vos équipes.</h1>
        <p style={styles.sousTitreHero}>
          Krendo est un logiciel de gestion de planning et de personnel pour les entreprises belges :
          missions, disponibilités, absences, heures et messagerie interne, réunis dans un seul outil.
        </p>
      </section>

      <section style={styles.section}>
        <h2 style={styles.titreSection}>Ce que propose Krendo</h2>
        <div style={styles.grilleFonctionnalites}>
          <Fonctionnalite icone="📋" titre="Gestion de missions" texte="Créez une mission, notifiez votre équipe instantanément, suivez qui est disponible." />
          <Fonctionnalite icone="🗓️" titre="Absences" texte="Vos employés font leur demande, vous validez en un clic — ou déclarez une absence directement." />
          <Fonctionnalite icone="⏱️" titre="Heures & validation" texte="Définissez les créneaux, validez les heures travaillées, exportez pour la paie." />
          <Fonctionnalite icone="💬" titre="Messagerie intégrée" texte="Chat interne entre admins et employés, avec pièces jointes et accusés de lecture." />
          <Fonctionnalite icone="📅" titre="Planning partagé" texte="Une vue calendrier claire de qui travaille, où, et quand." />
          <Fonctionnalite icone="👥" titre="Gestion d'équipe" texte="Plusieurs rôles admin avec des droits différents, comptes créés en toute sécurité." />
        </div>
      </section>

      <section style={styles.sectionA}>
        <h2 style={styles.titreSection}>Pour qui ?</h2>
        <p style={styles.texteSection}>
          Krendo s'adresse aux entreprises belges qui gèrent des équipes sur le terrain — événementiel,
          restauration, commerce, services — et qui ont besoin d'un outil simple pour planifier leur
          personnel sans complexité inutile.
        </p>
      </section>

      <footer style={styles.pied}>
        <div style={styles.piedContenu}>
          <div style={styles.marque}>
            <div style={styles.logoMark}>K</div>
            <span style={styles.logoText}>Krendo</span>
          </div>
          <div style={styles.piedLiens}>
            <Link to="/cgu" style={styles.piedLien}>CGU</Link>
            <Link to="/confidentialite" style={styles.piedLien}>Confidentialité</Link>
            <a href="mailto:contact@krendo.app" style={styles.piedLien}>contact@krendo.app</a>
          </div>
        </div>
      </footer>
    </div>
  );
}

function Fonctionnalite({ icone, titre, texte }) {
  return (
    <div style={styles.carte}>
      <div style={styles.icone}>{icone}</div>
      <h3 style={styles.carteTitre}>{titre}</h3>
      <p style={styles.carteTexte}>{texte}</p>
    </div>
  );
}

const styles = {
  page: { minHeight: '100vh', background: 'var(--canvas)' },
  entete: {
    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
    padding: '18px 32px', background: 'var(--card)', borderBottom: '1px solid var(--border)',
  },
  marque: { display: 'flex', alignItems: 'center', gap: 9 },
  logoMark: {
    width: 30, height: 30, borderRadius: 8, background: 'var(--emerald)', color: 'white',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 15,
  },
  logoText: { fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 18, color: 'var(--ink)' },
  boutonConnexion: {
    background: 'var(--ink)', color: 'white', textDecoration: 'none', borderRadius: 'var(--radius-sm)',
    padding: '9px 16px', fontWeight: 700, fontSize: 13.5,
  },
  hero: { maxWidth: 720, margin: '0 auto', padding: '80px 24px 60px', textAlign: 'center' },
  titreHero: { fontSize: 34, fontFamily: 'var(--font-display)', fontWeight: 800, lineHeight: 1.25, margin: '0 0 18px', color: 'var(--ink)' },
  sousTitreHero: { fontSize: 16, color: 'var(--text-secondary)', lineHeight: 1.6, margin: 0 },
  section: { maxWidth: 960, margin: '0 auto', padding: '20px 24px 70px' },
  sectionA: { maxWidth: 720, margin: '0 auto', padding: '20px 24px 80px', textAlign: 'center' },
  titreSection: { fontSize: 24, fontFamily: 'var(--font-display)', fontWeight: 800, textAlign: 'center', margin: '0 0 36px', color: 'var(--ink)' },
  texteSection: { fontSize: 15, color: 'var(--text-secondary)', lineHeight: 1.7 },
  grilleFonctionnalites: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: 16 },
  carte: { background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 'var(--radius-lg)', padding: 22 },
  icone: { fontSize: 26, marginBottom: 10 },
  carteTitre: { fontSize: 15.5, fontFamily: 'var(--font-display)', fontWeight: 700, margin: '0 0 8px', color: 'var(--ink)' },
  carteTexte: { fontSize: 13.5, color: 'var(--text-secondary)', lineHeight: 1.6, margin: 0 },
  pied: { background: 'var(--ink)', padding: '28px 24px' },
  piedContenu: { maxWidth: 960, margin: '0 auto', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 16 },
  piedLiens: { display: 'flex', gap: 20 },
  piedLien: { color: 'rgba(255,255,255,0.7)', fontSize: 13, textDecoration: 'none' },
};
