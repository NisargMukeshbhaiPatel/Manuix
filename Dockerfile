# Build Next.js application
FROM node:18-alpine AS nextjs-builder
WORKDIR /manunix
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

# Final image
FROM node:18-alpine

# Copy Next.js build from builder
COPY --from=nextjs-builder /manunix/.next/standalone ./
COPY --from=nextjs-builder /manunix/.next/static ./.next/static
COPY --from=nextjs-builder /manunix/public ./public

CMD node server.js