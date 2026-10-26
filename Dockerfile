# Why Flux as a container: the static Vite build served by unprivileged nginx on port 8080.
# Build:  docker build -t littlestache/whyflux:latest .
# Run:    docker run --rm -p 8080:8080 littlestache/whyflux:latest

FROM node:24-slim@sha256:55fb5f5a527ea2c5c4a95f963e48ef90aa38c7b346054fdc8ee9957a2b55d205 AS build
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci --no-fund --no-audit
COPY index.html tsconfig.json vite.config.ts ./
COPY src ./src
COPY public ./public
# The network snapshot in public/data is the committed one; the page refreshes the numbers live.
RUN npm run build

FROM nginx:stable-alpine@sha256:47928bf67eb62a1863cb08d9ecb52d3e704304ba614eaee17884204677702951
LABEL org.opencontainers.image.title="Why Flux" \
      org.opencontainers.image.description="An interactive case for the Flux decentralized cloud" \
      org.opencontainers.image.source="https://github.com/Sikbik/whyflux" \
      org.opencontainers.image.url="https://whyflux.app.runonflux.io"
COPY deploy/docker/nginx.conf /etc/nginx/nginx.conf
COPY --from=build /app/dist /usr/share/nginx/html
USER nginx
EXPOSE 8080
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD wget -q -O /dev/null http://127.0.0.1:8080/healthz || exit 1
ENTRYPOINT ["nginx"]
CMD ["-g", "daemon off;"]
