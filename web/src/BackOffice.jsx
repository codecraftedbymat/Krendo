import { useEffect, useState } from 'react';
import { apiPlateforme, sauvegarderSessionPlateforme, chargerSessionPlateforme, effacerSessionPlateforme } from './lib/api';

export default function BackOffice() {
  const [session, setSession] = useState(chargerSessionPlateforme());

  if (!session) {
    return <ConnexionPlateforme onConnecte={(admin, token) => setSession({ admin, token })} />;
  }

  return <TableauDeBord admin={session.admin} onDeconnexion={() => { effacerSessionPlateforme(); setSession(null); }} />;
}

function ConnexionPlateforme({ onConnecte }) {
  const [email, setEmail] = useState('');
  const [motDePasse, setMotDePasse] = useState('');
  const [erreur, setErreur] = useState('');
  const [chargement, setChargement] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setErreur('');
    setChargement(true);
    try {
      const data = await apiPlateforme.connexion(email, motDePasse);
      sauvegarderSessionPlateforme(data.token, data.admin);
      onConnecte(data.admin, data.token);
    } catch (err) {
      setErreur(err.message);
    } finally {
      setChargement(false);
    }
  }

  return (
    <div style={styles.page}>
      <div style={styles.carte}>
        <div style={styles.marque}>
          <div style={styles.logoMark}>K</div>
          <span style={styles.logoText}>Krendo</span>
        </div>
        <p style={styles.sousTitre}>Back-office — administration de la plateforme</p>

        <form onSubmit={handleSubmit} style={styles.form}>
          <label style={styles.label}>
            Email
            <input type="email" required style={styles.input} value={email} onChange={(e) => setEmail(e.target.value)} />
          </label>
          <label style={styles.label}>
            Mot de passe
            <input type="password" required style={styles.input} value={motDePasse} onChange={(e) => setMotDePasse(e.target.value)} />
          </label>
          {erreur && <div style={styles.erreur}>{erreur}</div>}
          <button type="submit" disabled={chargement} style={styles.bouton}>
            {chargement ? 'Connexion...' : 'Se connecter'}
          </button>
        </form>
      </div>
    </div>
  );
}

function TableauDeBord({ admin, onDeconnexion }) {
  const [entreprises, setEntreprises] = useState([]);
  const [chargement, setChargement] = useState(true);
  const [formulaireOuvert, setFormulaireOuvert] = useState(false);
  const [entrepriseOuverte, setEntrepriseOuverte] = useState(null);

  useEffect(() => { charger(); }, []);

  async function charger() {
    setChargement(true);
    try {
      setEntreprises(await apiPlateforme.entreprises());
    } finally {
      setChargement(false);
    }
  }

  async function changerStatut(id, statut_abonnement) {
    await apiPlateforme.majEntreprise(id, { statut_abonnement });
    charger();
  }

  return (
    <div style={styles.dashboardPage}>
      <header style={styles.dashboardEntete}>
        <div style={styles.marque}>
          <div style={styles.logoMark}>K</div>
          <span style={styles.logoText}>Krendo — Back-office</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
          <span style={{ fontSize: 13, color: 'var(--text-secondary)' }}>{admin.nom}</span>
          <button style={styles.boutonDeconnexion} onClick={onDeconnexion}>Déconnexion</button>
        </div>
      </header>

      <main style={styles.dashboardContenu}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 24 }}>
          <div>
            <h1 style={{ fontSize: 24, fontFamily: 'var(--font-display)', fontWeight: 800, margin: 0 }}>Entreprises clientes</h1>
            <p style={{ color: 'var(--text-secondary)', fontSize: 13.5, margin: '6px 0 0' }}>{entreprises.length} entreprise(s) sur Krendo · cliquez sur une ligne pour la gérer</p>
          </div>
          <button style={styles.boutonPrincipal} onClick={() => setFormulaireOuvert(true)}>+ Nouvelle entreprise</button>
        </div>

        {chargement ? (
          <p style={{ color: 'var(--text-secondary)' }}>Chargement...</p>
        ) : (
          <div style={styles.tableau}>
            {entreprises.map((e) => (
              <div key={e.id} style={styles.ligneEntreprise} onClick={() => setEntrepriseOuverte(e)}>
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <div style={{ fontSize: 15, fontWeight: 700 }}>{e.nom}</div>
                    {e.compte_gratuit && <span style={styles.badgeGratuit}>Gratuit</span>}
                  </div>
                  <div style={{ fontSize: 12.5, color: 'var(--text-secondary)' }}>{e.nb_utilisateurs} utilisateur(s) actif(s)</div>
                </div>
                <select
                  value={e.statut_abonnement}
                  onChange={(ev) => changerStatut(e.id, ev.target.value)}
                  onClick={(ev) => ev.stopPropagation()}
                  style={{ ...styles.selectStatut, ...statutStyle(e.statut_abonnement) }}
                >
                  <option value="essai">Essai</option>
                  <option value="actif">Actif</option>
                  <option value="suspendu">Suspendu</option>
                  <option value="resilie">Résilié</option>
                </select>
              </div>
            ))}
          </div>
        )}
      </main>

      {formulaireOuvert && (
        <FormulaireEntreprise onFermer={() => setFormulaireOuvert(false)} onCree={() => { setFormulaireOuvert(false); charger(); }} />
      )}

      {entrepriseOuverte && (
        <DetailEntreprise
          entreprise={entrepriseOuverte}
          onFermer={() => setEntrepriseOuverte(null)}
          onSupprimee={() => { setEntrepriseOuverte(null); charger(); }}
          onChange={charger}
        />
      )}
    </div>
  );
}

