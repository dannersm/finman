FROM node:20-bookworm

WORKDIR /app

COPY package*.json ./
RUN npm ci

RUN apt-get update && \
    npx playwright install firefox --with-deps && \
    apt-get install -y xvfb xauth dbus-x11 && \
    rm -rf /var/lib/apt/lists/*

RUN npm prune --production

COPY . .

# --- CAMBIOS AQUÍ ---
COPY start.sh /start.sh
RUN chmod +x /start.sh

EXPOSE 3001

# Ejecutamos el script manual en vez de xvfb-run
CMD ["/start.sh"]
