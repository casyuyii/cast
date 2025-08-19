FROM node:18-alpine AS base

# build 
FROM base AS build
ARG NEXT_PUBLIC_BACK_END_API_URL
ARG NEXT_PUBLIC_FRONT_END_URL
ENV NEXT_PUBLIC_BACK_END_API_URL=${NEXT_PUBLIC_BACK_END_API_URL}
ENV NEXT_PUBLIC_FRONT_END_URL=${NEXT_PUBLIC_FRONT_END_URL}
RUN npm install -g bun
WORKDIR /app
COPY . .
# COPY ./docker/env/.client.env ./packages/client/.env
# RUN ls -al
# RUN ls -al ./packages
# RUN ls -al ./packages/client
# RUN ls -al ./packages/server
RUN bun install --frozen-lockfile --filter './packages/client' --production
RUN bun run client:build

# Production image, copy all the files and run next
FROM base AS production
WORKDIR /app
ENV NODE_ENV=production
COPY --from=build /app/packages/client/.next/standalone ./
COPY --from=build /app/packages/client/public ./packages/client/public
COPY --from=build /app/packages/client/.next/static ./packages/client/.next/static

ENV HOSTNAME="0.0.0.0"

CMD ["node", "./packages/client/server.js"]