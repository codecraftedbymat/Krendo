import { useEffect, useState } from 'react';
import { api } from '../lib/api';

export default function Equipe({ utilisateur }) {
  const [utilisateurs, setUtilisateurs] = useState([]);
  const [roles, setRoles] = useState([]);
  const [chargement, setChargement] = useState(true);
  const [formulaireOuvert, setFormulaireOuvert] = useState(false);

  const peutGererComptes = utilisateur.permissions.peut_gerer_comptes || utilisateur.permissions.peut_voir_tout;

  useEffect(() => { charger(); }, []);

  async function charger() {
    setChargement(true);
    try {
      const [u, r] = await Promise.all([api.utilisateurs(), api.roles()]);
      setUtilisateurs(u);
      setRoles(r);
    } finally {
      setChargement(false);
    }
  }

  async function basculerActif(u) {
    await api.majUtilisateur(u.id, { actif: !u.actif });
    charger();
  }

  async function supprimer(u) {
    const confirmation = window.confirm(
      `Supprimer définitivement ${u.prenom} ${u.nom} ?\n\nSi cette personne a déjà des missions, messages ou heures enregistrées, son compte sera désactivé au lieu d'être supprimé, pour ne pas perdre l'historique.`
    );
    if (!confirmation) return;
    const resultat = await api.supprimerUtilisateur(u.id);
    if (resultat.desactive) {
      alert(resultat.message);
    }
    charger();
  }

  return (
    <div>
      <div style={styles.entete}>
        <div>
          <h1 style={styles.titre}>Équipe</h1>
          <p style={styles.sousTitre}>
            {peutGererComptes ? 'Les comptes de votre entreprise.' : 'Les comptes de votre entreprise. Seul un admin peut en créer.'}
          </p>
        </div>
        {peutGererComptes && (
          <button style={styles.boutonPrincipal} onClick={() => setFormulaireOuvert(true)}>+ Ajouter un compte</button>
        )}
      </div>

      {chargement ? (
        <p style={styles.texteAttente}>Chargement...</p>
      ) : (
        <div style={styles.liste}>
          {utilisateurs.map((u) => (
            <div key={u.id} style={styles.ligne}>
              <div style={styles.avatarPetit}>{u.prenom[0]}{u.nom[0]}</div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 13.5, fontWeight: 600 }}>{u.prenom} {u.nom}</div>
                <div style={{ fontSize: 12.5, color: 'var(--text-secondary)' }}>{u.email}</div>
              </div>
              <span style={styles.badgeRole}>{u.role}</span>
              {!u.actif && <span style={styles.badgeInactif}>Désactivé</span>}
              {peutGererComptes && u.id !== utilisateur.id && (
                <>
                  <button style={styles.boutonToggle} onClick={() => basculerActif(u)}>
                    {u.actif ? 'Désactiver' : 'Réactiver'}
                  </button>
                  <button style={styles.boutonSupprimer} onClick={() => supprimer(u)}>Supprimer</button>
                </>
              )}
            </div>
          ))}
        </div>
      )}

      {formulaireOuvert && (
        <FormulaireCompte
          roles={roles}
          onFermer={() => setFormulaireOuvert(false)}
          onCree={() => { setFormulaireOuvert(false); charger(); }}
        />
      )}
    </div>
  );
}