function DetailEntreprise({ entreprise, onFermer, onSupprimee, onChange }) {
  const [utilisateurs, setUtilisateurs] = useState([]);
  const [roles, setRoles] = useState([]);
  const [chargement, setChargement] = useState(true);
  const [formulaireOuvert, setFormulaireOuvert] = useState(false);
  const [suppressionOuverte, setSuppressionOuverte] = useState(false);
  const [compteGratuit, setCompteGratuit] = useState(entreprise.compte_gratuit);
  const [note, setNote] = useState(entreprise.note_interne || '');
  const [noteModifiee, setNoteModifiee] = useState(false);

  useEffect(() => { charger(); }, []);

  async function charger() {
    setChargement(true);
    try {
      const [u, r] = await Promise.all([
        apiPlateforme.utilisateursEntreprise(entreprise.id),
        apiPlateforme.roles(),
      ]);
      setUtilisateurs(u);
      setRoles(r);
    } finally {
      setChargement(false);
    }
  }

  async function basculerGratuit() {
    const nouveau = !compteGratuit;
    setCompteGratuit(nouveau);
    await apiPlateforme.majEntreprise(entreprise.id, { compte_gratuit: nouveau });
    onChange();
  }

  async function enregistrerNote() {
    await apiPlateforme.majEntreprise(entreprise.id, { note_interne: note || null });
    setNoteModifiee(false);
    onChange();
  }

  async function changerRole(userId, role_id) {
    await apiPlateforme.majUtilisateurEntreprise(entreprise.id, userId, { role_id: Number(role_id) });
    charger();
  }

  async function basculerActif(u) {
    await apiPlateforme.majUtilisateurEntreprise(entreprise.id, u.id, { actif: !u.actif });
    charger();
  }

  async function supprimerUtilisateur(u) {
    const confirmation = window.confirm(`Supprimer définitivement ${u.prenom} ${u.nom} ?`);
    if (!confirmation) return;
    const resultat = await apiPlateforme.supprimerUtilisateurEntreprise(entreprise.id, u.id);
    if (resultat.desactive) alert(resultat.message);
    charger();
  }

  return (
    <div style={styles.overlay} onClick={onFermer}>
      <div style={styles.panneauLarge} onClick={(e) => e.stopPropagation()}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 20 }}>
          <div>
            <h2 style={{ fontSize: 20, margin: 0 }}>{entreprise.nom}</h2>
            <span style={{ ...styles.badgeStatut, ...statutStyle(entreprise.statut_abonnement) }}>{entreprise.statut_abonnement}</span>
            {compteGratuit && <span style={{ ...styles.badgeStatut, ...styles.badgeGratuit, marginLeft: 6 }}>Gratuit</span>}
          </div>
          <button style={styles.fermer} onClick={onFermer}>✕</button>
        </div>

        <div style={styles.blocFacturation}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <p style={{ fontSize: 12.5, fontWeight: 700, margin: 0 }}>Compte gratuit / partenaire</p>
              <p style={{ fontSize: 11.5, color: 'var(--text-secondary)', margin: '2px 0 0' }}>
                {compteGratuit ? "Cette entreprise ne sera jamais facturée automatiquement." : "Facturation normale via Stripe (3€ / employé actif / mois)."}
              </p>
            </div>
            <Interrupteur actif={compteGratuit} onClick={basculerGratuit} />
          </div>

          <label style={{ display: 'block', marginTop: 14 }}>
            <span style={{ fontSize: 11.5, fontWeight: 600, color: 'var(--text-secondary)' }}>Note interne (visible uniquement par toi)</span>
            <textarea
              style={styles.textarea}
              value={note}
              onChange={(e) => { setNote(e.target.value); setNoteModifiee(true); }}
              placeholder="Ex : partenariat, client pilote, connaissance..."
            />
          </label>
          {noteModifiee && (
            <button style={styles.boutonSecondaire} onClick={enregistrerNote}>Enregistrer la note</button>
          )}

          {!compteGratuit && !entreprise.stripe_subscription_id && (
            <BoutonLienPaiement entrepriseId={entreprise.id} />
          )}
          {entreprise.stripe_subscription_id && (
            <p style={{ fontSize: 11.5, color: 'var(--emerald)', fontWeight: 700, marginTop: 14 }}>
              ✓ Abonnement Stripe actif pour cette entreprise
            </p>
          )}
        </div>

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12, marginTop: 20 }}>
          <p style={{ fontSize: 12.5, fontWeight: 700, color: 'var(--text-secondary)', margin: 0 }}>Comptes ({utilisateurs.length})</p>
          <button style={styles.boutonSecondaire} onClick={() => setFormulaireOuvert(true)}>+ Ajouter un compte</button>
        </div>

        {chargement ? (
          <p style={{ color: 'var(--text-secondary)', fontSize: 13.5 }}>Chargement...</p>
        ) : (
          <div style={styles.listeComptes}>
            {utilisateurs.map((u) => (
              <div key={u.id} style={styles.ligneCompte}>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 13.5, fontWeight: 600 }}>{u.prenom} {u.nom}</div>
                  <div style={{ fontSize: 12, color: 'var(--text-secondary)' }}>{u.email}</div>
                </div>
                <select value={u.role_id} onChange={(e) => changerRole(u.id, e.target.value)} style={styles.selectRole}>
                  {roles.map((r) => <option key={r.id} value={r.id}>{r.nom}</option>)}
                </select>
                {!u.actif && <span style={styles.badgeInactif}>Désactivé</span>}
                <button style={styles.boutonMini} onClick={() => basculerActif(u)}>{u.actif ? 'Désactiver' : 'Réactiver'}</button>
                <button style={styles.boutonMiniSupprimer} onClick={() => supprimerUtilisateur(u)}>Supprimer</button>
              </div>
            ))}
          </div>
        )}

        <div style={styles.zoneDanger}>
          <p style={{ fontSize: 12.5, fontWeight: 700, color: 'var(--red)', margin: '0 0 4px' }}>Zone de danger</p>
          <p style={{ fontSize: 12, color: 'var(--text-secondary)', margin: '0 0 10px' }}>
            Supprime définitivement cette entreprise et toutes ses données (missions, comptes, absences, messages...). Action irréversible.
          </p>
          <button style={styles.boutonDanger} onClick={() => setSuppressionOuverte(true)}>Supprimer définitivement cette entreprise</button>
        </div>
      </div>

      {formulaireOuvert && (
        <FormulaireCompteEntreprise
          entreprise={entreprise}
          roles={roles}
          onFermer={() => setFormulaireOuvert(false)}
          onCree={() => { setFormulaireOuvert(false); charger(); }}
        />
      )}

      {suppressionOuverte && (
        <ConfirmationSuppression
          entreprise={entreprise}
          onFermer={() => setSuppressionOuverte(false)}
          onSupprime={onSupprimee}
        />
      )}
    </div>
  );
}

