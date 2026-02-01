FROM node:18-alpine

# 1. Install pnpm
RUN npm install -g pnpm

WORKDIR /app

# 2. Copy config files
COPY package.json pnpm-lock.yaml ./

# 3. Install dependencies (with scripts allowed)
RUN pnpm config set ignore-scripts false
RUN apk add --no-cache python3 make g++
RUN pnpm install

# 4. Copy source code
COPY . .

# 5. Build (Only runs if a build script exists)
RUN npm run build --if-present

# 6. Start
EXPOSE 8080
CMD ["pnpm", "start"]
