import { createContext, useContext, useState } from 'react';
import { chargerLangue, sauvegarderLangue, traduire } from './i18n';

const LangueContext = createContext(null);

export function LangueProvider({ children }) {
  const [langue, setLangueState] = useState(chargerLangue());

  function setLangue(nouvelle) {
    setLangueState(nouvelle);
    sauvegarderLangue(nouvelle);
  }

  const t = (cle) => traduire(langue, cle);

  return (
    <LangueContext.Provider value={{ langue, setLangue, t }}>
      {children}
    </LangueContext.Provider>
  );
}

export function useTranslation() {
  const contexte = useContext(LangueContext);
  if (!contexte) throw new Error('useTranslation doit être utilisé dans un LangueProvider');
  return contexte;
}
