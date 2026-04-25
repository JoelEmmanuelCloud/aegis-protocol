FROM node:22-alpine
WORKDIR /app

COPY package.json package-lock.json ./
COPY packages/types/package.json packages/types/
COPY packages/axl-client/package.json packages/axl-client/
COPY apps/propagator-node/package.json apps/propagator-node/

RUN npm ci

COPY tsconfig.base.json ./
COPY packages/types packages/types/
COPY packages/axl-client packages/axl-client/
COPY apps/propagator-node apps/propagator-node/

WORKDIR /app/apps/propagator-node
CMD ["node", "--require", "ts-node/register", "src/index.ts"]
