FROM node:20-alpine3.19 AS base

FROM base AS build
WORKDIR /app
COPY . .
RUN npm install -g pnpm
RUN pnpm i -P
RUN pnpm build

FROM base
WORKDIR /app
COPY --from=build /app/.output .
EXPOSE 3000
CMD ["node", "./server/index.mjs"]