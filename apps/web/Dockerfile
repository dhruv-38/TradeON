FROM oven/bun:1.3.11

WORKDIR /app

COPY package.json bun.lock turbo.json ./
COPY packages ./packages
COPY apps/web/package.json ./apps/web/

WORKDIR /app/apps/web
RUN bun install

COPY apps/web .

RUN bun run build

EXPOSE 3000

CMD ["bun", "run", "start"]