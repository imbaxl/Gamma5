FROM node:22-alpine

WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci --omit=dev
COPY . .

ENV HOST=0.0.0.0
ENV DATA_DIR=/app/data
EXPOSE 3210
VOLUME ["/app/data"]

CMD ["npm", "start"]
