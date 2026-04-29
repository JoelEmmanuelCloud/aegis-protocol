FROM node:22-alpine AS builder
WORKDIR /app

COPY package.json package-lock.json ./
COPY packages/types/package.json packages/types/
COPY apps/dashboard/package.json apps/dashboard/

RUN npm ci

COPY tsconfig.base.json ./
COPY packages/types packages/types/
COPY apps/dashboard apps/dashboard/

WORKDIR /app/apps/dashboard
RUN npm run build

FROM nginx:alpine
COPY --from=builder /app/apps/dashboard/dist /usr/share/nginx/html
COPY apps/dashboard/nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 4000
CMD ["nginx", "-g", "daemon off;"]
