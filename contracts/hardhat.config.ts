import { HardhatUserConfig } from 'hardhat/config';
import '@nomicfoundation/hardhat-toolbox';
import path from 'path';

try {
  (process as NodeJS.Process & { loadEnvFile?: (p: string) => void }).loadEnvFile?.(
    path.resolve(__dirname, '../.env')
  );
} catch {}

const config: HardhatUserConfig = {
  solidity: {
    version: '0.8.24',
    settings: {
      optimizer: {
        enabled: true,
        runs: 200,
      },
      evmVersion: 'cancun',
    },
  },
  paths: {
    sources: '.',
    scripts: './scripts',
    artifacts: './artifacts',
    cache: './cache',
  },
  networks: {
    'zero-g-testnet': {
      url: process.env.ZG_RPC_URL ?? 'https://evmrpc-testnet.0g.ai',
      chainId: 16602,
      accounts: process.env.ZG_PRIVATE_KEY ? [process.env.ZG_PRIVATE_KEY] : [],
    },
    'ethereum-sepolia': {
      url: process.env.ENS_RPC_URL || 'https://rpc.sepolia.org',
      chainId: 11155111,
      accounts:
        process.env.ENS_PRIVATE_KEY || process.env.ZG_PRIVATE_KEY
          ? [(process.env.ENS_PRIVATE_KEY || process.env.ZG_PRIVATE_KEY)!]
          : [],
    },
  },
};

export default config;
