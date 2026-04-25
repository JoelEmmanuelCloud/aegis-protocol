import { createContext, useContext, useState, type ReactNode } from 'react';

interface DemoContextValue {
  isDemoMode: boolean;
  enableDemo: () => void;
  disableDemo: () => void;
}

const DemoContext = createContext<DemoContextValue>({
  isDemoMode: false,
  enableDemo: () => {},
  disableDemo: () => {},
});

export function DemoProvider({ children }: { children: ReactNode }) {
  const [isDemoMode, setIsDemoMode] = useState(false);
  return (
    <DemoContext.Provider
      value={{
        isDemoMode,
        enableDemo: () => setIsDemoMode(true),
        disableDemo: () => setIsDemoMode(false),
      }}
    >
      {children}
    </DemoContext.Provider>
  );
}

export function useDemoMode() {
  return useContext(DemoContext);
}
