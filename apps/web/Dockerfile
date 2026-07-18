# Archived pre-.NET migration. Kept for future review; not active.
# FROM node:22-alpine AS build
# WORKDIR /app
# ARG VITE_API_URL
# ENV VITE_API_URL=$VITE_API_URL
# COPY package*.json ./
# COPY apps/web/package.json apps/web/package.json
# COPY packages/shared/package.json packages/shared/package.json
# RUN npm install
# COPY . .
# RUN npm run build -w @buildjira/web
# 
# FROM nginx:1.27-alpine
# COPY --from=build /app/apps/web/dist /usr/share/nginx/html
# EXPOSE 80
# 