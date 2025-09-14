FROM nginx:alpine

# Copy nginx configuration for development
COPY nginx.dev.conf /etc/nginx/nginx.conf

# Create necessary directories
RUN mkdir -p /var/log/nginx

# Expose port 80
EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