function FormulaireCompteEntreprise({ entreprise, roles, onFermer, onCree }) {
  const [champ, setChamp] = useState({ prenom: '', nom: '', email: '', mot_de_passe: '', role_id: '' });
  const [erreur, setErreur] = useState('');
  const [envoi, setEnvoi] = useState(false);

  function set(nom, valeur) { setChamp((c) => ({ ...c, [nom]: valeur })); }

  async function handleSubmit(e) {
    e.preventDefault();
    setErreur('');
    setEnvoi(true);
    try {
      await apiPlateforme.creerUtilisateurEntreprise(entreprise.id, { ...champ, role_id: Number(champ.role_id) });
      onCree();
    } catch (err) {
      setErreur(err.message);
    } finally {
      setEnvoi(false);
    }
  }

  return (
    <div style={styles.overlay} onClick={onFermer}>
      <form style={styles.panneau} onClick={(e) => e.stopPropagation()} onSubmit={handleSubmit}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 18 }}>
          <h2 style={{ fontSize: 18, margin: 0 }}>Nouveau compte — {entreprise.nom}</h2>
          <button type="button" style={styles.fermer} onClick={onFermer}>✕</button>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
          <label style={styles.champLabel}>
            <span style={styles.champTexte}>Prénom</span>
            <input required style={styles.input} value={champ.prenom} onChange={(e) => set('prenom', e.target.value)} />
          </label>
          <label style={styles.champLabel}>
            <span style={styles.champTexte}>Nom</span>
            <input required style={styles.input} value={champ.nom} onChange={(e) => set('nom', e.target.value)} />
          </label>
        </div>
        <label style={{ ...styles.champLabel, marginTop: 12 }}>
          <span style={styles.champTexte}>Email</span>
          <input required type="email" style={styles.input} value={champ.email} onChange={(e) => set('email', e.target.value)} />
        </label>
        <label style={{ ...styles.champLabel, marginTop: 12 }}>
          <span style={styles.champTexte}>Mot de passe provisoire</span>
          <input required style={styles.input} value={champ.mot_de_passe} onChange={(e) => set('mot_de_passe', e.target.value)} />
        </label>
        <label style={{ ...styles.champLabel, marginTop: 12 }}>
          <span style={styles.champTexte}>Rôle</span>
          <select required style={styles.input} value={champ.role_id} onChange={(e) => set('role_id', e.target.value)}>
            <option value="">Choisir un rôle</option>
            {roles.map((r) => <option key={r.id} value={r.id}>{r.nom}</option>)}
          </select>
        </label>
        {erreur && <div style={styles.erreur}>{erreur}</div>}
        <button type="submit" disabled={envoi} style={{ ...styles.bouton, marginTop: 18 }}>
          {envoi ? 'Création...' : 'Créer le compte'}
        </button>
      </form>
    </div>
  );
}

