import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../lib/api';

export default function Missions({ utilisateur }) {
  const [missions, setMissions] = useState([]);
  const [chargement, setChargement] = useState(true);
  const [missionOuverte, setMissionOuverte] = useState(null);
  const [formulaireOuvert, setFormulaireOuvert] = useState(false);
  const [missionEnEdition, setMissionEnEdition] = useState(null);

  const peutCreer = utilisateur.permissions.peut_creer_missions || utilisateur.permissions.peut_voir_tout;

  useEffect(() => { chargerMissions(); }, []);

  async function chargerMissions() {
    setChargement(true);
    try {
      const data = await api.missions();
      setMissions(data.sort((a, b) => new Date(a.date_debut) - new Date(b.date_debut)));
    } finally {
      setChargement(false);
    }
  }

  return (
    <div>
      <div style={styles.entete}>
        <div>
          <h1 style={styles.titre}>Missions</h1>
          <p style={styles.sousTitre}>Créez une mission et suivez les disponibilités de votre équipe.</p>
        </div>
        {peutCreer && (
          <button style={styles.boutonPrincipal} onClick={() => setFormulaireOuvert(true)}>
            + Nouvelle mission
          </button>
        )}
      </div>

      {chargement ? (
        <p style={styles.texteAttente}>Chargement des missions...</p>
      ) : missions.length === 0 ? (
        <div style={styles.vide}>
          <p style={{ margin: 0, fontWeight: 600 }}>Aucune mission pour l'instant</p>
          <p style={{ margin: '4px 0 0', color: 'var(--text-secondary)', fontSize: 13.5 }}>
            Créez votre première mission pour notifier votre équipe.
          </p>
        </div>
      ) : (
        <div style={styles.grille}>
          {missions.map((m) => (
            <CarteMission key={m.id} mission={m} onOuvrir={() => setMissionOuverte(m)} />
          ))}
        </div>
      )}

      {missionOuverte && (
        <DetailMission
          mission={missionOuverte}
          utilisateur={utilisateur}
          onFermer={() => setMissionOuverte(null)}
          onModifier={() => { setMissionEnEdition(missionOuverte); setMissionOuverte(null); }}
          onSupprime={() => { setMissionOuverte(null); chargerMissions(); }}
        />
      )}

      {formulaireOuvert && (
        <FormulaireMission
          onFermer={() => setFormulaireOuvert(false)}
          onCree={() => { setFormulaireOuvert(false); chargerMissions(); }}
        />
      )}

      {missionEnEdition && (
        <FormulaireMission
          missionExistante={missionEnEdition}
          onFermer={() => setMissionEnEdition(null)}
          onCree={() => { setMissionEnEdition(null); chargerMissions(); }}
        />
      )}
    </div>
  );
}

function CarteMission({ mission, onOuvrir }) {
  return (
    <button style={styles.carteMission} onClick={onOuvrir}>
      <div style={styles.carteHaut}>
        <h3 style={styles.carteTitre}>{mission.titre}</h3>
        <span style={styles.badgeRequis}>{mission.nb_employes_requis} pers.</span>
      </div>
      <p style={styles.carteInfo}>
        {formatDate(mission.date_debut)} · {mission.heure_debut}–{mission.heure_fin}
      </p>
      {mission.lieu && <p style={styles.carteLieu}>📍 {mission.lieu}</p>}
    </button>
  );
}

