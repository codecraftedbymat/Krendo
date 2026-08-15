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
        <div style={styles.heroFond} />
        <div style={styles.heroContenu}>
          <span style={styles.badge}>🇧🇪 Conçu pour les entreprises belges</span>
          <h1 style={styles.titreHero}>La gestion de planning, enfin simple pour vos équipes.</h1>
          <p style={styles.sousTitreHero}>
            Missions, disponibilités, absences, heures et messagerie interne — Krendo réunit tout ce dont
            votre entreprise a besoin pour planifier son personnel, dans un seul outil clair et rapide.
          </p>
          <div style={styles.heroCtas}>
            <Link to="/" style={styles.boutonHeroPrincipal}>Se connecter à mon espace</Link>
            <a href="mailto:alainbiloba@gmail.com" style={styles.boutonHeroSecondaire}>Demander une démo</a>
          </div>
        </div>

        <div style={styles.mockup}>
          <div style={styles.mockupCarte}>
            <div style={styles.mockupEntete}>
              <span style={styles.mockupTitre}>Salon Tech Expo</span>
              <span style={styles.mockupBadge}>6 pers.</span>
            </div>
            <p style={styles.mockupInfo}>18 août · 08:00–18:00 · Paris Expo</p>
            <div style={styles.mockupBarre}>
              <div style={{ width: '60%', background: 'var(--emerald)' }} />
              <div style={{ width: '15%', background: 'var(--red)' }} />
              <div style={{ width: '25%', background: 'var(--border)' }} />
            </div>
            <div style={styles.mockupLigne}>
              <div style={styles.mockupAvatar}>SL</div>
              <span style={styles.mockupNom}>Sofia Lambert</span>
              <span style={styles.mockupStatutOk}>Disponible</span>
            </div>
            <div style={styles.mockupLigne}>
              <div style={{ ...styles.mockupAvatar, background: 'var(--amber-soft)', color: 'var(--amber)' }}>ML</div>
              <span style={styles.mockupNom}>Marc Leroy</span>
              <span style={styles.mockupStatutAttente}>En attente</span>
            </div>
          </div>
        </div>
      </section>

      <section style={styles.sectionEtapes}>
        <h2 style={styles.titreSection}>Comment ça marche</h2>
        <div style={styles.grilleEtapes}>
          <Etape numero="1" titre="Créez une mission" texte="Date, horaires, lieu, effectif nécessaire — votre équipe est notifiée instantanément." />
          <Etape numero="2" titre="Suivez les réponses" texte="Chaque employé confirme sa disponibilité. Vous voyez tout d'un coup d'œil." />
          <Etape numero="3" titre="Validez les heures" texte="Créneaux, heures supplémentaires, validation — puis export pour la paie." />
        </div>
      </section>

      <section style={styles.section}>
        <h2 style={styles.titreSection}>Tout ce dont vous avez besoin</h2>
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

      <section style={styles.sectionCta}>
        <h2 style={{ ...styles.titreSection, color: 'white' }}>Envie d'essayer Krendo ?</h2>
        <p style={{ fontSize: 14.5, color: 'rgba(255,255,255,0.75)', margin: '0 0 24px' }}>
          Écrivez-nous, nous mettons votre entreprise en place rapidement.
        </p>
        <a href="mailto:alainbiloba@gmail.com" style={styles.boutonCtaFinal}>alainbiloba@gmail.com</a>
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
            <a href="mailto:alainbiloba@gmail.com" style={styles.piedLien}>alainbiloba@gmail.com</a>
          </div>
        </div>
      </footer>
    </div>
  );
}

function Etape({ numero, titre, texte }) {
  return (
    <div style={styles.etapeCarte}>
      <div style={styles.etapeNumero}>{numero}</div>
      <h3 style={styles.carteTitre}>{titre}</h3>
      <p style={styles.carteTexte}>{texte}</p>
    </div>
  );
}

function Fonctionnalite({ icone, titre, texte }) {
  return (
    <div style={styles.carte}>
      <div style={styles.iconeBadge}>{icone}</div>
      <h3 style={styles.carteTitre}>{titre}</h3>
      <p style={styles.carteTexte}>{texte}</p>
    </div>
  );
}

