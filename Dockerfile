FROM node:16-alpine
WORKDIR /app
COPY . .
RUN npm ci
EXPOSE 3000
# Start the app
CMD [ "npm", "start" ]
