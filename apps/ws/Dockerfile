FROM oven/bun:1.3.11

WORKDIR /app

COPY package.json bun.lock turbo.json ./
COPY packages ./packages
COPY apps/ws/package.json ./apps/ws/

WORKDIR /app/apps/ws
RUN bun install

COPY apps/ws .

EXPOSE 8080

CMD ["bun", "run", "src/index.ts"]