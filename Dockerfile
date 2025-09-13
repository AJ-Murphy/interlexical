# 1) Builder
FROM node:22-alpine AS build
ENV PNPM_HOME="/pnpm"
ENV PATH="$PNPM_HOME:$PATH"
RUN corepack enable

WORKDIR /app
COPY package.json pnpm-lock.yaml ./
# keep dev deps for build
RUN --mount=type=cache,id=pnpm,target=/pnpm/store pnpm install --frozen-lockfile
COPY . .

# Build backend + Vite assets (Adonis v6 writes to ./build and ./build/public)
RUN node ace build
# If you also have a "build" script that runs Vite explicitly, keep it:
# RUN pnpm run build

# 2) Runtime
FROM node:22-alpine AS runtime
ENV PNPM_HOME="/pnpm"
ENV PATH="$PNPM_HOME:$PATH"
RUN corepack enable

WORKDIR /app
ENV NODE_ENV=production
ENV HOST=0.0.0.0
ENV PORT=8080

# install prod deps only
COPY package.json pnpm-lock.yaml ./
RUN --mount=type=cache,id=pnpm,target=/pnpm/store pnpm install --frozen-lockfile --prod

# copy compiled app and static assets
COPY --from=build /app/build ./build
# also expose public so Edge/Vite can read the manifest path at runtime
COPY --from=build /app/build/public ./public

EXPOSE 8080
CMD ["node", "./build/bin/server.js"]
