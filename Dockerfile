# ---- Base Stage ----# ---- Base Stage ----

# This stage installs all dependencies for the entire monorepo.# Sets up Node.js, installs root dependencies, and copies source code.

FROM node:18-slim as baseFROM node:18-slim as base

WORKDIR /usr/src/appWORKDIR /usr/src/app



# Install libssl1.1 for Prisma, which is required by the API service.# Install libssl1.1 for Prisma

RUN echo "deb http://archive.debian.org/debian/ buster main" > /etc/apt/sources.list.d/buster.list \RUN echo "deb http://archive.debian.org/debian/ buster main" > /etc/apt/sources.list.d/buster.list \

    && apt-get update -o Acquire::Check-Valid-Until=false \    && apt-get update -o Acquire::Check-Valid-Until=false \

    && apt-get install -y --no-install-recommends libssl1.1 \    && apt-get install -y --no-install-recommends libssl1.1 \

    && rm /etc/apt/sources.list.d/buster.list    && rm /etc/apt/sources.list.d/buster.list



# Copy root dependency files# Copy root dependency files and install

COPY package.json package-lock.json* ./COPY package.json package-lock.json* ./

RUN npm install --production=false

# Install all dependencies

RUN npm install --production=false# Copy the rest of the monorepo source code

COPY . .

# Copy the rest of the monorepo source code.

# .dockerignore will prevent node_modules and other unnecessary files from being copied.# ---- API Stage ----

COPY . .FROM base as api

WORKDIR /usr/src/app/apps/api

# ---- API Stage ----

# This stage builds and runs the API service.# Generate Prisma Client

FROM base as apiRUN npx prisma generate



# Set the working directory to the API app# Expose port and set command

WORKDIR /usr/src/app/apps/apiEXPOSE 4000

CMD ["npm", "run", "start:dev"]

# Generate the Prisma client

RUN npx prisma generate

# ---- Web Stage ----

# Expose the API portFROM base as web

EXPOSE 4000WORKDIR /usr/src/app/apps/web



# Start the API development server# Expose port and set command

CMD ["npm", "run", "start:dev"]EXPOSE 3000

CMD ["npm", "run", "dev"]


# ---- Web Stage ----
# This stage builds and runs the Web service.
FROM base as web

# Set the working directory to the Web app
WORKDIR /usr/src/app/apps/web

# Expose the Web port
EXPOSE 3000

# Start the Web development server
CMD ["npm", "run", "dev"]
