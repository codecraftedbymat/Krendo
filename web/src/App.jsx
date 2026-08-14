import { useState } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Connexion from './pages/Connexion';
import Missions from './pages/Missions';
import Absences from './pages/Absences';
import Equipe from './pages/Equipe';
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
          <Route path="/" element={<Missions />} />
          <Route path="/absences" element={<Absences />} />
          <Route path="/equipe" element={<Equipe />} />
        </Routes>
      </Layout>
    </BrowserRouter>
  );
}
