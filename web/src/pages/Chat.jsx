import { useEffect, useRef, useState } from 'react';
import { api } from '../lib/api';

export default function Chat({ utilisateur }) {
  const [conversations, setConversations] = useState([]);
  const [conversationActive, setConversationActive] = useState(null);
  const [chargement, setChargement] = useState(true);
  const [nouvelleConvOuverte, setNouvelleConvOuverte] = useState(false);

  useEffect(() => { charger(); }, []);

  async function charger() {
    setChargement(true);
    try {
      const data = await api.conversations();
      setConversations(data);
      if (data.length && !conversationActive) setConversationActive(data[0]);
    } finally {
      setChargement(false);
    }
  }

  async function demarrerConversation(autreUtilisateurId) {
    const conv = await api.ouvrirConversation(autreUtilisateurId);
    setNouvelleConvOuverte(false);
    await charger();
    // On retrouve la conversation avec ses infos complètes (prénom/nom) après rechargement
    const data = await api.conversations();
    const trouvee = data.find((c) => c.id === conv.id);
    setConversationActive(trouvee || conv);
  }

  return (
    <div style={styles.page}>
      <div style={styles.colonneListe}>
        <div style={styles.listeEntete}>
          <h1 style={styles.titre}>Messages</h1>
          <button style={styles.boutonNouveau} title="Nouvelle conversation" onClick={() => setNouvelleConvOuverte(true)}>+</button>
        </div>
        {chargement ? (
          <p style={styles.texteAttente}>Chargement...</p>
        ) : conversations.length === 0 ? (
          <p style={styles.texteAttente}>Aucune conversation. Cliquez sur + pour en démarrer une.</p>
        ) : (
          <div style={styles.listeConv}>
            {conversations.map((c) => {
              const autre = c.utilisateur_a_id === utilisateur.id
                ? { prenom: c.prenom_b, nom: c.nom_b }
                : { prenom: c.prenom_a, nom: c.nom_a };
              const nonLu = c.dernier_message_expediteur_id && c.dernier_message_expediteur_id !== utilisateur.id && !c.dernier_message_lu;
              return (
                <button
                  key={c.id}
                  style={{ ...styles.itemConv, ...(conversationActive?.id === c.id ? styles.itemConvActif : {}) }}
                  onClick={() => setConversationActive(c)}
                >
                  <div style={styles.avatarPetit}>{autre.prenom[0]}{autre.nom[0]}</div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 13.5, fontWeight: 600 }}>{autre.prenom} {autre.nom}</div>
                    <div style={styles.dernierMessage}>{c.dernier_message || 'Nouvelle conversation'}</div>
                  </div>
                  {nonLu && <div style={styles.pointNonLu} />}
                </button>
              );
            })}
          </div>
        )}
      </div>

      <div style={styles.colonneChat}>
        {conversationActive ? (
          <FenetreMessages
            key={conversationActive.id}
            conversation={conversationActive}
            utilisateur={utilisateur}
            onMessageEnvoye={charger}
          />
        ) : (
          <div style={styles.vide}>Sélectionnez une conversation</div>
        )}
      </div>

      {nouvelleConvOuverte && (
        <NouvelleConversation
          utilisateur={utilisateur}
          conversationsExistantes={conversations}
          onFermer={() => setNouvelleConvOuverte(false)}
          onChoisir={demarrerConversation}
        />
      )}
    </div>
  );
}