function DetailMission({ mission, utilisateur, onFermer, onModifier, onSupprime }) {
  const [onglet, setOnglet] = useState('heures');
  const [reponses, setReponses] = useState([]);
  const [chargement, setChargement] = useState(true);
  const [visibleTous, setVisibleTous] = useState(mission.planning_visible_tous);
  const [suppression, setSuppression] = useState(false);
  const navigate = useNavigate();

  const peutModifierCreneaux = utilisateur.permissions.peut_modifier_creneaux || utilisateur.permissions.peut_voir_tout;
  const peutValiderHeures = utilisateur.permissions.peut_valider_heures || utilisateur.permissions.peut_voir_tout;
  const peutGererMission = utilisateur.permissions.peut_creer_missions || utilisateur.permissions.peut_voir_tout;

  useEffect(() => {
    api.reponsesMission(mission.id).then(setReponses).finally(() => setChargement(false));
  }, [mission.id]);

  async function ouvrirChat(utilisateurId) {
    const conv = await api.ouvrirConversation(utilisateurId, mission.id);
    navigate(`/messages?conv=${conv.id}`);
  }

  async function basculerVisibilite() {
    const nouveauStatut = !visibleTous;
    setVisibleTous(nouveauStatut);
    await api.majMission(mission.id, { planning_visible_tous: nouveauStatut });
  }

  async function supprimer() {
    const confirmation = window.confirm(
      `Supprimer définitivement la mission "${mission.titre}" ?\n\nCela supprimera aussi les réponses, créneaux et conversations liés à cette mission.`
    );
    if (!confirmation) return;
    setSuppression(true);
    try {
      await api.supprimerMission(mission.id);
      onSupprime();
    } finally {
      setSuppression(false);
    }
  }

  const disponibles = reponses.filter((r) => r.statut === 'disponible').length;
  const indisponibles = reponses.filter((r) => r.statut === 'indisponible').length;
  const enAttente = reponses.filter((r) => r.statut === 'en_attente').length;

  return (
    <div style={styles.overlay} onClick={onFermer}>
      <div style={styles.panneau} onClick={(e) => e.stopPropagation()}>
        <div style={styles.panneauEntete}>
          <div>
            <h2 style={styles.panneauTitre}>{mission.titre}</h2>
            <p style={styles.carteInfo}>
              {formatDate(mission.date_debut)} · {mission.heure_debut}–{mission.heure_fin}
              {mission.lieu ? ` · ${mission.lieu}` : ''}
            </p>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            {peutGererMission && (
              <>
                <button style={styles.boutonIcone} title="Modifier" onClick={onModifier}>✏️</button>
                <button style={styles.boutonIcone} title="Supprimer" onClick={supprimer} disabled={suppression}>🗑️</button>
              </>
            )}
            <button style={styles.fermer} onClick={onFermer}>✕</button>
          </div>
        </div>

        {peutGererMission && (
          <div style={styles.blocVisibilite}>
            <div>
              <p style={styles.visibiliteTitre}>Planning visible par toute l'équipe</p>
              <p style={styles.visibiliteDescription}>
                {visibleTous ? "Chaque employé peut voir qui travaille et à quel poste." : "Seuls les admins voient ce planning."}
              </p>
            </div>
            <Interrupteur actif={visibleTous} onClick={basculerVisibilite} />
          </div>
        )}

        <div style={styles.statsRangee}>
          <StatBloc label="Requis" valeur={mission.nb_employes_requis} couleur="var(--ink)" />
          <StatBloc label="Disponibles" valeur={disponibles} couleur="var(--emerald)" fond="var(--emerald-soft)" />
          <StatBloc label="Indisponibles" valeur={indisponibles} couleur="var(--red)" fond="var(--red-soft)" />
        </div>

        <BarreSegmentee disponibles={disponibles} indisponibles={indisponibles} enAttente={enAttente} />

        <div style={styles.onglets}>
          <button
            style={{ ...styles.onglet, ...(onglet === 'heures' ? styles.ongletActif : {}) }}
            onClick={() => setOnglet('heures')}
          >Planning</button>
          <button
            style={{ ...styles.onglet, ...(onglet === 'reponses' ? styles.ongletActif : {}) }}
            onClick={() => setOnglet('reponses')}
          >Réponses</button>
        </div>

        {onglet === 'reponses' ? (
          chargement ? (
            <p style={styles.texteAttente}>Chargement...</p>
          ) : (
            <div style={styles.listeReponses}>
              {reponses.map((r) => (
                <div key={r.id} style={styles.ligneReponse}>
                  <div style={styles.reponseGauche}>
                    <div style={styles.avatarPetit}>{r.prenom[0]}{r.nom[0]}</div>
                    <div>
                      <div style={{ fontSize: 13.5, fontWeight: 600 }}>{r.prenom} {r.nom}</div>
                      {r.commentaire && (
                        <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>Motif : {r.commentaire}</div>
                      )}
                    </div>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <StatutBadge statut={r.statut} />
                    <button style={styles.boutonChat} title="Ouvrir la conversation" onClick={() => ouvrirChat(r.utilisateur_id)}>💬</button>
                  </div>
                </div>
              ))}
            </div>
          )
        ) : (
          <SectionHeures
            mission={mission}
            reponses={reponses.filter((r) => r.statut === 'disponible')}
            peutModifier={peutModifierCreneaux}
            peutValider={peutValiderHeures}
            onChat={ouvrirChat}
          />
        )}
      </div>
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

function SectionHeures({ mission, reponses, peutModifier, peutValider, onChat }) {
  const [creneaux, setCreneaux] = useState([]);
  const [chargement, setChargement] = useState(true);
  const [edition, setEdition] = useState(null);

  useEffect(() => { charger(); }, [mission.id]);

  async function charger() {
    setChargement(true);
    try {
      setCreneaux(await api.creneauxMission(mission.id));
    } finally {
      setChargement(false);
    }
  }

  function creneauDe(utilisateurId) {
    return creneaux.find((c) => c.utilisateur_id === utilisateurId && !c.est_heure_supplementaire);
  }

  if (chargement) return <p style={styles.texteAttente}>Chargement...</p>;

  if (reponses.length === 0) {
    return <p style={styles.texteAttente}>Aucun employé disponible pour l'instant.</p>;
  }

  return (
    <div style={styles.listeReponses}>
      {reponses.map((r) => {
        const creneau = creneauDe(r.utilisateur_id);
        return (
          <div key={r.utilisateur_id} style={styles.ligneHeure}>
            <div style={styles.reponseGauche}>
              <div style={styles.avatarPetit}>{r.prenom[0]}{r.nom[0]}</div>
              <div>
                <div style={{ fontSize: 13.5, fontWeight: 600 }}>{r.prenom} {r.nom}</div>
                {creneau?.poste && <div style={styles.posteTexte}>{creneau.poste}</div>}
              </div>
            </div>

            {edition === r.utilisateur_id ? (
              <FormulaireCreneau
                mission={mission}
                utilisateurId={r.utilisateur_id}
                initial={creneau}
                onAnnuler={() => setEdition(null)}
                onEnregistre={() => { setEdition(null); charger(); }}
              />
            ) : creneau ? (
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                <span style={styles.heureTexte}>{creneau.heure_debut}–{creneau.heure_fin}</span>
                <StatutValidationBadge statut={creneau.statut_validation} />
                {peutValider && creneau.statut_validation === 'en_attente' && (
                  <>
                    <button style={styles.boutonMini} onClick={() => api.validerCreneau(creneau.id, 'valide').then(charger)}>Valider</button>
                    <button style={styles.boutonMiniAnnuler} onClick={() => api.validerCreneau(creneau.id, 'annule').then(charger)}>Annuler</button>
                  </>
                )}
                {peutModifier && (
                  <button style={styles.boutonMini} onClick={() => setEdition(r.utilisateur_id)}>Modifier</button>
                )}
                <button style={styles.boutonChat} title="Ouvrir la conversation" onClick={() => onChat(r.utilisateur_id)}>💬</button>
              </div>
            ) : peutModifier ? (
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <button style={styles.boutonMini} onClick={() => setEdition(r.utilisateur_id)}>Définir un créneau</button>
                <button style={styles.boutonChat} title="Ouvrir la conversation" onClick={() => onChat(r.utilisateur_id)}>💬</button>
              </div>
            ) : (
              <span style={styles.texteAttente}>Non défini</span>
            )}
          </div>
        );
      })}
    </div>
  );
}

function FormulaireCreneau({ mission, utilisateurId, initial, onAnnuler, onEnregistre }) {
  const [heureDebut, setHeureDebut] = useState(initial?.heure_debut || mission.heure_debut);
  const [heureFin, setHeureFin] = useState(initial?.heure_fin || mission.heure_fin);
  const [poste, setPoste] = useState(initial?.poste || '');
  const [heureSup, setHeureSup] = useState(false);

  async function enregistrer() {
    await api.definirCreneau(mission.id, utilisateurId, {
      heure_debut: heureDebut, heure_fin: heureFin, poste: poste || null,
      est_heure_supplementaire: heureSup,
    });
    onEnregistre();
  }

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
      <input type="time" value={heureDebut} onChange={(e) => setHeureDebut(e.target.value)} style={styles.inputHeure} />
      <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>à</span>
      <input type="time" value={heureFin} onChange={(e) => setHeureFin(e.target.value)} style={styles.inputHeure} />
      <input type="text" value={poste} onChange={(e) => setPoste(e.target.value)} placeholder="Poste (ex: Accueil)" style={styles.inputPoste} />
      <label style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 11.5, color: 'var(--text-secondary)' }}>
        <input type="checkbox" checked={heureSup} onChange={(e) => setHeureSup(e.target.checked)} /> H. sup.
      </label>
      <button style={styles.boutonMini} onClick={enregistrer}>OK</button>
      <button style={styles.boutonMiniAnnuler} onClick={onAnnuler}>✕</button>
    </div>
  );
}

