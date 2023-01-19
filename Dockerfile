FROM node:16-alpine AS development
ENV NODE_ENV development

WORKDIR /app
COPY . .
RUN npm ci

EXPOSE 3000

CMD [ "npm", "start" ]
