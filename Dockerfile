
# Production image for the Student Record System (used by the CD pipeline)
FROM node:22-alpine
WORKDIR /app

# Install only production dependencies, exactly as pinned in package-lock.json
COPY package*.json ./
RUN npm ci --omit=dev

# Application code
COPY src ./src
COPY public ./public
COPY scripts ./scripts
COPY db ./db

ENV NODE_ENV=production
ENV PORT=3000
EXPOSE 3000
CMD ["node", "src/server.js"]
