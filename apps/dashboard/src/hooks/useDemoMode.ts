import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface DemoModeStore {
  enabled: boolean;
  toggle: () => void;
}

export const useDemoMode = create<DemoModeStore>()(
  persist(
    (set) => ({
      enabled: false,
      toggle: () => set((s) => ({ enabled: !s.enabled })),
    }),
    { name: 'aegis-demo-mode' }
  )
);
