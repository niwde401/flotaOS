FROM node:20-alpine AS builder
WORKDIR /app
COPY package*.json ./
COPY apps/web/package*.json ./apps/web/
COPY packages/shared/package*.json ./packages/shared/
RUN npm ci --workspace=apps/web --workspace=packages/shared
COPY packages/shared ./packages/shared
COPY apps/web ./apps/web
RUN npm run build --workspace=packages/shared
RUN npm run build --workspace=apps/web

FROM node:20-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/apps/web/.next ./apps/web/.next
COPY --from=builder /app/apps/web/public ./apps/web/public
COPY --from=builder /app/apps/web/package.json ./apps/web/
WORKDIR /app/apps/web
EXPOSE 3000
CMD ["npx", "next", "start"]
