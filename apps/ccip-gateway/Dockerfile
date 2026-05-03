FROM node:22-alpine
WORKDIR /app

COPY package.json package-lock.json ./
COPY apps/ccip-gateway/package.json apps/ccip-gateway/

RUN npm ci

COPY tsconfig.base.json ./
COPY apps/ccip-gateway apps/ccip-gateway/

WORKDIR /app/apps/ccip-gateway
CMD ["node", "--require", "ts-node/register", "src/index.ts"]
