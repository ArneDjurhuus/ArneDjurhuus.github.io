FROM node:20-slim

WORKDIR /usr/src/app

# Install OpenSSL CLI to help Prisma detect OpenSSL version (provides libssl3)
RUN apt-get update && apt-get install -y --no-install-recommends openssl && rm -rf /var/lib/apt/lists/*

# Copy package files and install deps
COPY package*.json ./
RUN npm install

# Copy the rest of the source code
COPY . .

# Generate the Prisma client
RUN npx prisma generate

# Start in dev/watch mode (works well for MVP)
CMD ["npm", "run", "start:dev"]