function ConfirmationSuppression({ entreprise, onFermer, onSupprime }) {
  const [saisie, setSaisie] = useState('');
  const [erreur, setErreur] = useState('');
  const [envoi, setEnvoi] = useState(false);

  async function confirmer() {
    setErreur('');
    setEnvoi(true);
    try {
      await apiPlateforme.supprimerEntreprise(entreprise.id, saisie);
      onSupprime();
    } catch (err) {
      setErreur(err.message);
    } finally {
      setEnvoi(false);
    }
  }

  return (
    <div style={styles.overlayDanger} onClick={onFermer}>
      <div style={styles.panneauDanger} onClick={(e) => e.stopPropagation()}>
        <h2 style={{ fontSize: 18, color: 'var(--red)', margin: '0 0 8px' }}>Suppression définitive</h2>
        <p style={{ fontSize: 13.5, color: 'var(--text-secondary)', lineHeight: 1.5 }}>
          Cette action supprimera <strong>{entreprise.nom}</strong>, tous ses comptes, missions, absences et messages, de façon définitive et irréversible.
        </p>
        <p style={{ fontSize: 13, marginTop: 16 }}>
          Tapez <strong>{entreprise.nom}</strong> pour confirmer :
        </p>
        <input style={styles.input} value={saisie} onChange={(e) => setSaisie(e.target.value)} />
        {erreur && <div style={{ ...styles.erreur, marginTop: 10 }}>{erreur}</div>}
        <div style={{ display: 'flex', gap: 10, marginTop: 18 }}>
          <button style={styles.boutonSecondaire} onClick={onFermer}>Annuler</button>
          <button
            style={{ ...styles.boutonDanger, flex: 1 }}
            disabled={saisie !== entreprise.nom || envoi}
            onClick={confirmer}
          >
            {envoi ? 'Suppression...' : 'Supprimer définitivement'}
          </button>
        </div>
      </div>
    </div>
  );
}

