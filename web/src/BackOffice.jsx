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
            <p style={{ color: 'var(--text-secondary)', fontSize: 13.5, margin: '6px 0 0' }}>{entreprises.length} entreprise(s) sur Krendo</p>
          </div>
          <button style={styles.boutonPrincipal} onClick={() => setFormulaireOuvert(true)}>+ Nouvelle entreprise</button>
        </div>

        {chargement ? (
          <p style={{ color: 'var(--text-secondary)' }}>Chargement...</p>
        ) : (
          <div style={styles.tableau}>
            {entreprises.map((e) => (
              <div key={e.id} style={styles.ligneEntreprise}>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 15, fontWeight: 700 }}>{e.nom}</div>
                  <div style={{ fontSize: 12.5, color: 'var(--text-secondary)' }}>{e.nb_utilisateurs} utilisateur(s) actif(s)</div>
                </div>
                <select
                  value={e.statut_abonnement}
                  onChange={(ev) => changerStatut(e.id, ev.target.value)}
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
    </div>
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
    border: '1px solid var(--border)', borderRadius: 'var(--radius-md)', padding: '14px 16px',
  },
  selectStatut: { border: 'none', borderRadius: 7, padding: '6px 10px', fontSize: 12.5, fontWeight: 700, fontFamily: 'var(--font-body)' },
  overlay: { position: 'fixed', inset: 0, background: 'rgba(28,37,54,0.45)', display: 'flex', justifyContent: 'flex-end', zIndex: 50 },
  panneau: { width: 420, maxWidth: '100%', background: 'var(--card)', height: '100%', padding: 28, overflowY: 'auto' },
  fermer: { background: 'var(--canvas)', border: 'none', borderRadius: 8, width: 30, height: 30, fontSize: 14 },
  champLabel: { display: 'flex', flexDirection: 'column', gap: 5 },
  champTexte: { fontSize: 12.5, fontWeight: 600, color: 'var(--text-secondary)' },
};
