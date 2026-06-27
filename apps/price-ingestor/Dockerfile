FROM oven/bun:1.3.11

WORKDIR /app

COPY package.json bun.lock turbo.json ./
COPY packages ./packages
COPY apps/price-ingestor/package.json ./apps/price-ingestor/

WORKDIR /app/apps/price-ingestor
RUN bun install

COPY apps/price-ingestor .

CMD ["bun", "run", "src/index.ts"]