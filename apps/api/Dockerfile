# Archived pre-.NET migration. Kept for future review; not active.
# FROM node:22-alpine AS deps
# WORKDIR /app
# COPY package*.json ./
# COPY apps/api/package.json apps/api/package.json
# COPY packages/shared/package.json packages/shared/package.json
# RUN npm install
# 
# FROM deps AS build
# COPY . .
# RUN npm run db:generate
# RUN npm run build -w @buildjira/api
# 
# FROM node:22-alpine AS runner
# WORKDIR /app
# ENV NODE_ENV=production
# COPY --from=build /app/node_modules ./node_modules
# COPY --from=build /app/apps/api ./apps/api
# COPY --from=build /app/packages/shared ./packages/shared
# EXPOSE 4000
# CMD ["sh", "-c", "cd apps/api && npm run db:migrate && node dist/src/server.js"]
# 