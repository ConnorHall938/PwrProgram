FROM node:18-alpine as base

# Install pnpm and netcat for database connectivity check
RUN npm install -g pnpm && apk add --no-cache netcat-openbsd

WORKDIR /app

# Copy package files for better caching
COPY pnpm-workspace.yaml pnpm-lock.yaml package.json ./
COPY packages/shared/package.json ./packages/shared/
COPY apps/pwrprogram/package.json ./apps/pwrprogram/

# Install dependencies (this layer will be cached if package files don't change)
RUN pnpm install --frozen-lockfile

# Copy source code and configs
COPY packages/shared/ ./packages/shared/
COPY apps/pwrprogram/ ./apps/pwrprogram/

# Create wait script for tests
RUN echo '#!/bin/sh' > /wait-and-test.sh && \
    echo 'echo "Waiting for database..."' >> /wait-and-test.sh && \
    echo 'while ! nc -z postgres 5432; do' >> /wait-and-test.sh && \
    echo '  echo "Database not ready, waiting..."' >> /wait-and-test.sh && \
    echo '  sleep 2' >> /wait-and-test.sh && \
    echo 'done' >> /wait-and-test.sh && \
    echo 'echo "Database ready, running tests..."' >> /wait-and-test.sh && \
    echo 'cd /app/apps/pwrprogram && pnpm test' >> /wait-and-test.sh && \
    chmod +x /wait-and-test.sh

# Test stage - runs tests and fails build if tests fail
FROM base as test
WORKDIR /app/apps/pwrprogram
CMD ["/wait-and-test.sh"]

# Production stage
FROM base as production
WORKDIR /app/apps/pwrprogram
CMD ["pnpm", "start"]