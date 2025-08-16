FROM node:18-alpine AS base

# build 
FROM base AS build
RUN npm install -g bun
WORKDIR /app
COPY . .
# RUN ls -al
# RUN ls -al ./packages
# RUN ls -al ./packages/client
# RUN ls -al ./packages/server
# RUN bun --version
RUN bun install --frozen-lockfile --filter './packages/server' --production
# RUN ls -al
# RUN ls -al ./node_modules
# RUN ls -al ./packages/server
RUN bun run server:build

# Production image, copy all the files and run next
FROM base AS production
WORKDIR /app
ENV NODE_ENV=production
COPY --from=build /app/node_modules ./node_modules
COPY --from=build /app/packages/server/dist ./packages/server/dist

ENV PORT=3100
ENV MONGO_URI="mongodb://mongodb:27017"
EXPOSE 3100

CMD ["node", "./packages/server/dist/main"]