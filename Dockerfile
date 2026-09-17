# ---- Build stage ----
FROM node:22-alpine AS build
WORKDIR /app

# Install dependencies first so Docker can cache this layer
COPY package.json ./
RUN npm install

# Copy the rest of the source (including the cheat database in public/cheatdb)
COPY . .

# Build a plain Node server bundle instead of the default Cloudflare bundle
ENV NITRO_PRESET=node-server
RUN npm run build

# Normalise the output location (nitro may emit .output/ or dist/)
RUN if [ -d .output ]; then mv .output /app/server-build; else mv dist /app/server-build; fi

# ---- Runtime stage ----
FROM node:22-alpine AS runtime
WORKDIR /app
ENV NODE_ENV=production
ENV PORT=8080
ENV HOST=0.0.0.0

COPY --from=build /app/server-build ./server-build

EXPOSE 8080
CMD ["node", "server-build/server/index.mjs"]
