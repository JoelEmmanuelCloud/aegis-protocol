FROM node:22-alpine
WORKDIR /app

COPY package.json package-lock.json ./
COPY packages/types/package.json packages/types/
COPY packages/0g-client/package.json packages/0g-client/
COPY packages/axl-client/package.json packages/axl-client/
COPY apps/witness-node/package.json apps/witness-node/

RUN npm ci

COPY tsconfig.base.json ./
COPY packages/types packages/types/
COPY packages/0g-client packages/0g-client/
COPY packages/axl-client packages/axl-client/
COPY apps/witness-node apps/witness-node/

WORKDIR /app/apps/witness-node
CMD ["node", "--require", "ts-node/register", "src/index.ts"]
