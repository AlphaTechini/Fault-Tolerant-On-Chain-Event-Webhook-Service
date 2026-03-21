FROM node:20-alpine

WORKDIR /usr/src/app

# Install pnpm
RUN npm install -g pnpm

# Copy package.json and lockfile
COPY package.json pnpm-lock.yaml ./

# Install dependencies (frozen to ensure repeatable builds)
RUN pnpm install --frozen-lockfile

# Copy application source code
COPY . .

# Build the TypeScript project
RUN pnpm run build

# Expose the port from environment or default 3000
EXPOSE 3000

# Start the Node.js application
CMD ["pnpm", "start"]