function BoutonLienPaiement({ entrepriseId }) {
  const [lien, setLien] = useState(null);
  const [chargement, setChargement] = useState(false);
  const [erreur, setErreur] = useState('');
  const [copie, setCopie] = useState(false);

  async function generer() {
    setChargement(true);
    setErreur('');
    try {
      const { url } = await apiPlateforme.genererLienPaiement(entrepriseId);
      setLien(url);
    } catch (err) {
      setErreur(err.message);
    } finally {
      setChargement(false);
    }
  }

  function copier() {
    navigator.clipboard.writeText(lien);
    setCopie(true);
    setTimeout(() => setCopie(false), 2000);
  }

  return (
    <div style={{ marginTop: 16 }}>
      {!lien ? (
        <button style={styles.boutonSecondaire} onClick={generer} disabled={chargement}>
          {chargement ? 'Génération...' : '💳 Générer un lien de paiement'}
        </button>
      ) : (
        <div style={{ background: 'white', border: '1px solid var(--border)', borderRadius: 10, padding: 10 }}>
          <p style={{ fontSize: 11, color: 'var(--text-secondary)', margin: '0 0 6px', fontWeight: 600 }}>
            Lien à envoyer à votre client :
          </p>
          <div style={{ display: 'flex', gap: 6 }}>
            <input readOnly value={lien} style={{ ...styles.input, fontSize: 11, flex: 1 }} onFocus={(e) => e.target.select()} />
            <button type="button" style={styles.boutonSecondaire} onClick={copier}>{copie ? 'Copié !' : 'Copier'}</button>
          </div>
        </div>
      )}
      {erreur && <div style={{ ...styles.erreur, marginTop: 8 }}>{erreur}</div>}
    </div>
  );
}

function Interrupteur({ actif, onClick }) {
  return (
    <button onClick={onClick} style={{ ...styles.interrupteur, background: actif ? 'var(--emerald)' : 'var(--border)' }}>
      <span style={{ ...styles.interrupteurRond, transform: actif ? 'translateX(18px)' : 'translateX(2px)' }} />
    </button>
  );
}

function statutStyle(statut) {
  const map = {
    essai: { background: 'var(--amber-soft)', color: 'var(--amber)' },
    actif: { background: 'var(--emerald-soft)', color: 'var(--emerald)' },
    suspendu: { background: 'var(--red-soft)', color: 'var(--red)' },
    resilie: { background: 'var(--canvas)', color: 'var(--text-muted)' },
  };
  return map[statut] || {};
}

