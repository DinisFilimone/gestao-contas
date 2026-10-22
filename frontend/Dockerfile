# ---- Fase 1: compilar o Angular ----
FROM node:22-alpine AS build
WORKDIR /app
COPY package*.json ./
RUN if [ -f package-lock.json ]; then npm ci; else npm install; fi
COPY . .
RUN npm run build

# ---- Fase 2: servir os ficheiros estaticos com nginx ----
FROM nginx:alpine
COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/dist/*/browser /usr/share/nginx/html
EXPOSE 80
