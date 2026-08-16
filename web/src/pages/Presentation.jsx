import { Link } from 'react-router-dom';
import { ArrowRight, ArrowUpRight, Check } from 'lucide-react';
import { useTranslation } from '../LangueContext';
import SelecteurLangue from '../components/SelecteurLangue';

export default function Presentation() {
  const { t } = useTranslation();
  return (
    <div style={styles.page}>
      <header style={styles.entete}>
        <div style={styles.marque}>
          <div style={styles.logoMark}>K</div>
          <span style={styles.logoText}>Krendo</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <SelecteurLangue />
          <Link to="/" style={styles.boutonConnexion}>{t('se_connecter')}</Link>
        </div>
      </header>

      <section style={styles.hero}>
        <div style={styles.heroGauche}>
          <p style={styles.eyebrow}>{t('vitrine_eyebrow')}</p>
          <h1 style={styles.titreHero}>
            {t('vitrine_titre1')}<br />{t('vitrine_titre2')}<br /><span style={styles.titreAccent}>{t('vitrine_titre3')}</span>
          </h1>
          <p style={styles.sousTitreHero}>
            {t('vitrine_soustitre')}
          </p>
          <div style={styles.heroCtas}>
            <Link to="/" style={styles.boutonHeroPrincipal}>
              {t('se_connecter')} <ArrowRight size={16} strokeWidth={2.5} />
            </Link>
            <a href="mailto:alainbiloba@gmail.com" style={styles.boutonHeroSecondaire}>{t('demander_demo')}</a>
          </div>
        </div>

        <div style={styles.heroDroite}>
          <div style={styles.bandeHeures}>
            {['08:00', '09:00', '10:00', '11:00', '12:00'].map((h, i) => (
              <span key={h} style={{ ...styles.heureItem, opacity: i === 2 ? 1 : 0.35 }}>{h}</span>
            ))}
          </div>
          <div style={styles.mockupCarte}>
            <div style={styles.mockupEntete}>
              <div>
                <span style={styles.mockupTitre}>{t('vitrine_mockup_titre')}</span>
                <p style={styles.mockupInfo}>{t('vitrine_mockup_lieu')}</p>
              </div>
              <span style={styles.mockupBadge}>{t('vitrine_mockup_requis')}</span>
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
                <span style={styles.mockupStatutOk}><Check size={11} strokeWidth={3} /> {t('disponible')}</span>
              </div>
              <div style={styles.mockupLigne}>
                <div style={{ ...styles.mockupAvatar, background: '#EDE9DD', color: '#8A6416' }}>ML</div>
                <span style={styles.mockupNom}>Marc Leroy</span>
                <span style={styles.mockupStatutAttente}>{t('en_attente')}</span>
              </div>
            </div>
          </div>
          <div style={styles.statFlottante}>
            <span style={styles.statNombre}>4/6</span>
            <span style={styles.statLabel}>{t('vitrine_confirmes')}</span>
          </div>
        </div>
      </section>

      <section style={styles.bandeauSemaine}>
        <div style={styles.bandeauContenu}>
          {['LUN', 'MAR', 'MER', 'JEU', 'VEN', 'SAM', 'DIM'].map((j, i) => (
            <div key={j} style={styles.jourColonne}>
              <span style={styles.jourLabel}>{j}</span>
              <span style={{ ...styles.jourNombre, color: i === 4 ? 'var(--emerald)' : 'rgba(255,255,255,0.3)' }}>
                {String(i + 1).padStart(2, '0')}
              </span>
            </div>
          ))}
        </div>
      </section>

      <section style={styles.sectionEtapes}>
        <div style={styles.enteteSection}>
          <p style={styles.eyebrowSombre}>{t('vitrine_fonctionnement')}</p>
          <h2 style={styles.titreSection}>{t('vitrine_etapes_titre')}</h2>
        </div>
        <div style={styles.listeEtapes}>
          <LigneEtape numero="01" titre={t('vitrine_etape1_titre')} texte={t('vitrine_etape1_texte')} />
          <LigneEtape numero="02" titre={t('vitrine_etape2_titre')} texte={t('vitrine_etape2_texte')} />
          <LigneEtape numero="03" titre={t('vitrine_etape3_titre')} texte={t('vitrine_etape3_texte')} />
        </div>
      </section>

      <section style={styles.sectionFonctionnalites}>
        <div style={styles.enteteSection}>
          <p style={styles.eyebrowSombre}>{t('vitrine_fonctionnalites')}</p>
          <h2 style={styles.titreSection}>{t('vitrine_fonctionnalites_titre')}</h2>
        </div>

        <LigneFonctionnalite numero="01" titre={t('vitrine_f1_titre')} texte={t('vitrine_f1_texte')} />
        <LigneFonctionnalite numero="02" titre={t('vitrine_f2_titre')} texte={t('vitrine_f2_texte')} inverse />
        <LigneFonctionnalite numero="03" titre={t('vitrine_f3_titre')} texte={t('vitrine_f3_texte')} />
        <LigneFonctionnalite numero="04" titre={t('vitrine_f4_titre')} texte={t('vitrine_f4_texte')} inverse />
      </section>

      <section style={styles.sectionCta}>
        <h2 style={styles.titreCta}>{t('vitrine_cta_titre')}</h2>
        <p style={styles.texteCta}>{t('vitrine_cta_texte')}</p>
        <a href="mailto:alainbiloba@gmail.com" style={styles.boutonCtaFinal}>
          alainbiloba@gmail.com <ArrowUpRight size={16} strokeWidth={2.5} />
        </a>
        <a href="tel:+32784805050" style={styles.lienTelephone}>{t('vitrine_appelez')} 078 480 50 50</a>
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
            <a href="tel:+32784805050" style={styles.piedLien}>078 480 50 50</a>
          </div>
        </div>
      </footer>
    </div>
  );
}

