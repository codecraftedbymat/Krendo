const dictionnaires = {
  fr: {
    nav_missions: 'Missions',
    nav_statistiques: 'Statistiques',
    nav_planning: 'Planning',
    nav_heures: 'Heures',
    nav_absences: 'Absences',
    nav_messages: 'Messages',
    nav_equipe: 'Équipe',
    nav_parametres: 'Paramètres',
    nav_profil: 'Profil',

    connexion_titre: 'Connexion à votre espace',
    connexion_email: 'Adresse email',
    connexion_mot_de_passe: 'Mot de passe',
    connexion_bouton: 'Se connecter',
    connexion_en_cours: 'Connexion...',
    connexion_mot_de_passe_oublie: 'Mot de passe oublié ?',
    reinitialiser_titre: 'Réinitialiser votre mot de passe',
    reinitialiser_bouton: 'Envoyer le lien de réinitialisation',
    reinitialiser_retour: 'Retour à la connexion',

    enregistrer: 'Enregistrer',
    annuler: 'Annuler',
    supprimer: 'Supprimer',
    modifier: 'Modifier',
    fermer: 'Fermer',
    chargement: 'Chargement...',
    confirmer: 'Confirmer',

    titre_missions: 'Missions',
    soustitre_missions: "Créez une mission et suivez les disponibilités de votre équipe.",
    titre_planning: 'Planning',
    titre_heures: 'Heures',
    titre_absences: 'Absences',
    titre_equipe: 'Équipe',
    titre_parametres: 'Paramètres',
    titre_statistiques: 'Statistiques',
    titre_messages: 'Messages',
    titre_profil: 'Profil',

    deconnexion: 'Se déconnecter',
  },
  nl: {
    nav_missions: 'Opdrachten',
    nav_statistiques: 'Statistieken',
    nav_planning: 'Planning',
    nav_heures: 'Uren',
    nav_absences: 'Afwezigheden',
    nav_messages: 'Berichten',
    nav_equipe: 'Team',
    nav_parametres: 'Instellingen',
    nav_profil: 'Profiel',

    connexion_titre: 'Inloggen op uw account',
    connexion_email: 'E-mailadres',
    connexion_mot_de_passe: 'Wachtwoord',
    connexion_bouton: 'Inloggen',
    connexion_en_cours: 'Bezig met inloggen...',
    connexion_mot_de_passe_oublie: 'Wachtwoord vergeten?',
    reinitialiser_titre: 'Wachtwoord opnieuw instellen',
    reinitialiser_bouton: 'Link verzenden',
    reinitialiser_retour: 'Terug naar inloggen',

    enregistrer: 'Opslaan',
    annuler: 'Annuleren',
    supprimer: 'Verwijderen',
    modifier: 'Bewerken',
    fermer: 'Sluiten',
    chargement: 'Laden...',
    confirmer: 'Bevestigen',

    titre_missions: 'Opdrachten',
    soustitre_missions: 'Maak een opdracht aan en volg de beschikbaarheid van uw team.',
    titre_planning: 'Planning',
    titre_heures: 'Uren',
    titre_absences: 'Afwezigheden',
    titre_equipe: 'Team',
    titre_parametres: 'Instellingen',
    titre_statistiques: 'Statistieken',
    titre_messages: 'Berichten',
    titre_profil: 'Profiel',

    deconnexion: 'Uitloggen',
  },
};

export function chargerLangue() {
  return localStorage.getItem('krendo_langue') || 'fr';
}

export function sauvegarderLangue(langue) {
  localStorage.setItem('krendo_langue', langue);
}

export function traduire(langue, cle) {
  return dictionnaires[langue]?.[cle] || dictionnaires.fr[cle] || cle;
}
