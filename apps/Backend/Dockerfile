FROM oven/bun:1.3.11

WORKDIR /app

COPY package.json bun.lock turbo.json ./
COPY packages ./packages
COPY apps/Backend/package.json ./apps/Backend/

WORKDIR /app/apps/Backend
RUN bun install

COPY apps/Backend .
WORKDIR /app/packages/db

RUN bun run db:generate

WORKDIR /app/apps/Backend/

EXPOSE 8000

CMD ["sh", "-c", "cd /app/packages/db && bun run db:deploy && cd /app/apps/Backend && bun run src/index.ts"]