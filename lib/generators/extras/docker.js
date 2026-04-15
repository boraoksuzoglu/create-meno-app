export function generateDockerfile(config) {
  const isTs = config.language === 'ts';

  return `# ── Build stage (TypeScript only) ────────────────────────────────────────────
${
  isTs
    ? `FROM node:20-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

# ── Production stage ──────────────────────────────────────────────────────────
FROM node:20-alpine AS runner`
    : `FROM node:20-alpine`
}
WORKDIR /app

# Install production deps only
COPY package*.json ./
RUN npm ci --omit=dev && npm cache clean --force

${isTs ? 'COPY --from=builder /app/dist ./dist' : 'COPY src ./src'}

# Non-root user for security
RUN addgroup -S appgroup && adduser -S appuser -G appgroup
USER appuser

EXPOSE 3000

# Graceful shutdown is handled in code — SIGTERM will trigger clean exit
STOPSIGNAL SIGTERM

HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \\
  CMD wget -qO- http://localhost:3000/health || exit 1

CMD ["node", ${isTs ? '"dist/server.js"' : '"--import", "./src/utils/path-loader.js", "src/server.js"'}]
`;
}

export function generateDockerCompose(config) {
  return `services:
  app:
    build: .
    ports:
      - "\${PORT:-3000}:3000"
    environment:
      - NODE_ENV=production
      - MONGODB_URI=mongodb://mongo:27017/${config.projectName}
      - SESSION_SECRET=\${SESSION_SECRET}
      - CORS_ORIGIN=\${CORS_ORIGIN:-http://localhost:3001}
    depends_on:
      mongo:
        condition: service_healthy
    restart: unless-stopped
    healthcheck:
      test: ["CMD", "wget", "-qO-", "http://localhost:3000/health"]
      interval: 30s
      timeout: 5s
      retries: 3
      start_period: 10s

  mongo:
    image: mongo:7
    volumes:
      - mongo_data:/data/db
    healthcheck:
      test: ["CMD", "mongosh", "--eval", "db.adminCommand('ping')"]
      interval: 10s
      timeout: 5s
      retries: 5
      start_period: 10s
    restart: unless-stopped

volumes:
  mongo_data:
`;
}

export function generateDockerIgnore() {
  return `node_modules/
dist/
.env
logs/
coverage/
.git/
*.log
.DS_Store
`;
}