const styles = {
  page: { minHeight: '100vh', background: 'var(--canvas)', overflowX: 'hidden' },
  entete: {
    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
    padding: '18px 32px', background: 'var(--card)', borderBottom: '1px solid var(--border)',
    position: 'sticky', top: 0, zIndex: 20,
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

  hero: { position: 'relative', padding: '90px 24px 140px', textAlign: 'center', overflow: 'hidden' },
  heroFond: {
    position: 'absolute', inset: 0, zIndex: 0,
    background: 'var(--ink)',
    backgroundImage: 'radial-gradient(circle at 30% 20%, #2A3548 0%, #1C2536 55%)',
  },
  heroContenu: { position: 'relative', zIndex: 1, maxWidth: 680, margin: '0 auto' },
  badge: {
    display: 'inline-block', background: 'rgba(255,255,255,0.1)', color: 'white',
    fontSize: 12.5, fontWeight: 600, padding: '6px 14px', borderRadius: 20, marginBottom: 22,
  },
  titreHero: { fontSize: 38, fontFamily: 'var(--font-display)', fontWeight: 800, lineHeight: 1.2, margin: '0 0 18px', color: 'white' },
  sousTitreHero: { fontSize: 16, color: 'rgba(255,255,255,0.75)', lineHeight: 1.6, margin: '0 0 32px' },
  heroCtas: { display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' },
  boutonHeroPrincipal: {
    background: 'var(--emerald)', color: 'white', textDecoration: 'none', borderRadius: 'var(--radius-sm)',
    padding: '13px 22px', fontWeight: 700, fontSize: 14.5,
  },
  boutonHeroSecondaire: {
    background: 'rgba(255,255,255,0.08)', color: 'white', textDecoration: 'none', borderRadius: 'var(--radius-sm)',
    padding: '13px 22px', fontWeight: 700, fontSize: 14.5, border: '1px solid rgba(255,255,255,0.2)',
  },

  mockup: { position: 'relative', zIndex: 1, marginTop: -90, display: 'flex', justifyContent: 'center', padding: '0 20px' },
  mockupCarte: {
    background: 'var(--card)', borderRadius: 'var(--radius-lg)', padding: 22, width: '100%', maxWidth: 380,
    boxShadow: '0 30px 70px rgba(0,0,0,0.35)', textAlign: 'left',
  },
  mockupEntete: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 },
  mockupTitre: { fontSize: 15, fontWeight: 700, color: 'var(--ink)' },
  mockupBadge: { fontSize: 11, fontWeight: 700, background: 'var(--canvas)', color: 'var(--text-secondary)', padding: '3px 9px', borderRadius: 6 },
  mockupInfo: { fontSize: 12.5, color: 'var(--text-secondary)', margin: '0 0 14px' },
  mockupBarre: { display: 'flex', height: 7, borderRadius: 4, overflow: 'hidden', marginBottom: 16, background: 'var(--border)' },
  mockupLigne: { display: 'flex', alignItems: 'center', gap: 9, padding: '8px 0' },
  mockupAvatar: {
    width: 26, height: 26, borderRadius: '50%', background: 'var(--emerald-soft)', color: 'var(--emerald)',
    display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 9.5, fontWeight: 700, flexShrink: 0,
  },
  mockupNom: { fontSize: 12.5, fontWeight: 600, color: 'var(--ink)', flex: 1 },
  mockupStatutOk: { fontSize: 10.5, fontWeight: 700, color: 'var(--emerald)', background: 'var(--emerald-soft)', padding: '3px 8px', borderRadius: 5 },
  mockupStatutAttente: { fontSize: 10.5, fontWeight: 700, color: 'var(--amber)', background: 'var(--amber-soft)', padding: '3px 8px', borderRadius: 5 },

  sectionEtapes: { maxWidth: 960, margin: '0 auto', padding: '140px 24px 70px' },
  grilleEtapes: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 20 },
  etapeCarte: { textAlign: 'center', padding: '0 10px' },
  etapeNumero: {
    width: 40, height: 40, borderRadius: '50%', background: 'var(--ink)', color: 'white',
    display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'var(--font-display)',
    fontWeight: 800, fontSize: 16, margin: '0 auto 14px',
  },

  section: { maxWidth: 960, margin: '0 auto', padding: '20px 24px 70px' },
  sectionA: { maxWidth: 720, margin: '0 auto', padding: '20px 24px 80px', textAlign: 'center' },
  titreSection: { fontSize: 26, fontFamily: 'var(--font-display)', fontWeight: 800, textAlign: 'center', margin: '0 0 36px', color: 'var(--ink)' },
  texteSection: { fontSize: 15, color: 'var(--text-secondary)', lineHeight: 1.7 },
  grilleFonctionnalites: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: 16 },
  carte: {
    background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 'var(--radius-lg)', padding: 24,
    transition: 'transform 0.15s',
  },
  iconeBadge: {
    width: 44, height: 44, borderRadius: 12, background: 'var(--emerald-soft)',
    display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20, marginBottom: 14,
  },
  carteTitre: { fontSize: 15.5, fontFamily: 'var(--font-display)', fontWeight: 700, margin: '0 0 8px', color: 'var(--ink)' },
  carteTexte: { fontSize: 13.5, color: 'var(--text-secondary)', lineHeight: 1.6, margin: 0 },

  sectionCta: { background: 'var(--ink)', padding: '70px 24px', textAlign: 'center' },
  boutonCtaFinal: {
    display: 'inline-block', background: 'var(--emerald)', color: 'white', textDecoration: 'none',
    borderRadius: 'var(--radius-sm)', padding: '13px 24px', fontWeight: 700, fontSize: 14.5,
  },

  pied: { background: 'var(--ink)', padding: '28px 24px', borderTop: '1px solid rgba(255,255,255,0.08)' },
  piedContenu: { maxWidth: 960, margin: '0 auto', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 16 },
  piedLiens: { display: 'flex', gap: 20 },
  piedLien: { color: 'rgba(255,255,255,0.7)', fontSize: 13, textDecoration: 'none' },
};
