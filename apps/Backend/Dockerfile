FROM oven/bun:1.3.11

WORKDIR /app

COPY package.json bun.lock turbo.json ./

COPY packages ./packages
COPY apps/Backend/package*.json ./apps/Backend/
RUN bun install --frozen-lockfile

COPY apps/Backend ./apps/Backend

WORKDIR /app/packages/db
RUN bun run db:generate

WORKDIR /app/apps/Backend

ENV NODE_ENV=production
ENV DATABASE_URL=postgresql://postgres:123456@127.0.0.1:5432/TradeON?schema=public
ENV JWT_SECRET=thisissecret

EXPOSE 8000

CMD ["bun", "run", "src/index.ts"]