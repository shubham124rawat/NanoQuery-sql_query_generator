# Use Node Alpine base image
FROM node:20-alpine

# Set working directory
WORKDIR /app

# Copy package files
COPY package.json package-lock.json* ./

# Install dependencies
RUN npm install

# Copy frontend source files
COPY . .

# Expose port 5173
EXPOSE 5173

# Start Vite dev server exposed to network
CMD ["npm", "run", "dev", "--", "--host", "0.0.0.0"]
