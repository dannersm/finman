#!/bin/bash

# Matar cualquier Xvfb previo por si el container se reinició mal (opcional pero sano)
rm -f /tmp/.X99-lock

# 1. Iniciar Xvfb en background
# :99 -> Puerto fijo
# -ac -> Desactiva el control de acceso (Esto es lo que te falta)
Xvfb :99 -screen 0 1280x1024x24 -ac &

# 2. Exportar la variable DISPLAY para que Node la vea SI O SI
export DISPLAY=:99

# 3. Esperar un par de segundos a que Xvfb esté listo
echo "Iniciando Xvfb..."
sleep 2

# 4. Iniciar tu server
echo "Iniciando Node..."
exec node server.js
