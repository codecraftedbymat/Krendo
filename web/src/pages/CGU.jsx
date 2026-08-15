import { Link } from 'react-router-dom';

export default function CGU() {
  return (
    <div style={styles.page}>
      <div style={styles.contenu}>
        <Link to="/" style={styles.retour}>← Retour</Link>
        <h1 style={styles.titre}>Conditions Générales d'Utilisation</h1>
        <p style={styles.avertissement}>
          ⚠️ Ce document est un modèle générique fourni à titre indicatif. Il ne constitue pas un avis juridique.
          Avant toute mise en service commerciale, faites-le relire et adapter par un avocat spécialisé en droit
          du numérique / droit du travail belge, notamment pour les clauses spécifiques à la gestion du personnel.
        </p>

        <Section titre="1. Objet">
          Les présentes Conditions Générales d'Utilisation (CGU) régissent l'accès et l'utilisation de la plateforme
          Krendo, un logiciel de gestion de planning et de personnel destiné aux entreprises (ci-après « le Service »).
          Toute utilisation du Service implique l'acceptation pleine et entière des présentes CGU.
        </Section>

        <Section titre="2. Description du service">
          Krendo permet aux entreprises clientes de gérer la planification de leurs missions, les disponibilités
          de leurs employés, les demandes d'absence, la validation des heures travaillées et la communication
          interne via une messagerie intégrée.
        </Section>

        <Section titre="3. Accès au service">
          L'accès au Service se fait exclusivement par la création d'un compte par un administrateur habilité
          de l'entreprise cliente. Aucune inscription libre n'est possible. Chaque utilisateur est responsable
          de la confidentialité de ses identifiants de connexion.
        </Section>

        <Section titre="4. Abonnement et facturation">
          L'accès au Service peut être soumis à un abonnement payant, dont les modalités (durée, prix, moyens de
          paiement) sont précisées séparément lors de la souscription. Krendo se réserve le droit de suspendre
          l'accès au Service en cas de non-paiement, après notification préalable à l'entreprise cliente.
        </Section>

        <Section titre="5. Responsabilités">
          L'entreprise cliente est seule responsable de l'exactitude des informations qu'elle saisit dans le
          Service, ainsi que du respect de la réglementation du travail applicable (temps de travail, repos,
          jours fériés, etc.). Krendo fournit un outil technique et ne se substitue pas aux obligations légales
          de l'employeur.
        </Section>

        <Section titre="6. Protection des données personnelles">
          Le traitement des données personnelles dans le cadre du Service est décrit dans notre{' '}
          <Link to="/confidentialite" style={styles.lien}>Politique de confidentialité</Link>, conforme au
          Règlement Général sur la Protection des Données (RGPD).
        </Section>

        <Section titre="7. Disponibilité du service">
          Krendo s'efforce d'assurer une disponibilité continue du Service, sans garantie absolue. Des interruptions
          temporaires pour maintenance peuvent survenir, avec information préalable dans la mesure du possible.
        </Section>

        <Section titre="8. Résiliation">
          L'entreprise cliente peut demander la résiliation de son abonnement à tout moment. Krendo peut résilier
          l'accès en cas de manquement grave aux présentes CGU ou de non-paiement prolongé.
        </Section>

        <Section titre="9. Droit applicable">
          Les présentes CGU sont soumises au droit belge. Tout litige relève de la compétence exclusive des
          tribunaux belges.
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
  lien: { color: 'var(--emerald)', fontWeight: 600 },
  dateMaj: { fontSize: 12, color: 'var(--text-muted)', marginTop: 32 },
};
