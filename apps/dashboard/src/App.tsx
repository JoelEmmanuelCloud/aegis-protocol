import { RainbowKitProvider } from '@rainbow-me/rainbowkit';
import { QueryClientProvider } from '@tanstack/react-query';
import { WagmiProvider } from 'wagmi';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { wagmiConfig } from './wagmi.config';
import { queryClient } from './lib/queryClient';
import Layout from './components/Layout';
import ErrorBoundary from './components/ErrorBoundary';
import Overview from './screens/Overview';
import AgentProfile from './screens/AgentProfile';
import AttestationFeed from './screens/AttestationFeed';
import DecisionTimeline from './screens/DecisionTimeline';
import DisputeUI from './screens/DisputeUI';
import KeeperAuditTrail from './screens/KeeperAuditTrail';
import Register from './screens/Register';

export default function App() {
  return (
    <WagmiProvider config={wagmiConfig}>
      <QueryClientProvider client={queryClient}>
        <RainbowKitProvider>
          <BrowserRouter>
            <ErrorBoundary>
              <Layout>
                <Routes>
                  <Route path="/" element={<Overview />} />
                  <Route path="/agents" element={<AgentProfile />} />
                  <Route path="/attestations" element={<AttestationFeed />} />
                  <Route path="/timeline" element={<DecisionTimeline />} />
                  <Route path="/disputes" element={<DisputeUI />} />
                  <Route path="/audit" element={<KeeperAuditTrail />} />
                  <Route path="/register" element={<Register />} />
                </Routes>
              </Layout>
            </ErrorBoundary>
          </BrowserRouter>
        </RainbowKitProvider>
      </QueryClientProvider>
    </WagmiProvider>
  );
}
