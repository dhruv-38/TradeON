FROM oven/bun:1.3.11

WORKDIR /app
ARG NEXT_PUBLIC_API_URL
ARG NEXT_PUBLIC_WS_URL

COPY package.json bun.lock turbo.json ./
COPY packages ./packages
COPY apps/web/package.json ./apps/web/

WORKDIR /app/apps/web
RUN bun install

COPY apps/web .

ENV NEXT_PUBLIC_API_URL=$NEXT_PUBLIC_API_URL
ENV NEXT_PUBLIC_WS_URL=$NEXT_PUBLIC_WS_URL

RUN bun run build

EXPOSE 3000

CMD ["bun", "run", "start"]