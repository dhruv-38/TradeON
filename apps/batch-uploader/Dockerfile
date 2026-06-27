FROM oven/bun:1.3.11

WORKDIR /app

COPY package.json bun.lock turbo.json ./
COPY packages ./packages
COPY apps/batch-uploader/package.json ./apps/batch-uploader/

WORKDIR /app/apps/batch-uploader
RUN bun install

COPY apps/batch-uploader .

CMD ["sh", "-c", "cd /app/packages/timescaledb && bun run timescale:schema && cd /app/apps/batch-uploader && bun run src/index.ts"]