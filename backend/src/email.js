// Envoi d'emails via l'API Brevo (anciennement Sendinblue).
// Si BREVO_API_KEY n'est pas configurée, l'envoi est simplement ignoré (utile en local/dev)
// plutôt que de faire planter le serveur.

const BREVO_API_URL = 'https://api.brevo.com/v3/smtp/email';

export async function envoyerEmail({ destinataireEmail, destinataireNom, sujet, contenuHtml }) {
  const apiKey = process.env.BREVO_API_KEY;
  const expediteurEmail = process.env.EMAIL_EXPEDITEUR || 'no-reply@krendo.app';
  const expediteurNom = process.env.EMAIL_EXPEDITEUR_NOM || 'Krendo';

  if (!apiKey) {
    console.log(`[email désactivé - pas de BREVO_API_KEY] à ${destinataireEmail} : ${sujet}`);
    return { envoye: false, raison: 'BREVO_API_KEY absente' };
  }

  try {
    const res = await fetch(BREVO_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
        'api-key': apiKey,
      },
      body: JSON.stringify({
        sender: { name: expediteurNom, email: expediteurEmail },
        to: [{ email: destinataireEmail, name: destinataireNom }],
        subject: sujet,
        htmlContent: contenuHtml,
      }),
    });

    if (!res.ok) {
      const detail = await res.text().catch(() => '');
      console.error(`Erreur envoi email Brevo (${res.status}):`, detail);
      return { envoye: false, raison: `Erreur Brevo ${res.status}` };
    }
    return { envoye: true };
  } catch (err) {
    console.error('Erreur envoi email Brevo:', err.message);
    return { envoye: false, raison: err.message };
  }
}

function enveloppeHtml(titre, corpsHtml) {
  return `
    <div style="font-family: Arial, sans-serif; max-width: 480px; margin: 0 auto; padding: 24px;">
      <div style="background:#1C2536; color:white; padding:16px 20px; border-radius:12px 12px 0 0;">
        <strong style="font-size:16px;">Krendo</strong>
      </div>
      <div style="border:1px solid #E4E7EC; border-top:none; padding:24px 20px; border-radius:0 0 12px 12px;">
        <h2 style="font-size:17px; color:#1C2536; margin:0 0 12px;">${titre}</h2>
        <div style="font-size:14px; color:#374151; line-height:1.6;">${corpsHtml}</div>
      </div>
    </div>
  `;
}

export const modelesEmail = {
  nouvelleMission: (prenom, titreMission) => enveloppeHtml(
    'Nouvelle mission disponible',
    `Bonjour ${prenom},<br><br>Une nouvelle mission "<strong>${titreMission}</strong>" vient d'être publiée. Connectez-vous à Krendo pour confirmer votre disponibilité.`
  ),
  nouveauMessage: (prenom) => enveloppeHtml(
    'Nouveau message',
    `Bonjour ${prenom},<br><br>Un nouveau message vous concernant a été envoyé sur Krendo. Connectez-vous pour le consulter.`
  ),
  absenceTraitee: (prenom, statut, dateDebut, dateFin) => enveloppeHtml(
    `Votre demande d'absence a été ${statut === 'acceptee' ? 'acceptée' : 'refusée'}`,
    `Bonjour ${prenom},<br><br>Votre demande d'absence du ${dateDebut} au ${dateFin} a été <strong>${statut === 'acceptee' ? 'acceptée' : 'refusée'}</strong>.`
  ),
  creneauModifie: (prenom, heureDebut, heureFin) => enveloppeHtml(
    'Votre créneau a été modifié',
    `Bonjour ${prenom},<br><br>Vos horaires ont été mis à jour : <strong>${heureDebut} - ${heureFin}</strong>. Connectez-vous à Krendo pour voir le détail.`
  ),
  reinitialisationMotDePasse: (prenom, lien) => enveloppeHtml(
    'Réinitialisation de votre mot de passe',
    `Bonjour ${prenom},<br><br>Cliquez sur le lien ci-dessous pour choisir un nouveau mot de passe. Ce lien expire dans 1 heure.<br><br><a href="${lien}" style="display:inline-block; background:#2F7A63; color:white; padding:10px 18px; border-radius:8px; text-decoration:none; margin-top:8px;">Réinitialiser mon mot de passe</a><br><br>Si vous n'êtes pas à l'origine de cette demande, ignorez simplement cet email.`
  ),
};
