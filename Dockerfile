FROM mcr.microsoft.com/playwright:v1.64.1-noble

WORKDIR /app

# Install dependencies first for better caching
COPY package.json yarn.lock ./
RUN yarn install --frozen-lockfile

# Copy application files
COPY bin/ ./bin/
COPY src/ ./src/
COPY docker-entrypoint.sh ./

RUN chmod +x ./docker-entrypoint.sh ./bin/daemon.js ./bin/run.js \
    && ln -sf /app/bin/run.js /usr/local/bin/fb-gratulate \
    && mkdir -p /app/user_data

ENV NODE_ENV=production \
    PORT=3000 \
    USER_DATA_DIR=/app/user_data \
    PATH="/app/bin:/app/node_modules/.bin:${PATH}"

EXPOSE 3000

ENTRYPOINT ["/app/docker-entrypoint.sh"]
CMD []
