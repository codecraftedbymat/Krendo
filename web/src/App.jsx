import { useState } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Connexion from './pages/Connexion';
import Reinitialiser from './pages/Reinitialiser';
import CGU from './pages/CGU';
import Confidentialite from './pages/Confidentialite';
import Presentation from './pages/Presentation';
import Missions from './pages/Missions';
import Planning from './pages/Planning';
import Heures from './pages/Heures';
import Absences from './pages/Absences';
import Equipe from './pages/Equipe';
import Chat from './pages/Chat';
import Parametres from './pages/Parametres';
import Layout from './components/Layout';
import LayoutEmploye from './components/LayoutEmploye';
import MissionsEmploye from './pages/employe/MissionsEmploye';
import AbsencesEmploye from './pages/employe/AbsencesEmploye';
import Profil from './pages/employe/Profil';
import BackOffice from './BackOffice';
import { chargerSession } from './lib/api';

function estAdmin(utilisateur) {
  const p = utilisateur.permissions;
  return p.peut_creer_missions || p.peut_gerer_comptes || p.peut_valider_absences || p.peut_valider_heures || p.peut_modifier_creneaux || p.peut_voir_tout;
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/reinitialiser" element={<Reinitialiser />} />
        <Route path="/presentation" element={<Presentation />} />
        <Route path="/cgu" element={<CGU />} />
        <Route path="/confidentialite" element={<Confidentialite />} />
        <Route path="/backoffice/*" element={<BackOffice />} />
        <Route path="/*" element={<EspaceKrendo />} />
      </Routes>
    </BrowserRouter>
  );
}

function EspaceKrendo() {
  const [session, setSession] = useState(chargerSession());

  if (!session) {
    return <Connexion onConnecte={(utilisateur) => setSession({ utilisateur })} />;
  }

  return estAdmin(session.utilisateur)
    ? <EspaceAdmin utilisateur={session.utilisateur} />
    : <EspaceEmploye utilisateur={session.utilisateur} />;
}

function EspaceAdmin({ utilisateur }) {
  return (
    <Layout utilisateur={utilisateur}>
      <Routes>
        <Route path="/" element={<Missions utilisateur={utilisateur} />} />
        <Route path="/planning" element={<Planning />} />
        <Route path="/heures" element={<Heures utilisateur={utilisateur} />} />
        <Route path="/absences" element={<Absences utilisateur={utilisateur} />} />
        <Route path="/messages" element={<Chat utilisateur={utilisateur} />} />
        <Route path="/equipe" element={<Equipe utilisateur={utilisateur} />} />
        <Route path="/parametres" element={<Parametres />} />
      </Routes>
    </Layout>
  );
}

function EspaceEmploye({ utilisateur }) {
  return (
    <LayoutEmploye utilisateur={utilisateur}>
      <Routes>
        <Route path="/" element={<MissionsEmploye utilisateur={utilisateur} />} />
        <Route path="/absences" element={<AbsencesEmploye utilisateur={utilisateur} />} />
        <Route path="/messages" element={<Chat utilisateur={utilisateur} />} />
        <Route path="/profil" element={<Profil utilisateur={utilisateur} />} />
      </Routes>
    </LayoutEmploye>
  );
}