function LigneEtape({ numero, titre, texte }) {
  return (
    <div style={styles.ligneEtape}>
      <span style={styles.etapeNumero}>{numero}</span>
      <div>
        <h3 style={styles.etapeTitre}>{titre}</h3>
        <p style={styles.etapeTexte}>{texte}</p>
      </div>
    </div>
  );
}

function LigneFonctionnalite({ numero, titre, texte, inverse }) {
  return (
    <div style={{ ...styles.ligneFonctionnalite, flexDirection: inverse ? 'row-reverse' : 'row' }}>
      <span style={styles.fonctionnaliteNumero}>{numero}</span>
      <div style={styles.fonctionnaliteTexteBloc}>
        <h3 style={styles.fonctionnaliteTitre}>{titre}</h3>
        <p style={styles.fonctionnaliteTexte}>{texte}</p>
      </div>
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

  hero: {
    display: 'flex', alignItems: 'center', gap: 40, maxWidth: 1180, margin: '0 auto',
    padding: '90px 32px 100px', flexWrap: 'wrap',
  },
  heroGauche: { flex: '1 1 420px', minWidth: 320 },
  eyebrow: { fontSize: 12.5, fontWeight: 700, letterSpacing: '0.06em', color: 'var(--emerald)', margin: '0 0 20px', textTransform: 'uppercase' },
  titreHero: {
    fontSize: 52, fontFamily: 'var(--font-display)', fontWeight: 800, lineHeight: 1.08,
    margin: '0 0 26px', color: 'var(--ink)', letterSpacing: '-0.025em',
  },
  titreAccent: { color: 'var(--emerald)' },
  sousTitreHero: { fontSize: 16.5, color: 'var(--text-secondary)', lineHeight: 1.65, margin: '0 0 34px', maxWidth: 440 },
  heroCtas: { display: 'flex', gap: 12, flexWrap: 'wrap' },
  boutonHeroPrincipal: {
    display: 'flex', alignItems: 'center', gap: 8,
    background: 'var(--ink)', color: 'white', textDecoration: 'none', borderRadius: 9,
    padding: '14px 22px', fontWeight: 700, fontSize: 14.5,
  },
  boutonHeroSecondaire: {
    background: 'white', color: 'var(--ink)', textDecoration: 'none', borderRadius: 9,
    padding: '14px 22px', fontWeight: 700, fontSize: 14.5, border: '1.5px solid var(--border)',
  },

  heroDroite: { flex: '1 1 380px', minWidth: 300, position: 'relative', paddingTop: 20 },
  bandeHeures: {
    display: 'flex', gap: 18, marginBottom: 18, paddingLeft: 8,
    fontFamily: 'var(--font-mono)', fontSize: 12, fontWeight: 600, color: 'var(--text-muted)',
  },
  heureItem: {},
  mockupCarte: {
    background: 'white', borderRadius: 18, padding: 24, width: '100%', maxWidth: 400,
    boxShadow: '0 30px 70px -18px rgba(28,37,54,0.25), 0 0 0 1px rgba(28,37,54,0.04)',
    textAlign: 'left', transform: 'rotate(-1.2deg)',
  },
  mockupEntete: { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 },
  mockupTitre: { fontSize: 16, fontWeight: 700, color: 'var(--ink)', display: 'block' },
  mockupInfo: { fontSize: 12.5, color: 'var(--text-secondary)', margin: '3px 0 0' },
  mockupBadge: { fontSize: 11, fontWeight: 700, background: 'var(--canvas)', color: 'var(--text-secondary)', padding: '4px 10px', borderRadius: 6, whiteSpace: 'nowrap' },
  mockupBarre: { display: 'flex', height: 6, borderRadius: 4, overflow: 'hidden', marginBottom: 16, background: 'var(--border)' },
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
  statFlottante: {
    position: 'absolute', bottom: -10, right: 10, background: 'var(--ink)', color: 'white',
    borderRadius: 14, padding: '12px 18px', boxShadow: '0 20px 40px -12px rgba(28,37,54,0.4)',
    display: 'flex', flexDirection: 'column', alignItems: 'center', transform: 'rotate(2deg)',
  },
  statNombre: { fontFamily: 'var(--font-mono)', fontSize: 22, fontWeight: 600 },
  statLabel: { fontSize: 10, color: 'rgba(255,255,255,0.6)', marginTop: 2 },

  bandeauSemaine: { background: 'var(--ink)', padding: '26px 32px' },
  bandeauContenu: { maxWidth: 1180, margin: '0 auto', display: 'flex', justifyContent: 'space-between', gap: 8, flexWrap: 'wrap' },
  jourColonne: { display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6, flex: 1, minWidth: 40 },
  jourLabel: { fontSize: 10.5, fontWeight: 700, color: 'rgba(255,255,255,0.4)', letterSpacing: '0.05em' },
  jourNombre: { fontFamily: 'var(--font-mono)', fontSize: 20, fontWeight: 600 },

  enteteSection: { maxWidth: 1180, margin: '0 auto', padding: '0 32px', marginBottom: 40 },
  eyebrowSombre: { fontSize: 12.5, fontWeight: 700, letterSpacing: '0.06em', color: 'var(--emerald)', margin: '0 0 10px', textTransform: 'uppercase' },
  titreSection: { fontSize: 32, fontFamily: 'var(--font-display)', fontWeight: 800, margin: 0, color: 'var(--ink)', letterSpacing: '-0.02em' },

  sectionEtapes: { maxWidth: 1180, margin: '0 auto', padding: '90px 0' },
  listeEtapes: { maxWidth: 1180, margin: '0 auto', padding: '0 32px', display: 'flex', flexDirection: 'column' },
  ligneEtape: {
    display: 'flex', alignItems: 'baseline', gap: 28, padding: '26px 0', borderTop: '1px solid var(--border)',
  },
  etapeNumero: { fontFamily: 'var(--font-mono)', fontSize: 14, fontWeight: 600, color: 'var(--emerald)', flexShrink: 0, width: 30 },
  etapeTitre: { fontSize: 18, fontFamily: 'var(--font-display)', fontWeight: 700, margin: '0 0 6px', color: 'var(--ink)' },
  etapeTexte: { fontSize: 14, color: 'var(--text-secondary)', lineHeight: 1.6, margin: 0, maxWidth: 520 },

  sectionFonctionnalites: { background: 'var(--canvas)', padding: '90px 0 100px' },
  ligneFonctionnalite: {
    display: 'flex', alignItems: 'center', gap: 60, maxWidth: 1180, margin: '0 auto',
    padding: '46px 32px', flexWrap: 'wrap',
  },
  fonctionnaliteNumero: {
    fontFamily: 'var(--font-mono)', fontSize: 64, fontWeight: 600, color: 'var(--border)',
    lineHeight: 1, flexShrink: 0,
  },
  fonctionnaliteTexteBloc: { flex: '1 1 340px', minWidth: 280 },
  fonctionnaliteTitre: { fontSize: 22, fontFamily: 'var(--font-display)', fontWeight: 700, margin: '0 0 10px', color: 'var(--ink)' },
  fonctionnaliteTexte: { fontSize: 15, color: 'var(--text-secondary)', lineHeight: 1.7, margin: 0, maxWidth: 460 },

  sectionCta: { background: 'var(--ink)', padding: '100px 24px', textAlign: 'center' },
  titreCta: { fontSize: 34, fontFamily: 'var(--font-display)', fontWeight: 800, color: 'white', margin: '0 0 14px', letterSpacing: '-0.02em' },
  texteCta: { fontSize: 15, color: 'rgba(255,255,255,0.6)', margin: '0 0 30px' },
  boutonCtaFinal: {
    display: 'inline-flex', alignItems: 'center', gap: 8, background: 'var(--emerald)', color: 'white', textDecoration: 'none',
    borderRadius: 9, padding: '14px 24px', fontWeight: 700, fontSize: 15,
  },
  lienTelephone: {
    display: 'block', marginTop: 16, color: 'rgba(255,255,255,0.55)', fontSize: 13.5, textDecoration: 'none',
  },

  pied: { background: 'var(--ink)', padding: '30px 32px', borderTop: '1px solid rgba(255,255,255,0.08)' },
  piedContenu: { maxWidth: 1180, margin: '0 auto', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 16 },
  piedLiens: { display: 'flex', gap: 22 },
  piedLien: { color: 'rgba(255,255,255,0.65)', fontSize: 13, textDecoration: 'none' },
};
