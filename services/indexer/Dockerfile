FROM node:20-alpine
WORKDIR /app

COPY services/indexer/package.json ./
RUN npm install --production

COPY services/indexer/ ./

CMD ["node", "index.mjs"]
