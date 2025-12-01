# Production Dockerfile for gateway

FROM node:20-alpine AS builder

WORKDIR /usr/src/app

# Install only production dependencies
COPY package*.json ./
RUN npm install --omit=dev

# Copy source code
COPY . .

FROM node:20-alpine AS runner

WORKDIR /usr/src/app

ENV NODE_ENV=production
ENV GATEWAY_PORT=5921

# Copy app code and node_modules from builder
COPY --from=builder /usr/src/app ./

# Fixed by problem statement
EXPOSE 5921

CMD ["npm", "run", "start"]
