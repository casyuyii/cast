FROM nginx:alpine

# Copy nginx configuration (default to production)
COPY nginx.prod.conf /etc/nginx/nginx.conf

# Create necessary directories
RUN mkdir -p /var/log/nginx

# Expose port 80
EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
