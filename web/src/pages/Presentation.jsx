import { Link } from 'react-router-dom';
import {
  CalendarCheck, CalendarClock, Clock3, MessageSquareText, CalendarDays, Users,
  ArrowRight, Check,
} from 'lucide-react';

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
        <div style={styles.heroFond}>
          <div style={styles.heroGrille} />
        </div>
        <div style={styles.heroContenu}>
          <p style={styles.eyebrow}>PLANIFICATION D'ÉQUIPE — BELGIQUE</p>
          <h1 style={styles.titreHero}>La gestion de planning,<br />sans la friction.</h1>
          <p style={styles.sousTitreHero}>
            Missions, disponibilités, absences, heures et messagerie d'équipe : un seul outil,
            pensé pour les entreprises qui gèrent du personnel sur le terrain.
          </p>
          <div style={styles.heroCtas}>
            <Link to="/" style={styles.boutonHeroPrincipal}>
              Se connecter <ArrowRight size={16} strokeWidth={2.5} />
            </Link>
            <a href="mailto:alainbiloba@gmail.com" style={styles.boutonHeroSecondaire}>Demander une démo</a>
          </div>
        </div>

        <div style={styles.mockupZone}>
          <div style={styles.mockupCarte}>
            <div style={styles.mockupEntete}>
              <div>
                <span style={styles.mockupTitre}>Salon Tech Expo</span>
                <p style={styles.mockupInfo}>18 août · 08:00–18:00 · Paris Expo</p>
              </div>
              <span style={styles.mockupBadge}>6 requis</span>
            </div>
            <div style={styles.mockupStats}>
              <div style={styles.mockupStat}>
                <span style={styles.mockupStatNombre}>4</span>
                <span style={styles.mockupStatLabel}>Disponibles</span>
              </div>
              <div style={styles.mockupStatDiv} />
              <div style={styles.mockupStat}>
                <span style={{ ...styles.mockupStatNombre, color: 'var(--red)' }}>1</span>
                <span style={styles.mockupStatLabel}>Indisponible</span>
              </div>
              <div style={styles.mockupStatDiv} />
              <div style={styles.mockupStat}>
                <span style={{ ...styles.mockupStatNombre, color: 'var(--text-muted)' }}>1</span>
                <span style={styles.mockupStatLabel}>En attente</span>
              </div>
            </div>
            <div style={styles.mockupBarre}>
              <div style={{ width: '66%', background: 'var(--emerald)' }} />
              <div style={{ width: '17%', background: 'var(--red)' }} />
              <div style={{ width: '17%', background: 'var(--border)' }} />
            </div>
            <div style={styles.mockupListe}>
              <div style={styles.mockupLigne}>
                <div style={styles.mockupAvatar}>SL</div>
                <span style={styles.mockupNom}>Sofia Lambert</span>
                <span style={styles.mockupStatutOk}><Check size={11} strokeWidth={3} /> Disponible</span>
              </div>
              <div style={styles.mockupLigne}>
                <div style={{ ...styles.mockupAvatar, background: '#EDE9DD', color: '#8A6416' }}>ML</div>
                <span style={styles.mockupNom}>Marc Leroy</span>
                <span style={styles.mockupStatutAttente}>En attente</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section style={styles.sectionEtapes}>
        <p style={styles.eyebrowCentre}>FONCTIONNEMENT</p>
        <h2 style={styles.titreSection}>Trois étapes, pas plus</h2>
        <div style={styles.grilleEtapes}>
          <Etape numero="01" titre="Créez une mission" texte="Date, horaires, lieu, effectif nécessaire. Votre équipe est notifiée en un instant, par notification et par email." />
          <Etape numero="02" titre="Suivez les réponses" texte="Chaque employé confirme sa disponibilité depuis son téléphone. Vous visualisez tout en temps réel." />
          <Etape numero="03" titre="Validez les heures" texte="Créneaux, heures supplémentaires, validation en un clic, puis export direct pour la paie." />
        </div>
      </section>

      <section style={styles.section}>
        <p style={styles.eyebrowCentre}>FONCTIONNALITÉS</p>
        <h2 style={styles.titreSection}>Tout ce dont vous avez besoin</h2>
        <div style={styles.grilleFonctionnalites}>
          <Fonctionnalite Icone={CalendarCheck} titre="Gestion de missions" texte="Créez une mission, notifiez votre équipe instantanément, suivez qui est disponible." />
          <Fonctionnalite Icone={CalendarClock} titre="Absences" texte="Vos employés font leur demande, vous validez en un clic — ou déclarez une absence directement." />
          <Fonctionnalite Icone={Clock3} titre="Heures & validation" texte="Définissez les créneaux, validez les heures travaillées, exportez pour la paie." />
          <Fonctionnalite Icone={MessageSquareText} titre="Messagerie intégrée" texte="Chat interne entre admins et employés, avec pièces jointes et accusés de lecture." />
          <Fonctionnalite Icone={CalendarDays} titre="Planning partagé" texte="Une vue calendrier claire de qui travaille, où, et quand." />
          <Fonctionnalite Icone={Users} titre="Gestion d'équipe" texte="Plusieurs rôles admin avec des droits différents, comptes créés en toute sécurité." />
        </div>
      </section>

      <section style={styles.sectionA}>
        <p style={styles.eyebrowCentre}>POUR QUI</p>
        <h2 style={styles.titreSection}>Conçu pour le terrain</h2>
        <p style={styles.texteSection}>
          Krendo s'adresse aux entreprises belges qui gèrent des équipes sur le terrain — événementiel,
          restauration, commerce, services — et qui ont besoin d'un outil simple pour planifier leur
          personnel sans complexité inutile.
        </p>
      </section>

      <section style={styles.sectionCta}>
        <h2 style={{ ...styles.titreSection, color: 'white' }}>Envie d'essayer Krendo ?</h2>
        <p style={{ fontSize: 14.5, color: 'rgba(255,255,255,0.65)', margin: '0 0 28px' }}>
          Écrivez-nous, nous mettons votre entreprise en place rapidement.
        </p>
        <a href="mailto:alainbiloba@gmail.com" style={styles.boutonCtaFinal}>
          alainbiloba@gmail.com <ArrowRight size={15} strokeWidth={2.5} />
        </a>
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
      <span style={styles.etapeNumero}>{numero}</span>
      <h3 style={styles.carteTitre}>{titre}</h3>
      <p style={styles.carteTexte}>{texte}</p>
    </div>
  );
}

