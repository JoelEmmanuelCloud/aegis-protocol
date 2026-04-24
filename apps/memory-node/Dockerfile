FROM node:22-alpine
WORKDIR /app

COPY package.json package-lock.json ./
COPY packages/types/package.json packages/types/
COPY packages/0g-client/package.json packages/0g-client/
COPY apps/memory-node/package.json apps/memory-node/

RUN npm ci

COPY tsconfig.base.json ./
COPY packages/types packages/types/
COPY packages/0g-client packages/0g-client/
COPY apps/memory-node apps/memory-node/

WORKDIR /app/apps/memory-node
CMD ["node", "--require", "ts-node/register", "src/index.ts"]
