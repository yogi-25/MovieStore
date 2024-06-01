FROM node:16

# Create app directory
WORKDIR /usr/src/app

# Install app dependencies
COPY package*.json ./

RUN npm install

# Bundle app source
COPY . .

# Build the app
RUN npm run build:prod

# Expose port
EXPOSE 3000

# Command to run the app
CMD [ "node", "prod-build/main.js" ]