function StatutValidationBadge({ statut }) {
  const config = {
    en_attente: { texte: 'À valider', fond: 'var(--amber-soft)', couleur: 'var(--amber)' },
    valide: { texte: 'Validé', fond: 'var(--emerald-soft)', couleur: 'var(--emerald)' },
    annule: { texte: 'Annulé', fond: 'var(--red-soft)', couleur: 'var(--red)' },
  }[statut];
  return <span style={{ ...styles.badge, background: config.fond, color: config.couleur }}>{config.texte}</span>;
}

function StatBloc({ label, valeur, couleur, fond }) {
  return (
    <div style={{ ...styles.statBloc, background: fond || 'var(--canvas)' }}>
      <div style={{ fontSize: 12.5, color: couleur, fontWeight: 600 }}>{label}</div>
      <div style={{ fontFamily: 'var(--font-mono)', fontSize: 22, fontWeight: 600, color: couleur }}>{valeur}</div>
    </div>
  );
}

function BarreSegmentee({ disponibles, indisponibles, enAttente }) {
  const total = disponibles + indisponibles + enAttente || 1;
  return (
    <div style={styles.barreConteneur}>
      <div style={{ width: `${(disponibles / total) * 100}%`, background: 'var(--emerald)' }} />
      <div style={{ width: `${(indisponibles / total) * 100}%`, background: 'var(--red)' }} />
      <div style={{ width: `${(enAttente / total) * 100}%`, background: 'var(--border)' }} />
    </div>
  );
}

