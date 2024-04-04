FROM node:20-alpine3.19 AS base

WORKDIR /app

FROM base AS build

COPY . .

RUN npm install -g pnpm

RUN pnpm i

RUN pnpm build

FROM base

WORKDIR /app

COPY --from=build /app/.output .

EXPOSE 3000

CMD ["node", "./server/index.mjs"]