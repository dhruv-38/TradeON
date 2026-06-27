FROM oven/bun:1.3.11

WORKDIR /app

COPY package.json bun.lock turbo.json ./
COPY packages ./packages
COPY apps/engine/package.json ./apps/engine/

WORKDIR /app/apps/engine
RUN bun install

COPY apps/engine .
WORKDIR /app/packages/db

RUN bun run db:generate

WORKDIR /app/apps/engine/

CMD ["bun", "run", "src/index.ts"]