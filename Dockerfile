FROM node:18-alpine AS nextjs-builder
WORKDIR /manunix
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

FROM node:18-alpine
COPY --from=nextjs-builder /manunix/.next/standalone ./
COPY --from=nextjs-builder /manunix/.next/static ./.next/static
COPY --from=nextjs-builder /manunix/public ./public
CMD node server.js