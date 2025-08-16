FROM node:18-alpine AS base

# build 
FROM base AS build
RUN npm install -g bun
WORKDIR /app
COPY . .
COPY ./docker/env/.client.env ./packages/client/.env
# RUN ls -al
# RUN ls -al ./packages
# RUN ls -al ./packages/client
# RUN ls -al ./packages/server
# RUN bun --version
RUN bun install --frozen-lockfile --filter './packages/client' --production
RUN bun run client:build

# Production image, copy all the files and run next
FROM base AS production
WORKDIR /app
ENV NODE_ENV=production
COPY --from=build /app/packages/client/.next/standalone ./
COPY --from=build /app/packages/client/public ./packages/client/public
COPY --from=build /app/packages/client/.next/static ./packages/client/.next/static

ENV PORT=3000
ENV HOSTNAME="0.0.0.0"
ENV NEXT_PUBLIC_BACK_END_API_URL="http://server:3100"
ENV NEXT_PUBLIC_FRONT_END_URL="http://casyu.me"
EXPOSE 3000

CMD ["node", "./packages/client/server.js"]