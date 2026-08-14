import { useState } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Connexion from './pages/Connexion';
import Missions from './pages/Missions';
import Planning from './pages/Planning';
import Heures from './pages/Heures';
import Absences from './pages/Absences';
import Equipe from './pages/Equipe';
import Chat from './pages/Chat';
import Layout from './components/Layout';
import { chargerSession } from './lib/api';

export default function App() {
  const [session, setSession] = useState(chargerSession());

  if (!session) {
    return <Connexion onConnecte={(utilisateur) => setSession({ utilisateur })} />;
  }

  return (
    <BrowserRouter>
      <Layout utilisateur={session.utilisateur}>
        <Routes>
          <Route path="/" element={<Missions utilisateur={session.utilisateur} />} />
          <Route path="/planning" element={<Planning />} />
          <Route path="/heures" element={<Heures utilisateur={session.utilisateur} />} />
          <Route path="/absences" element={<Absences />} />
          <Route path="/messages" element={<Chat utilisateur={session.utilisateur} />} />
          <Route path="/equipe" element={<Equipe utilisateur={session.utilisateur} />} />
        </Routes>
      </Layout>
    </BrowserRouter>
  );
}
