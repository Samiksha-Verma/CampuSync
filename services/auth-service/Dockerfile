# syntax=docker/dockerfile:1
#
# Same template used by every CampuSync service - see DEPLOYMENT.md. Two stages so
# native-module build tools (needed by auth-service's bcrypt, harmless for everyone
# else) never end up in the final image.

FROM node:20-slim AS deps
WORKDIR /app
RUN apt-get update && apt-get install -y --no-install-recommends python3 make g++ \
    && rm -rf /var/lib/apt/lists/*
COPY package*.json ./
RUN npm ci --omit=dev

FROM node:20-slim
WORKDIR /app
ENV NODE_ENV=production
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Render (and most PaaS hosts) inject PORT at runtime; server.js already reads
# process.env.PORT with a local-dev fallback, so no build-time value is needed here.
EXPOSE 10000

CMD ["node", "server.js"]
