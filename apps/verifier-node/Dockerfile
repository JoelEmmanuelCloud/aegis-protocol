FROM node:22-alpine
WORKDIR /app

COPY package.json package-lock.json ./
COPY packages/types/package.json packages/types/
COPY packages/0g-client/package.json packages/0g-client/
COPY packages/0g-compute/package.json packages/0g-compute/
COPY packages/axl-client/package.json packages/axl-client/
COPY apps/verifier-node/package.json apps/verifier-node/

RUN npm ci

COPY tsconfig.base.json ./
COPY packages/types packages/types/
COPY packages/0g-client packages/0g-client/
COPY packages/0g-compute packages/0g-compute/
COPY packages/axl-client packages/axl-client/
COPY apps/verifier-node apps/verifier-node/

WORKDIR /app/apps/verifier-node
CMD ["node", "--require", "ts-node/register", "src/index.ts"]