function FormulaireEntreprise({ onFermer, onCree }) {
  const [champ, setChamp] = useState({ nom: '', admin_prenom: '', admin_nom: '', admin_email: '', admin_mot_de_passe: '' });
  const [erreur, setErreur] = useState('');
  const [envoi, setEnvoi] = useState(false);

  function set(nom, valeur) { setChamp((c) => ({ ...c, [nom]: valeur })); }

  async function handleSubmit(e) {
    e.preventDefault();
    setErreur('');
    setEnvoi(true);
    try {
      await apiPlateforme.creerEntreprise(champ);
      onCree();
    } catch (err) {
      setErreur(err.message);
    } finally {
      setEnvoi(false);
    }
  }

  return (
    <div style={styles.overlay} onClick={onFermer}>
      <form style={styles.panneau} onClick={(e) => e.stopPropagation()} onSubmit={handleSubmit}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 20 }}>
          <h2 style={{ fontSize: 19, margin: 0 }}>Nouvelle entreprise cliente</h2>
          <button type="button" style={styles.fermer} onClick={onFermer}>✕</button>
        </div>

        <label style={styles.champLabel}>
          <span style={styles.champTexte}>Nom de l'entreprise</span>
          <input required style={styles.input} value={champ.nom} onChange={(e) => set('nom', e.target.value)} placeholder="Restaurant Dupont" />
        </label>

        <p style={{ fontSize: 12.5, fontWeight: 700, color: 'var(--text-secondary)', margin: '18px 0 10px' }}>Premier compte admin (super admin)</p>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
          <label style={styles.champLabel}>
            <span style={styles.champTexte}>Prénom</span>
            <input required style={styles.input} value={champ.admin_prenom} onChange={(e) => set('admin_prenom', e.target.value)} />
          </label>
          <label style={styles.champLabel}>
            <span style={styles.champTexte}>Nom</span>
            <input required style={styles.input} value={champ.admin_nom} onChange={(e) => set('admin_nom', e.target.value)} />
          </label>
        </div>
        <label style={{ ...styles.champLabel, marginTop: 12 }}>
          <span style={styles.champTexte}>Email</span>
          <input required type="email" style={styles.input} value={champ.admin_email} onChange={(e) => set('admin_email', e.target.value)} />
        </label>
        <label style={{ ...styles.champLabel, marginTop: 12 }}>
          <span style={styles.champTexte}>Mot de passe provisoire</span>
          <input required style={styles.input} value={champ.admin_mot_de_passe} onChange={(e) => set('admin_mot_de_passe', e.target.value)} />
        </label>

        {erreur && <div style={styles.erreur}>{erreur}</div>}

        <button type="submit" disabled={envoi} style={{ ...styles.bouton, marginTop: 20 }}>
          {envoi ? 'Création...' : 'Créer l\'entreprise'}
        </button>
      </form>
    </div>
  );
}

