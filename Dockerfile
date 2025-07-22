FROM node:20-alpine3.19 AS base

FROM base AS deps
WORKDIR /app
RUN npm install -g pnpm
COPY package.json pnpm-lock.yaml ./
RUN pnpm i -P --frozen-lockfile

FROM deps AS build
WORKDIR /app
COPY . .
RUN pnpm build

FROM base AS release
WORKDIR /app
COPY --from=build /app/.output .
EXPOSE 8080
CMD ["node", "./server/index.mjs"]