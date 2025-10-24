FROM node:18-slim

WORKDIR /usr/src/app

# Add Debian Buster archive sources for libssl1.1 (required by Prisma)
RUN echo "deb http://archive.debian.org/debian/ buster main" > /etc/apt/sources.list.d/buster.list \
    && apt-get update -o Acquire::Check-Valid-Until=false \
    && apt-get install -y --no-install-recommends libssl1.1 \
    && rm /etc/apt/sources.list.d/buster.list

# Copy package files and install deps
COPY package*.json ./
RUN npm install

# Copy the rest of the source code
COPY . .

# Generate the Prisma client
RUN npx prisma generate

# Start in dev/watch mode (works well for MVP)
CMD ["npm", "run", "start:dev"]


