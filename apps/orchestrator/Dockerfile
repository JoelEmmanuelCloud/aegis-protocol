FROM node:22-alpine
WORKDIR /app

COPY package.json package-lock.json ./
COPY packages/types/package.json packages/types/
COPY packages/0g-client/package.json packages/0g-client/
COPY packages/ens-client/package.json packages/ens-client/
COPY packages/keeper-client/package.json packages/keeper-client/
COPY apps/orchestrator/package.json apps/orchestrator/

RUN npm ci

COPY tsconfig.base.json ./
COPY packages/types packages/types/
COPY packages/0g-client packages/0g-client/
COPY packages/ens-client packages/ens-client/
COPY packages/keeper-client packages/keeper-client/
COPY apps/orchestrator apps/orchestrator/

WORKDIR /app/apps/orchestrator
CMD ["node", "-r", "ts-node/register", "-r", "tsconfig-paths/register", "src/main.ts"]
