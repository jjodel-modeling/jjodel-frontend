# Multi-stage build per ottimizzare le dimensioni dell'immagine
FROM node:22-alpine AS builder

# Imposta la directory di lavoro
WORKDIR /app

# Copia tutto il frontend
COPY frontend/ .

# Installa le dipendenze con le opzioni corrette
RUN npm i --legacy-peer-deps
RUN npm i react-json-view --force --legacy-peer-deps

# Imposta le variabili d'ambiente per il build
ENV NODE_OPTIONS=--openssl-legacy-provider
ENV CI=

# Esegui il build
RUN npm run build

# Stage di produzione con Nginx
FROM nginx:alpine

# Copia la build dal stage precedente
COPY --from=builder /app/build /usr/share/nginx/html

# Copia la configurazione di Nginx ottimizzata per standalone
COPY nginx-standalone.conf /etc/nginx/conf.d/default.conf

# Esponi la porta 80
EXPOSE 80

# Comando di avvio
CMD ["nginx", "-g", "daemon off;"]