const styles = {
  page: {
    minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center',
    background: 'var(--ink)', backgroundImage: 'radial-gradient(circle at 20% 20%, #2A3548 0%, #1C2536 60%)', padding: 24,
  },
  carte: { background: 'var(--card)', borderRadius: 'var(--radius-lg)', padding: '40px 36px', width: '100%', maxWidth: 380, boxShadow: '0 20px 60px rgba(0,0,0,0.35)' },
  marque: { display: 'flex', alignItems: 'center', gap: 10 },
  logoMark: {
    width: 30, height: 30, borderRadius: 8, background: 'var(--emerald)', color: 'white',
    display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 15,
  },
  logoText: { fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 17, color: 'var(--ink)' },
  sousTitre: { color: 'var(--text-secondary)', fontSize: 13, margin: '10px 0 24px' },
  form: { display: 'flex', flexDirection: 'column', gap: 14 },
  label: { display: 'flex', flexDirection: 'column', gap: 6, fontSize: 13, fontWeight: 600 },
  input: { padding: '10px 12px', borderRadius: 'var(--radius-sm)', border: '1.5px solid var(--border)', fontSize: 13.5, outline: 'none', width: '100%', boxSizing: 'border-box' },
  bouton: { padding: '12px', borderRadius: 'var(--radius-sm)', border: 'none', background: 'var(--ink)', color: 'white', fontWeight: 700, fontSize: 14 },
  erreur: { background: 'var(--red-soft)', color: 'var(--red)', padding: '10px 12px', borderRadius: 'var(--radius-sm)', fontSize: 13 },

  dashboardPage: { minHeight: '100vh', background: 'var(--canvas)' },
  dashboardEntete: {
    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
    padding: '16px 32px', background: 'var(--card)', borderBottom: '1px solid var(--border)',
  },
  boutonDeconnexion: { background: 'var(--canvas)', border: 'none', borderRadius: 8, padding: '7px 12px', fontSize: 12.5, fontWeight: 600, color: 'var(--text-secondary)' },
  dashboardContenu: { maxWidth: 900, margin: '0 auto', padding: '32px 24px' },
  boutonPrincipal: { background: 'var(--ink)', color: 'white', border: 'none', borderRadius: 'var(--radius-sm)', padding: '10px 16px', fontWeight: 700, fontSize: 13.5, whiteSpace: 'nowrap' },
  tableau: { display: 'flex', flexDirection: 'column', gap: 8 },
  ligneEntreprise: {
    display: 'flex', alignItems: 'center', gap: 12, background: 'var(--card)',
    border: '1px solid var(--border)', borderRadius: 'var(--radius-md)', padding: '14px 16px', cursor: 'pointer',
  },
  selectStatut: { border: 'none', borderRadius: 7, padding: '6px 10px', fontSize: 12.5, fontWeight: 700, fontFamily: 'var(--font-body)' },
  overlay: { position: 'fixed', inset: 0, background: 'rgba(28,37,54,0.45)', display: 'flex', justifyContent: 'flex-end', zIndex: 50 },
  overlayDanger: { position: 'fixed', inset: 0, background: 'rgba(28,37,54,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 60, padding: 20 },
  panneau: { width: 420, maxWidth: '100%', background: 'var(--card)', height: '100%', padding: 28, overflowY: 'auto' },
  panneauLarge: { width: 640, maxWidth: '100%', background: 'var(--card)', height: '100%', padding: 28, overflowY: 'auto' },
  panneauDanger: { width: 440, maxWidth: '100%', background: 'var(--card)', borderRadius: 'var(--radius-lg)', padding: 28 },
  fermer: { background: 'var(--canvas)', border: 'none', borderRadius: 8, width: 30, height: 30, fontSize: 14 },
  champLabel: { display: 'flex', flexDirection: 'column', gap: 5 },
  champTexte: { fontSize: 12.5, fontWeight: 600, color: 'var(--text-secondary)' },
  badgeStatut: { display: 'inline-block', marginTop: 6, fontSize: 11, fontWeight: 700, padding: '3px 9px', borderRadius: 6, textTransform: 'capitalize' },
  boutonSecondaire: {
    background: 'var(--canvas)', border: 'none', borderRadius: 7, padding: '7px 12px', fontSize: 12, fontWeight: 700, color: 'var(--text-secondary)', whiteSpace: 'nowrap',
  },
  listeComptes: { display: 'flex', flexDirection: 'column', gap: 6, marginBottom: 24 },
  ligneCompte: {
    display: 'flex', alignItems: 'center', gap: 8, background: 'var(--canvas)',
    borderRadius: 'var(--radius-sm)', padding: '9px 12px', flexWrap: 'wrap',
  },
  selectRole: { border: '1px solid var(--border)', borderRadius: 6, padding: '5px 8px', fontSize: 11.5, fontFamily: 'var(--font-body)' },
  badgeInactif: { fontSize: 10.5, fontWeight: 700, background: 'var(--red-soft)', color: 'var(--red)', padding: '3px 8px', borderRadius: 5 },
  boutonMini: { background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 6, padding: '5px 9px', fontSize: 11, fontWeight: 700, color: 'var(--text-secondary)' },
  boutonMiniSupprimer: { background: 'var(--red-soft)', border: 'none', borderRadius: 6, padding: '5px 9px', fontSize: 11, fontWeight: 700, color: 'var(--red)' },
  zoneDanger: { border: '1px solid var(--red-soft)', borderRadius: 'var(--radius-md)', padding: 16, background: 'rgba(194,68,68,0.03)' },
  boutonDanger: {
    background: 'var(--red)', color: 'white', border: 'none', borderRadius: 'var(--radius-sm)',
    padding: '10px 16px', fontWeight: 700, fontSize: 13,
  },
  badgeGratuit: {
    fontSize: 10.5, fontWeight: 700, background: 'var(--emerald-soft)', color: 'var(--emerald)',
    padding: '3px 8px', borderRadius: 5,
  },
  blocFacturation: {
    background: 'var(--canvas)', borderRadius: 'var(--radius-md)', padding: 16,
  },
  textarea: {
    width: '100%', marginTop: 6, padding: '9px 11px', borderRadius: 'var(--radius-sm)', border: '1.5px solid var(--border)',
    fontSize: 12.5, outline: 'none', minHeight: 60, resize: 'vertical', fontFamily: 'var(--font-body)', boxSizing: 'border-box',
  },
  interrupteur: {
    width: 40, height: 22, borderRadius: 11, border: 'none', position: 'relative', flexShrink: 0, padding: 0,
    outline: 'none', boxShadow: 'none', WebkitAppearance: 'none', appearance: 'none', overflow: 'hidden',
  },
  interrupteurRond: {
    position: 'absolute', top: 2, width: 18, height: 18, borderRadius: '50%', background: 'white', transition: 'transform 0.15s',
  },
};
