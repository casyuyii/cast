# Build stage for blog
FROM node:18-alpine AS blog-builder

WORKDIR /app

# Copy package files
RUN npm install -g bun
WORKDIR /app
COPY . .
RUN bun install --frozen-lockfile --filter './packages/blog' --production
RUN bun run blog:build

# Production stage
FROM nginx:alpine

# Copy nginx configuration (default to production)
COPY docker/nginx.prod.conf /etc/nginx/nginx.conf

# Copy built blog static files
COPY --from=blog-builder /app/packages/blog/dist /usr/share/nginx/html/blog

# Create necessary directories and fix permissions
RUN chown -R nginx:nginx /usr/share/nginx/html/blog && \
    chmod -R 755 /usr/share/nginx/html/blog

# Expose port 80
EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
