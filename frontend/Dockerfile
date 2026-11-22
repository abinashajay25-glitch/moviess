# Build stage
FROM node:22-alpine AS build
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

# Production serve stage
FROM nginx:alpine
ENV BACKEND_URL=http://backend:8000 \
    NGINX_ENVSUBST_FILTER=^BACKEND_URL$
COPY --from=build /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/templates/default.conf.template
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