function Fonctionnalite({ Icone, titre, texte }) {
  return (
    <div style={styles.carte}>
      <div style={styles.iconeBadge}><Icone size={20} strokeWidth={2} color="var(--emerald)" /></div>
      <h3 style={styles.carteTitre}>{titre}</h3>
      <p style={styles.carteTexte}>{texte}</p>
    </div>
  );
}

const styles = {
  page: { minHeight: '100vh', background: 'var(--card)', overflowX: 'hidden' },
  entete: {
    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
    padding: '16px 40px', background: 'rgba(255,255,255,0.85)', backdropFilter: 'blur(10px)',
    borderBottom: '1px solid var(--border)', position: 'sticky', top: 0, zIndex: 20,
  },
  marque: { display: 'flex', alignItems: 'center', gap: 9 },
  logoMark: {
    width: 28, height: 28, borderRadius: 7, background: 'var(--ink)', color: 'white',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 14,
  },
  logoText: { fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 17, color: 'var(--ink)', letterSpacing: '-0.01em' },
  boutonConnexion: {
    background: 'var(--ink)', color: 'white', textDecoration: 'none', borderRadius: 8,
    padding: '9px 18px', fontWeight: 600, fontSize: 13.5,
  },

  hero: { position: 'relative', padding: '110px 24px 0', textAlign: 'center', overflow: 'hidden' },
  heroFond: {
    position: 'absolute', inset: 0, zIndex: 0, background: 'var(--canvas)',
  },
  heroGrille: {
    position: 'absolute', inset: 0,
    backgroundImage: 'radial-gradient(circle, #D8DCE2 1px, transparent 1px)',
    backgroundSize: '28px 28px',
    maskImage: 'radial-gradient(ellipse 60% 50% at 50% 20%, black 40%, transparent 100%)',
  },
  heroContenu: { position: 'relative', zIndex: 1, maxWidth: 700, margin: '0 auto' },
  eyebrow: {
    fontSize: 11.5, fontWeight: 700, letterSpacing: '0.08em', color: 'var(--emerald)', margin: '0 0 18px',
  },
  eyebrowCentre: {
    fontSize: 11.5, fontWeight: 700, letterSpacing: '0.08em', color: 'var(--emerald)', margin: '0 0 10px', textAlign: 'center',
  },
  titreHero: {
    fontSize: 48, fontFamily: 'var(--font-display)', fontWeight: 800, lineHeight: 1.12,
    margin: '0 0 22px', color: 'var(--ink)', letterSpacing: '-0.02em',
  },
  sousTitreHero: { fontSize: 17, color: 'var(--text-secondary)', lineHeight: 1.6, margin: '0 auto 36px', maxWidth: 560 },
  heroCtas: { display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' },
  boutonHeroPrincipal: {
    display: 'flex', alignItems: 'center', gap: 8,
    background: 'var(--ink)', color: 'white', textDecoration: 'none', borderRadius: 9,
    padding: '13px 22px', fontWeight: 700, fontSize: 14.5,
  },
  boutonHeroSecondaire: {
    background: 'white', color: 'var(--ink)', textDecoration: 'none', borderRadius: 9,
    padding: '13px 22px', fontWeight: 700, fontSize: 14.5, border: '1.5px solid var(--border)',
  },

  mockupZone: { position: 'relative', zIndex: 1, marginTop: 50, display: 'flex', justifyContent: 'center', padding: '0 20px 0' },
  mockupCarte: {
    background: 'white', borderRadius: 18, padding: 26, width: '100%', maxWidth: 420,
    boxShadow: '0 40px 90px -20px rgba(28,37,54,0.28), 0 0 0 1px rgba(28,37,54,0.04)',
    textAlign: 'left', transform: 'translateY(0)',
  },
  mockupEntete: { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 18 },
  mockupTitre: { fontSize: 16.5, fontWeight: 700, color: 'var(--ink)', display: 'block' },
  mockupInfo: { fontSize: 12.5, color: 'var(--text-secondary)', margin: '3px 0 0' },
  mockupBadge: { fontSize: 11, fontWeight: 700, background: 'var(--canvas)', color: 'var(--text-secondary)', padding: '4px 10px', borderRadius: 6, whiteSpace: 'nowrap' },
  mockupStats: { display: 'flex', alignItems: 'center', marginBottom: 14 },
  mockupStat: { display: 'flex', flexDirection: 'column', flex: 1, textAlign: 'center' },
  mockupStatNombre: { fontFamily: 'var(--font-mono)', fontSize: 20, fontWeight: 600, color: 'var(--emerald)' },
  mockupStatLabel: { fontSize: 10.5, color: 'var(--text-muted)', marginTop: 2 },
  mockupStatDiv: { width: 1, height: 28, background: 'var(--border)' },
  mockupBarre: { display: 'flex', height: 6, borderRadius: 4, overflow: 'hidden', marginBottom: 18, background: 'var(--border)' },
  mockupListe: { display: 'flex', flexDirection: 'column', gap: 8 },
  mockupLigne: { display: 'flex', alignItems: 'center', gap: 9, background: 'var(--canvas)', padding: '9px 11px', borderRadius: 10 },
  mockupAvatar: {
    width: 26, height: 26, borderRadius: '50%', background: 'var(--emerald-soft)', color: 'var(--emerald)',
    display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 9.5, fontWeight: 700, flexShrink: 0,
  },
  mockupNom: { fontSize: 12.5, fontWeight: 600, color: 'var(--ink)', flex: 1 },
  mockupStatutOk: {
    display: 'flex', alignItems: 'center', gap: 4, fontSize: 10.5, fontWeight: 700, color: 'var(--emerald)',
    background: 'var(--emerald-soft)', padding: '3px 8px', borderRadius: 5,
  },
  mockupStatutAttente: { fontSize: 10.5, fontWeight: 700, color: '#8A6416', background: '#EDE9DD', padding: '3px 8px', borderRadius: 5 },

  sectionEtapes: { maxWidth: 980, margin: '0 auto', padding: '150px 24px 90px' },
  grilleEtapes: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 32, marginTop: 44 },
  etapeCarte: { textAlign: 'left', padding: '0 4px', position: 'relative' },
  etapeNumero: {
    display: 'block', fontFamily: 'var(--font-mono)', fontSize: 13, fontWeight: 600,
    color: 'var(--emerald)', marginBottom: 14,
  },

  section: { maxWidth: 980, margin: '0 auto', padding: '20px 24px 90px' },
  sectionA: { maxWidth: 720, margin: '0 auto', padding: '20px 24px 100px', textAlign: 'center' },
  titreSection: {
    fontSize: 30, fontFamily: 'var(--font-display)', fontWeight: 800, textAlign: 'center',
    margin: '0 0 12px', color: 'var(--ink)', letterSpacing: '-0.015em',
  },
  texteSection: { fontSize: 15.5, color: 'var(--text-secondary)', lineHeight: 1.75, marginTop: 20 },
  grilleFonctionnalites: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(270px, 1fr))', gap: 18, marginTop: 44 },
  carte: {
    background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 16, padding: 26,
  },
  iconeBadge: {
    width: 42, height: 42, borderRadius: 11, background: 'var(--emerald-soft)',
    display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 16,
  },
  carteTitre: { fontSize: 15.5, fontFamily: 'var(--font-display)', fontWeight: 700, margin: '0 0 8px', color: 'var(--ink)' },
  carteTexte: { fontSize: 13.5, color: 'var(--text-secondary)', lineHeight: 1.65, margin: 0 },

  sectionCta: { background: 'var(--ink)', padding: '90px 24px', textAlign: 'center' },
  boutonCtaFinal: {
    display: 'inline-flex', alignItems: 'center', gap: 8, background: 'var(--emerald)', color: 'white', textDecoration: 'none',
    borderRadius: 9, padding: '13px 24px', fontWeight: 700, fontSize: 14.5,
  },

  pied: { background: 'var(--ink)', padding: '30px 24px', borderTop: '1px solid rgba(255,255,255,0.08)' },
  piedContenu: { maxWidth: 980, margin: '0 auto', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 16 },
  piedLiens: { display: 'flex', gap: 22 },
  piedLien: { color: 'rgba(255,255,255,0.65)', fontSize: 13, textDecoration: 'none' },
};
