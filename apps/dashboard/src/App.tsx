import '@rainbow-me/rainbowkit/styles.css';
import { RainbowKitProvider } from '@rainbow-me/rainbowkit';
import { QueryClientProvider } from '@tanstack/react-query';
import { WagmiProvider, useAccount } from 'wagmi';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { ThemeProvider } from './context/ThemeContext';
import { DemoProvider, useDemoMode } from './context/DemoContext';
import { wagmiConfig } from './wagmi.config';
import { queryClient } from './lib/queryClient';
import AppShell from './components/AppShell';
import ConnectGate from './components/ConnectGate';
import ErrorBoundary from './components/ErrorBoundary';
import Landing from './pages/Landing';
import Slides from './screens/Slides';
import Overview from './screens/Overview';
import AgentProfile from './screens/AgentProfile';
import AttestationFeed from './screens/AttestationFeed';
import DecisionTimeline from './screens/DecisionTimeline';
import DisputeUI from './screens/DisputeUI';
import KeeperAuditTrail from './screens/KeeperAuditTrail';
import Register from './screens/Register';

function AppRoutes() {
  const { isConnected } = useAccount();
  const { isDemoMode, isBrowseMode } = useDemoMode();
  const hasAccess = isConnected || isDemoMode || isBrowseMode;

  return (
    <Routes>
      <Route path="/" element={<Landing />} />
      <Route path="/slides" element={<Slides />} />
      <Route
        path="/app/*"
        element={
          hasAccess ? (
            <AppShell>
              <ErrorBoundary>
                <Routes>
                  <Route path="/" element={<Overview />} />
                  <Route path="/register" element={<Register />} />
                  <Route path="/attestations" element={<AttestationFeed />} />
                  <Route path="/timeline" element={<DecisionTimeline />} />
                  <Route path="/disputes" element={<DisputeUI />} />
                  <Route path="/agents" element={<AgentProfile />} />
                  <Route path="/audit" element={<KeeperAuditTrail />} />
                  <Route path="*" element={<Navigate to="/app" replace />} />
                </Routes>
              </ErrorBoundary>
            </AppShell>
          ) : (
            <ConnectGate />
          )
        }
      />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default function App() {
  return (
    <ThemeProvider>
      <DemoProvider>
        <WagmiProvider config={wagmiConfig}>
          <QueryClientProvider client={queryClient}>
            <RainbowKitProvider>
              <BrowserRouter>
                <AppRoutes />
              </BrowserRouter>
            </RainbowKitProvider>
          </QueryClientProvider>
        </WagmiProvider>
      </DemoProvider>
    </ThemeProvider>
  );
}