function FormulaireCompte({ roles, onFermer, onCree }) {
  const [champ, setChamp] = useState({ prenom: '', nom: '', email: '', mot_de_passe: '', role_id: '' });
  const [erreur, setErreur] = useState('');
  const [envoi, setEnvoi] = useState(false);

  function set(nomChamp, valeur) {
    setChamp((c) => ({ ...c, [nomChamp]: valeur }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setErreur('');
    setEnvoi(true);
    try {
      await api.creerUtilisateur({ ...champ, role_id: Number(champ.role_id) });
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
        <div style={styles.panneauEntete}>
          <h2 style={styles.panneauTitre}>Nouveau compte</h2>
          <button type="button" style={styles.fermer} onClick={onFermer}>✕</button>
        </div>

        <div style={styles.formGrille}>
          <Champ label="Prénom">
            <input required style={styles.input} value={champ.prenom} onChange={(e) => set('prenom', e.target.value)} />
          </Champ>
          <Champ label="Nom">
            <input required style={styles.input} value={champ.nom} onChange={(e) => set('nom', e.target.value)} />
          </Champ>
          <Champ label="Email" span={2}>
            <input required type="email" style={styles.input} value={champ.email} onChange={(e) => set('email', e.target.value)} />
          </Champ>
          <Champ label="Mot de passe provisoire" span={2}>
            <input required type="text" style={styles.input} value={champ.mot_de_passe} onChange={(e) => set('mot_de_passe', e.target.value)} placeholder="À communiquer à la personne" />
          </Champ>
          <Champ label="Rôle" span={2}>
            <select required style={styles.input} value={champ.role_id} onChange={(e) => set('role_id', e.target.value)}>
              <option value="">Choisir un rôle</option>
              {roles.map((r) => <option key={r.id} value={r.id}>{r.nom}</option>)}
            </select>
          </Champ>
        </div>

        {erreur && <div style={styles.erreurForm}>{erreur}</div>}

        <button type="submit" disabled={envoi} style={styles.boutonPrincipalLarge}>
          {envoi ? 'Création...' : 'Créer le compte'}
        </button>
      </form>
    </div>
  );
}

function Champ({ label, children, span }) {
  return (
    <label style={{ display: 'flex', flexDirection: 'column', gap: 5, gridColumn: span ? `span ${span}` : undefined }}>
      <span style={{ fontSize: 12.5, fontWeight: 600, color: 'var(--text-secondary)' }}>{label}</span>
      {children}
    </label>
  );
}

const styles = {
  entete: { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 28 },
  titre: { fontSize: 26 },
  sousTitre: { color: 'var(--text-secondary)', fontSize: 14, margin: '6px 0 0' },
  boutonPrincipal: {
    background: 'var(--ink)', color: 'white', border: 'none', borderRadius: 'var(--radius-sm)',
    padding: '10px 16px', fontWeight: 700, fontSize: 13.5, whiteSpace: 'nowrap',
  },
  texteAttente: { color: 'var(--text-secondary)', fontSize: 14 },
  liste: { display: 'flex', flexDirection: 'column', gap: 8 },
  ligne: {
    display: 'flex', alignItems: 'center', gap: 12,
    background: 'var(--card)', border: '1px solid var(--border)',
    borderRadius: 'var(--radius-md)', padding: '12px 14px',
  },
  avatarPetit: {
    width: 32, height: 32, borderRadius: '50%', background: 'var(--emerald-soft)', color: 'var(--emerald)',
    display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 700, flexShrink: 0,
  },
  badgeRole: {
    fontSize: 11.5, fontWeight: 700, padding: '4px 10px', borderRadius: 6,
    background: 'var(--canvas)', color: 'var(--text-secondary)', whiteSpace: 'nowrap',
  },
  badgeInactif: {
    fontSize: 11.5, fontWeight: 700, padding: '4px 10px', borderRadius: 6,
    background: 'var(--red-soft)', color: 'var(--red)', whiteSpace: 'nowrap',
  },
  boutonToggle: {
    background: 'var(--canvas)', border: 'none', borderRadius: 7, padding: '6px 11px',
    fontSize: 12, fontWeight: 700, color: 'var(--text-secondary)', whiteSpace: 'nowrap',
  },
  boutonSupprimer: {
    background: 'var(--red-soft)', border: 'none', borderRadius: 7, padding: '6px 11px',
    fontSize: 12, fontWeight: 700, color: 'var(--red)', whiteSpace: 'nowrap',
  },
  overlay: {
    position: 'fixed', inset: 0, background: 'rgba(28,37,54,0.45)',
    display: 'flex', justifyContent: 'flex-end', zIndex: 50,
  },
  panneau: {
    width: 440, maxWidth: '100%', background: 'var(--card)', height: '100%',
    padding: 28, overflowY: 'auto', display: 'flex', flexDirection: 'column',
  },
  panneauEntete: { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 20 },
  panneauTitre: { fontSize: 20 },
  fermer: { background: 'var(--canvas)', border: 'none', borderRadius: 8, width: 30, height: 30, fontSize: 14 },
  formGrille: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 },
  input: {
    padding: '10px 12px', borderRadius: 'var(--radius-sm)', border: '1.5px solid var(--border)',
    fontSize: 13.5, outline: 'none', width: '100%', fontFamily: 'var(--font-body)',
  },
  boutonPrincipalLarge: {
    background: 'var(--emerald)', color: 'white', border: 'none', borderRadius: 'var(--radius-sm)',
    padding: '13px', fontWeight: 700, fontSize: 14, marginTop: 22,
  },
  erreurForm: {
    background: 'var(--red-soft)', color: 'var(--red)', padding: '10px 12px',
    borderRadius: 'var(--radius-sm)', fontSize: 13, marginTop: 16,
  },
};
