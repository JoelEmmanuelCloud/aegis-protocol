/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_WALLETCONNECT_PROJECT_ID: string;
  readonly VITE_ORCHESTRATOR_URL: string;
  readonly VITE_AGENT_REGISTRY_ADDRESS: string;
  readonly VITE_PUBLIC_RESOLVER_ADDRESS: string;
  readonly VITE_0G_EXPLORER_URL: string;
  readonly VITE_KEEPERHUB_WORKFLOW_ID: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
