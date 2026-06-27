FROM oven/bun:1.3.11

WORKDIR /app

COPY package.json bun.lock turbo.json ./
COPY packages ./packages
COPY apps/engine-worker/package.json ./apps/engine-worker/

WORKDIR /app/apps/engine-worker
RUN bun install

COPY apps/engine-worker .
WORKDIR /app/packages/db

RUN bun run db:generate

WORKDIR /app/apps/engine-worker/

CMD ["bun", "run", "src/index.ts"]