function NouvelleConversation({ utilisateur, conversationsExistantes, onFermer, onChoisir }) {
  const [membres, setMembres] = useState([]);
  const [chargement, setChargement] = useState(true);
  const [recherche, setRecherche] = useState('');

  useEffect(() => {
    api.utilisateurs()
      .then((data) => setMembres(data.filter((u) => u.id !== utilisateur.id && u.actif)))
      .finally(() => setChargement(false));
  }, []);

  function conversationExistanteAvec(userId) {
    return conversationsExistantes.find(
      (c) => c.utilisateur_a_id === userId || c.utilisateur_b_id === userId
    );
  }

  const filtres = membres.filter((m) =>
    `${m.prenom} ${m.nom}`.toLowerCase().includes(recherche.toLowerCase())
  );

  return (
    <div style={styles.overlay} onClick={onFermer}>
      <div style={styles.panneauNouveau} onClick={(e) => e.stopPropagation()}>
        <div style={styles.panneauEntete}>
          <h2 style={styles.panneauTitre}>Nouvelle conversation</h2>
          <button style={styles.fermer} onClick={onFermer}>✕</button>
        </div>

        <input
          autoFocus
          placeholder="Rechercher un membre..."
          value={recherche}
          onChange={(e) => setRecherche(e.target.value)}
          style={styles.inputRecherche}
        />

        {chargement ? (
          <p style={styles.texteAttente}>Chargement...</p>
        ) : filtres.length === 0 ? (
          <p style={styles.texteAttente}>Aucun membre trouvé.</p>
        ) : (
          <div style={styles.listeMembres}>
            {filtres.map((m) => {
              const existe = conversationExistanteAvec(m.id);
              return (
                <button key={m.id} style={styles.itemMembre} onClick={() => onChoisir(m.id)}>
                  <div style={styles.avatarPetit}>{m.prenom[0]}{m.nom[0]}</div>
                  <div style={{ flex: 1, textAlign: 'left' }}>
                    <div style={{ fontSize: 13.5, fontWeight: 600 }}>{m.prenom} {m.nom}</div>
                    <div style={{ fontSize: 11.5, color: 'var(--text-secondary)' }}>{m.role}</div>
                  </div>
                  {existe && <span style={styles.etiquetteExiste}>Reprendre</span>}
                </button>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

function FenetreMessages({ conversation, utilisateur, onMessageEnvoye }) {
  const [messages, setMessages] = useState([]);
  const [texte, setTexte] = useState('');
  const [chargement, setChargement] = useState(true);
  const [pieceJointe, setPieceJointe] = useState(null);
  const [envoi, setEnvoi] = useState(false);
  const [erreur, setErreur] = useState('');
  const finRef = useRef(null);
  const inputFichierRef = useRef(null);

  const autre = conversation.utilisateur_a_id === utilisateur.id
    ? { prenom: conversation.prenom_b, nom: conversation.nom_b }
    : { prenom: conversation.prenom_a, nom: conversation.nom_a };

  useEffect(() => {
    api.messages(conversation.id).then(setMessages).finally(() => setChargement(false));
  }, [conversation.id]);

  // Rafraîchit toutes les 4s pour voir passer "Envoyé" -> "Lu" quand l'autre personne consulte
  useEffect(() => {
    const intervalle = setInterval(() => {
      api.messages(conversation.id).then(setMessages).catch(() => {});
    }, 4000);
    return () => clearInterval(intervalle);
  }, [conversation.id]);

  useEffect(() => {
    finRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  function choisirFichier(e) {
    const fichier = e.target.files[0];
    if (!fichier) return;
    setErreur('');
    if (fichier.size > 5 * 1024 * 1024) {
      setErreur('Fichier trop volumineux (5 Mo maximum).');
      e.target.value = '';
      return;
    }
    const lecteur = new FileReader();
    lecteur.onload = () => {
      setPieceJointe({ nom: fichier.name, type: fichier.type || 'application/octet-stream', data: lecteur.result });
    };
    lecteur.readAsDataURL(fichier);
  }

  async function envoyer(e) {
    e.preventDefault();
    if (!texte.trim() && !pieceJointe) return;
    setErreur('');
    setEnvoi(true);
    try {
      const message = await api.envoyerMessage(conversation.id, texte, pieceJointe);
      setMessages((m) => [...m, message]);
      setTexte('');
      setPieceJointe(null);
      if (inputFichierRef.current) inputFichierRef.current.value = '';
      onMessageEnvoye();
    } catch (err) {
      setErreur(err.message);
    } finally {
      setEnvoi(false);
    }
  }

  return (
    <>
      <div style={styles.chatEntete}>
        <div style={styles.avatarPetit}>{autre.prenom[0]}{autre.nom[0]}</div>
        <div style={{ fontSize: 14.5, fontWeight: 700 }}>{autre.prenom} {autre.nom}</div>
      </div>

      <div style={styles.zoneMessages}>
        {chargement ? (
          <p style={styles.texteAttente}>Chargement...</p>
        ) : (
          messages.map((m) => {
            const estMoi = m.expediteur_utilisateur_id === utilisateur.id;
            return (
              <div key={m.id} style={{ display: 'flex', flexDirection: 'column', alignItems: estMoi ? 'flex-end' : 'flex-start' }}>
                <div style={{ ...styles.bulle, ...(estMoi ? styles.bulleMoi : styles.bulleAutre) }}>
                  {m.piece_jointe_data && (
                    <PieceJointe nom={m.piece_jointe_nom} type={m.piece_jointe_type} data={m.piece_jointe_data} estMoi={estMoi} />
                  )}
                  {m.contenu && <div style={m.piece_jointe_data ? { marginTop: 6 } : undefined}>{m.contenu}</div>}
                </div>
                {estMoi && (
                  <span style={styles.statutMessage}>{m.lu ? 'Lu ✓✓' : 'Envoyé ✓'}</span>
                )}
              </div>
            );
          })
        )}
        <div ref={finRef} />
      </div>

      {pieceJointe && (
        <div style={styles.apercuPieceJointe}>
          {pieceJointe.type.startsWith('image/') ? (
            <img src={pieceJointe.data} alt={pieceJointe.nom} style={styles.miniature} />
          ) : (
            <span style={styles.iconeFichier}>📎</span>
          )}
          <span style={styles.nomFichier}>{pieceJointe.nom}</span>
          <button type="button" style={styles.retirerFichier} onClick={() => { setPieceJointe(null); if (inputFichierRef.current) inputFichierRef.current.value = ''; }}>✕</button>
        </div>
      )}
      {erreur && <div style={styles.erreurChat}>{erreur}</div>}

      <form onSubmit={envoyer} style={styles.zoneSaisie}>
        <input type="file" ref={inputFichierRef} onChange={choisirFichier} style={{ display: 'none' }} />
        <button type="button" style={styles.boutonTrombone} onClick={() => inputFichierRef.current?.click()} title="Joindre un fichier">📎</button>
        <input
          style={styles.inputMessage}
          value={texte}
          onChange={(e) => setTexte(e.target.value)}
          placeholder="Écrire un message..."
        />
        <button type="submit" disabled={envoi} style={styles.boutonEnvoyer}>{envoi ? '...' : 'Envoyer'}</button>
      </form>
    </>
  );
}

function PieceJointe({ nom, type, data, estMoi }) {
  if (type.startsWith('image/')) {
    return <img src={data} alt={nom} style={styles.imageJointe} onClick={() => window.open(data, '_blank')} />;
  }
  return (
    <a href={data} download={nom} style={{ ...styles.lienFichier, color: estMoi ? 'white' : 'var(--ink)' }}>
      📎 {nom}
    </a>
  );
}

const styles = {
  page: { display: 'flex', height: 'calc(100vh - 64px)', gap: 20, margin: '-32px -40px', padding: '32px 40px' },
  colonneListe: { width: 280, flexShrink: 0, display: 'flex', flexDirection: 'column' },
  listeEntete: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  boutonNouveau: {
    width: 28, height: 28, borderRadius: 8, background: 'var(--ink)', color: 'white',
    border: 'none', fontSize: 16, fontWeight: 700, lineHeight: 1,
  },
  titre: { fontSize: 22, margin: 0 },
  texteAttente: { color: 'var(--text-secondary)', fontSize: 13.5 },
  listeConv: { display: 'flex', flexDirection: 'column', gap: 4, overflowY: 'auto' },
  itemConv: {
    display: 'flex', alignItems: 'center', gap: 10, padding: '10px 10px',
    borderRadius: 'var(--radius-sm)', background: 'transparent', border: 'none', textAlign: 'left',
  },
  itemConvActif: { background: 'var(--card)', boxShadow: '0 1px 3px rgba(0,0,0,0.06)' },
  pointNonLu: { width: 8, height: 8, borderRadius: '50%', background: 'var(--emerald)', flexShrink: 0 },
  avatarPetit: {
    width: 32, height: 32, borderRadius: '50%', background: 'var(--emerald-soft)', color: 'var(--emerald)',
    display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 700, flexShrink: 0,
  },
  dernierMessage: {
    fontSize: 12, color: 'var(--text-secondary)', whiteSpace: 'nowrap',
    overflow: 'hidden', textOverflow: 'ellipsis',
  },
  colonneChat: {
    flex: 1, background: 'var(--card)', borderRadius: 'var(--radius-lg)',
    border: '1px solid var(--border)', display: 'flex', flexDirection: 'column', overflow: 'hidden',
  },
  vide: { flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)', fontSize: 14 },
  chatEntete: { display: 'flex', alignItems: 'center', gap: 10, padding: '14px 20px', borderBottom: '1px solid var(--border)' },
  zoneMessages: { flex: 1, overflowY: 'auto', padding: 20, display: 'flex', flexDirection: 'column', gap: 10 },
  bulle: { maxWidth: '65%', padding: '9px 13px', borderRadius: 14, fontSize: 13.5, lineHeight: 1.4 },
  bulleMoi: { background: 'var(--emerald)', color: 'white', borderBottomRightRadius: 4 },
  bulleAutre: { background: 'var(--canvas)', color: 'var(--text-primary)', borderBottomLeftRadius: 4 },
  zoneSaisie: { display: 'flex', gap: 8, padding: 16, borderTop: '1px solid var(--border)' },
  inputMessage: {
    flex: 1, padding: '10px 14px', borderRadius: 'var(--radius-sm)', border: '1.5px solid var(--border)',
    fontSize: 13.5, outline: 'none',
  },
  boutonEnvoyer: {
    background: 'var(--ink)', color: 'white', border: 'none', borderRadius: 'var(--radius-sm)',
    padding: '10px 18px', fontWeight: 700, fontSize: 13,
  },
  boutonTrombone: {
    background: 'var(--canvas)', border: 'none', borderRadius: 'var(--radius-sm)',
    width: 40, height: 40, fontSize: 16, flexShrink: 0,
  },
  apercuPieceJointe: {
    display: 'flex', alignItems: 'center', gap: 8, padding: '8px 16px',
    borderTop: '1px solid var(--border)', background: 'var(--canvas)',
  },
  miniature: { width: 32, height: 32, borderRadius: 6, objectFit: 'cover' },
  iconeFichier: { fontSize: 16 },
  nomFichier: { fontSize: 12.5, color: 'var(--text-secondary)', flex: 1, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' },
  retirerFichier: { background: 'none', border: 'none', color: 'var(--text-muted)', fontSize: 13, padding: 4 },
  erreurChat: {
    background: 'var(--red-soft)', color: 'var(--red)', padding: '8px 16px', fontSize: 12.5,
  },
  imageJointe: { maxWidth: 220, maxHeight: 220, borderRadius: 10, display: 'block', cursor: 'pointer' },
  lienFichier: { display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, fontWeight: 600, textDecoration: 'underline' },
  statutMessage: { fontSize: 10.5, color: 'var(--text-muted)', marginTop: 3, marginRight: 2 },
  overlay: {
    position: 'fixed', inset: 0, background: 'rgba(28,37,54,0.45)',
    display: 'flex', justifyContent: 'flex-end', zIndex: 50,
  },
  panneauNouveau: {
    width: 380, maxWidth: '100%', background: 'var(--card)', height: '100%',
    padding: 28, overflowY: 'auto', display: 'flex', flexDirection: 'column',
  },
  panneauEntete: { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 },
  panneauTitre: { fontSize: 18 },
  fermer: { background: 'var(--canvas)', border: 'none', borderRadius: 8, width: 30, height: 30, fontSize: 14 },
  inputRecherche: {
    padding: '9px 12px', borderRadius: 'var(--radius-sm)', border: '1.5px solid var(--border)',
    fontSize: 13, outline: 'none', marginBottom: 16, fontFamily: 'var(--font-body)',
  },
  listeMembres: { display: 'flex', flexDirection: 'column', gap: 4 },
  itemMembre: {
    display: 'flex', alignItems: 'center', gap: 10, padding: '9px 8px',
    background: 'transparent', border: 'none', borderRadius: 'var(--radius-sm)', textAlign: 'left',
  },
  etiquetteExiste: { fontSize: 10.5, color: 'var(--text-muted)', fontWeight: 600 },
};
