FROM node:24-alpine@sha256:ebfe2f90462722a7a4de65e91990e97fe0d401c70e0e762c5b53302f905ec1c1
WORKDIR /app
COPY package.json package-lock.json* ./
COPY vendor/ ./vendor/
RUN npm install --omit=dev --no-audit --no-fund
COPY src/ ./src/
COPY public/ ./public/
COPY scenarios/ ./scenarios/
# Drop root. /app needs to stay writable for the .dvaa scores directory.
RUN chown -R node:node /app
USER node
ENV DVAA_HOST=0.0.0.0
ENV DVAA_TELEMETRY=off
EXPOSE 7001 7002 7003 7004 7005 7006 7007 7008 7010 7011 7012 7013 7014 7015 7016 7017 7018 7020 7021 7022 7023 9000
HEALTHCHECK --interval=30s --timeout=3s --start-period=15s \
  CMD wget -qO- http://127.0.0.1:9000/stats || exit 1
CMD ["node", "src/index.js"]
