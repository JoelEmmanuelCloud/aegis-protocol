import { createContext, useContext, useState, type ReactNode } from 'react';

interface DemoContextValue {
  isDemoMode: boolean;
  enableDemo: () => void;
  disableDemo: () => void;
  isBrowseMode: boolean;
  enableBrowse: () => void;
  disableBrowse: () => void;
}

const DemoContext = createContext<DemoContextValue>({
  isDemoMode: false,
  enableDemo: () => {},
  disableDemo: () => {},
  isBrowseMode: false,
  enableBrowse: () => {},
  disableBrowse: () => {},
});

export function DemoProvider({ children }: { children: ReactNode }) {
  const [isDemoMode, setIsDemoMode] = useState(false);
  const [isBrowseMode, setIsBrowseMode] = useState(false);
  return (
    <DemoContext.Provider
      value={{
        isDemoMode,
        enableDemo: () => { setIsDemoMode(true); setIsBrowseMode(false); },
        disableDemo: () => setIsDemoMode(false),
        isBrowseMode,
        enableBrowse: () => { setIsBrowseMode(true); setIsDemoMode(false); },
        disableBrowse: () => setIsBrowseMode(false),
      }}
    >
      {children}
    </DemoContext.Provider>
  );
}

export function useDemoMode() {
  return useContext(DemoContext);
}
