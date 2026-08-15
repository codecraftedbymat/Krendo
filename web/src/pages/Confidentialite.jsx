import { Link } from 'react-router-dom';

export default function Confidentialite() {
  return (
    <div style={styles.page}>
      <div style={styles.contenu}>
        <Link to="/" style={styles.retour}>← Retour</Link>
        <h1 style={styles.titre}>Politique de confidentialité</h1>
        <p style={styles.avertissement}>
          ⚠️ Ce document est un modèle générique fourni à titre indicatif, à faire relire par un professionnel
          (avocat ou DPO) avant mise en production, notamment pour désigner précisément le responsable de
          traitement, la base légale exacte de chaque traitement, et la durée de conservation adaptée à votre
          secteur d'activité.
        </p>

        <Section titre="1. Responsable de traitement">
          Le responsable du traitement des données personnelles collectées via Krendo est [à compléter : nom de
          la société éditrice de Krendo, adresse, numéro d'entreprise]. Pour toute question relative à vos
          données, contactez [adresse email à définir].
        </Section>

        <Section titre="2. Données collectées">
          Dans le cadre de l'utilisation du Service par une entreprise cliente, Krendo traite les données
          suivantes concernant les employés de cette entreprise : nom, prénom, adresse email, mot de passe
          (chiffré), historique de missions et de disponibilités, demandes d'absence, heures travaillées,
          messages échangés via la messagerie interne, et pièces jointes éventuellement partagées.
        </Section>

        <Section titre="3. Finalités du traitement">
          Ces données sont traitées dans le but exclusif d'assurer le fonctionnement du Service : gestion des
          plannings, communication d'équipe, suivi des heures et des absences. Elles ne sont ni vendues, ni
          utilisées à des fins publicitaires, ni partagées avec des tiers en dehors des sous-traitants
          techniques nécessaires au fonctionnement du Service (hébergement, envoi d'emails).
        </Section>

        <Section titre="4. Sous-traitants et hébergement">
          Les données sont hébergées chez Railway (hébergement infrastructure) et les emails transactionnels
          sont envoyés via Brevo. Ces prestataires agissent en tant que sous-traitants au sens du RGPD et
          présentent des garanties de sécurité appropriées.
        </Section>

        <Section titre="5. Durée de conservation">
          Les données sont conservées pendant toute la durée de la relation contractuelle avec l'entreprise
          cliente, puis archivées ou supprimées selon les obligations légales applicables (notamment en matière
          de droit du travail) après résiliation.
        </Section>

        <Section titre="6. Vos droits">
          Conformément au RGPD, toute personne dont les données sont traitées dispose d'un droit d'accès, de
          rectification, d'effacement, de limitation, d'opposition et de portabilité de ses données. Ces demandes
          doivent être adressées à l'administrateur de votre entreprise, qui pourra les relayer si nécessaire,
          ou directement à [adresse email à définir].
        </Section>

        <Section titre="7. Sécurité">
          Krendo met en œuvre des mesures techniques raisonnables pour protéger les données : mots de passe
          chiffrés, connexions sécurisées (HTTPS), limitation des tentatives de connexion, séparation stricte
          des données entre entreprises clientes.
        </Section>

        <Section titre="8. Cookies">
          Krendo utilise uniquement des cookies techniques strictement nécessaires au fonctionnement du Service
          (maintien de la session de connexion). Aucun cookie publicitaire ou de traçage tiers n'est utilisé.
        </Section>

        <p style={styles.dateMaj}>Dernière mise à jour : à compléter avant mise en production.</p>
      </div>
    </div>
  );
}

function Section({ titre, children }) {
  return (
    <div style={styles.section}>
      <h2 style={styles.sousTitre}>{titre}</h2>
      <p style={styles.texte}>{children}</p>
    </div>
  );
}

const styles = {
  page: { minHeight: '100vh', background: 'var(--canvas)', padding: '40px 20px' },
  contenu: { maxWidth: 720, margin: '0 auto' },
  retour: { fontSize: 13, color: 'var(--text-secondary)', textDecoration: 'none', fontWeight: 600 },
  titre: { fontSize: 26, fontFamily: 'var(--font-display)', fontWeight: 800, margin: '20px 0 16px' },
  avertissement: {
    background: 'var(--amber-soft)', color: '#8A6416', padding: '14px 16px', borderRadius: 'var(--radius-md)',
    fontSize: 13, lineHeight: 1.5, marginBottom: 28,
  },
  section: { marginBottom: 22 },
  sousTitre: { fontSize: 15, fontFamily: 'var(--font-display)', fontWeight: 700, marginBottom: 8 },
  texte: { fontSize: 13.5, lineHeight: 1.7, color: 'var(--text-primary)', margin: 0 },
  dateMaj: { fontSize: 12, color: 'var(--text-muted)', marginTop: 32 },
};