function StatutBadge({ statut }) {
  const config = {
    disponible: { texte: 'Disponible', fond: 'var(--emerald-soft)', couleur: 'var(--emerald)' },
    indisponible: { texte: 'Indisponible', fond: 'var(--red-soft)', couleur: 'var(--red)' },
    en_attente: { texte: 'En attente', fond: 'var(--canvas)', couleur: 'var(--text-secondary)' },
  }[statut];
  return (
    <span style={{ ...styles.badge, background: config.fond, color: config.couleur }}>{config.texte}</span>
  );
}

function FormulaireMission({ missionExistante, onFermer, onCree }) {
  const [champ, setChamp] = useState(() => missionExistante ? {
    titre: missionExistante.titre, lieu: missionExistante.lieu || '',
    date_debut: missionExistante.date_debut, heure_debut: missionExistante.heure_debut,
    date_fin: missionExistante.date_fin, heure_fin: missionExistante.heure_fin,
    nb_employes_requis: missionExistante.nb_employes_requis, description: missionExistante.description || '',
  } : {
    titre: '', lieu: '', date_debut: '', heure_debut: '08:00',
    date_fin: '', heure_fin: '18:00', nb_employes_requis: 1, description: '',
  });
  const [recurrente, setRecurrente] = useState(false);
  const [nbOccurrences, setNbOccurrences] = useState(4);
  const [erreur, setErreur] = useState('');
  const [envoi, setEnvoi] = useState(false);

  function set(champNom, valeur) {
    setChamp((c) => ({ ...c, [champNom]: valeur }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setErreur('');
    setEnvoi(true);
    try {
      const donnees = { ...champ, nb_employes_requis: Number(champ.nb_employes_requis) };
      if (missionExistante) {
        await api.majMission(missionExistante.id, donnees);
      } else {
        if (recurrente) {
          donnees.recurrence = { repeter_chaque_semaine: true, nombre_occurrences: Number(nbOccurrences) };
        }
        await api.creerMission(donnees);
      }
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
          <h2 style={styles.panneauTitre}>{missionExistante ? 'Modifier la mission' : 'Nouvelle mission'}</h2>
          <button type="button" style={styles.fermer} onClick={onFermer}>✕</button>
        </div>

        <div style={styles.formGrille}>
          <Champ label="Titre" span={2}>
            <input required style={styles.input} value={champ.titre} onChange={(e) => set('titre', e.target.value)} placeholder="Salon Tech Expo" />
          </Champ>
          <Champ label="Lieu" span={2}>
            <input style={styles.input} value={champ.lieu} onChange={(e) => set('lieu', e.target.value)} placeholder="Paris Expo" />
          </Champ>
          <Champ label="Date de début">
            <input required type="date" style={styles.input} value={champ.date_debut} onChange={(e) => set('date_debut', e.target.value)} />
          </Champ>
          <Champ label="Heure de début">
            <input required type="time" style={styles.input} value={champ.heure_debut} onChange={(e) => set('heure_debut', e.target.value)} />
          </Champ>
          <Champ label="Date de fin">
            <input required type="date" style={styles.input} value={champ.date_fin} onChange={(e) => set('date_fin', e.target.value)} />
          </Champ>
          <Champ label="Heure de fin">
            <input required type="time" style={styles.input} value={champ.heure_fin} onChange={(e) => set('heure_fin', e.target.value)} />
          </Champ>
          <Champ label="Employés requis">
            <input required type="number" min="1" style={styles.input} value={champ.nb_employes_requis} onChange={(e) => set('nb_employes_requis', e.target.value)} />
          </Champ>
          <Champ label="Description" span={2}>
            <textarea style={{ ...styles.input, resize: 'vertical', minHeight: 60 }} value={champ.description} onChange={(e) => set('description', e.target.value)} />
          </Champ>
        </div>

        {!missionExistante && (
          <div style={styles.blocRecurrence}>
            <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, fontWeight: 600 }}>
              <input type="checkbox" checked={recurrente} onChange={(e) => setRecurrente(e.target.checked)} />
              Répéter cette mission chaque semaine
            </label>
            {recurrente && (
              <label style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 10, fontSize: 12.5 }}>
                <span style={{ color: 'var(--text-secondary)' }}>Nombre de semaines (dont celle-ci) :</span>
                <input
                  type="number" min="2" max="52" style={{ ...styles.input, width: 70 }}
                  value={nbOccurrences} onChange={(e) => setNbOccurrences(e.target.value)}
                />
              </label>
            )}
          </div>
        )}

        {erreur && <div style={styles.erreurForm}>{erreur}</div>}

        <button type="submit" disabled={envoi} style={styles.boutonPrincipalLarge}>
          {envoi ? 'Enregistrement...' : missionExistante ? 'Enregistrer les modifications' : recurrente ? `Créer ${nbOccurrences} missions et notifier l'équipe` : 'Créer et notifier l\'équipe'}
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

function formatDate(iso) {
  const d = new Date(iso + 'T00:00:00');
  return d.toLocaleDateString('fr-FR', { day: 'numeric', month: 'long' });
}

const styles = {
  blocVisibilite: {
    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
    background: 'var(--canvas)', borderRadius: 'var(--radius-sm)', padding: '10px 14px', marginBottom: 16,
  },
  visibiliteTitre: { fontSize: 12.5, fontWeight: 700, margin: 0 },
  visibiliteDescription: { fontSize: 11.5, color: 'var(--text-secondary)', margin: '2px 0 0' },
  interrupteur: {
    width: 40, height: 22, borderRadius: 11, border: 'none', position: 'relative', flexShrink: 0, padding: 0, marginLeft: 12,
    outline: 'none', boxShadow: 'none', WebkitAppearance: 'none', appearance: 'none', overflow: 'hidden',
  },
  interrupteurRond: {
    position: 'absolute', top: 2, width: 18, height: 18, borderRadius: '50%', background: 'white',
    transition: 'transform 0.15s',
  },
  posteTexte: { fontSize: 11.5, color: 'var(--emerald)', fontWeight: 600, marginTop: 1 },
  inputPoste: {
    padding: '5px 8px', borderRadius: 6, border: '1.5px solid var(--border)', fontSize: 12, width: 130,
  },
  entete: { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 28 },
  titre: { fontSize: 26 },
  sousTitre: { color: 'var(--text-secondary)', fontSize: 14, margin: '6px 0 0' },
  boutonPrincipal: {
    background: 'var(--ink)', color: 'white', border: 'none', borderRadius: 'var(--radius-sm)',
    padding: '10px 16px', fontWeight: 700, fontSize: 13.5, whiteSpace: 'nowrap',
  },
  boutonPrincipalLarge: {
    background: 'var(--emerald)', color: 'white', border: 'none', borderRadius: 'var(--radius-sm)',
    padding: '13px', fontWeight: 700, fontSize: 14, marginTop: 22,
  },
  grille: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: 14 },
  carteMission: {
    textAlign: 'left', background: 'var(--card)', border: '1px solid var(--border)',
    borderRadius: 'var(--radius-md)', padding: 18, cursor: 'pointer',
  },
  carteHaut: { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 8 },
  carteTitre: { fontSize: 15.5, margin: 0 },
  badgeRequis: {
    fontSize: 11, fontWeight: 700, background: 'var(--canvas)', color: 'var(--text-secondary)',
    padding: '3px 8px', borderRadius: 6, whiteSpace: 'nowrap',
  },
  carteInfo: { fontSize: 13, color: 'var(--text-secondary)', margin: '8px 0 0' },
  carteLieu: { fontSize: 12.5, color: 'var(--text-muted)', margin: '4px 0 0' },
  texteAttente: { color: 'var(--text-secondary)', fontSize: 14 },
  vide: {
    background: 'var(--card)', border: '1px dashed var(--border)', borderRadius: 'var(--radius-md)',
    padding: 36, textAlign: 'center',
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
  boutonIcone: { background: 'var(--canvas)', border: 'none', borderRadius: 8, width: 30, height: 30, fontSize: 13 },
  statsRangee: { display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10, marginBottom: 14 },
  statBloc: { borderRadius: 'var(--radius-sm)', padding: '10px 12px' },
  barreConteneur: { display: 'flex', height: 8, borderRadius: 4, overflow: 'hidden', marginBottom: 24, background: 'var(--border)' },
  sectionLabel: { fontSize: 12.5, fontWeight: 700, color: 'var(--text-secondary)', marginBottom: 10 },
  listeReponses: { display: 'flex', flexDirection: 'column', gap: 8 },
  ligneReponse: {
    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
    padding: '10px 12px', background: 'var(--canvas)', borderRadius: 'var(--radius-sm)',
  },
  reponseGauche: { display: 'flex', alignItems: 'center', gap: 10 },
  avatarPetit: {
    width: 28, height: 28, borderRadius: '50%', background: 'var(--emerald-soft)', color: 'var(--emerald)',
    display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10.5, fontWeight: 700,
  },
  badge: { fontSize: 11.5, fontWeight: 700, padding: '4px 10px', borderRadius: 6, whiteSpace: 'nowrap' },
  boutonChat: {
    background: 'var(--canvas)', border: 'none', borderRadius: 7, width: 28, height: 28,
    fontSize: 13, display: 'flex', alignItems: 'center', justifyContent: 'center',
  },
  onglets: { display: 'flex', gap: 4, marginBottom: 16, borderBottom: '1px solid var(--border)' },
  onglet: {
    background: 'none', border: 'none', padding: '8px 4px', marginRight: 16,
    fontSize: 13, fontWeight: 700, color: 'var(--text-muted)', borderBottom: '2px solid transparent',
  },
  ongletActif: { color: 'var(--ink)', borderBottomColor: 'var(--emerald)' },
  ligneHeure: {
    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
    padding: '10px 12px', background: 'var(--canvas)', borderRadius: 'var(--radius-sm)', flexWrap: 'wrap', gap: 8,
  },
  heureTexte: { fontFamily: 'var(--font-mono)', fontSize: 13, fontWeight: 600 },
  inputHeure: {
    padding: '5px 7px', borderRadius: 6, border: '1.5px solid var(--border)', fontSize: 12.5, width: 84,
  },
  boutonMini: {
    background: 'var(--ink)', color: 'white', border: 'none', borderRadius: 6,
    padding: '5px 10px', fontSize: 11.5, fontWeight: 700,
  },
  boutonMiniAnnuler: {
    background: 'var(--canvas)', color: 'var(--text-secondary)', border: '1px solid var(--border)', borderRadius: 6,
    padding: '5px 10px', fontSize: 11.5, fontWeight: 700,
  },
  formGrille: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 },
  input: {
    padding: '10px 12px', borderRadius: 'var(--radius-sm)', border: '1.5px solid var(--border)',
    fontSize: 13.5, outline: 'none', width: '100%',
  },
  erreurForm: {
    background: 'var(--red-soft)', color: 'var(--red)', padding: '10px 12px',
    borderRadius: 'var(--radius-sm)', fontSize: 13, marginTop: 16,
  },
};
