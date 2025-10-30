kiosko:
    
    build:
      context: .
      dockerfile: ./MODULO-KIOSKO/Dockerfile
    image: ghcr.io/jumaar/vorak-imagenes-edge/kiosko:latest 
    container_name: vorak-kiosko
    restart: unless-stopped
    ports:
      # Expone el puerto del servidor web para que el navegador del host pueda acceder
      - "5000:5000"
      # Expone el puerto para el webhook, que apunta al mismo servidor interno.
      - "9091:5000"
    # --- ¡CORRECCIÓN! ---
    # Usamos 'env_file' para cargar TODAS las variables del .env en el contenedor.
    # Esto asegura que el script de redespliegue tenga acceso a todo lo que necesita.
    env_file: ./.env
    volumes:
      # --- ¡NUEVO! Permisos para controlar Docker ---
      - /var/run/docker.sock:/var/run/docker.sock
      # --- ¡SOLUCIÓN! Montamos el directorio del proyecto para que el kiosko pueda ejecutar git pull en el host.
      - .:/project
      # Volumen para la caché de medios y la playlist
      - kiosk_data:/app/data
      # Volumen compartido para leer el estado de la nevera
      - fridge_status:/app/status
    networks:
      - vorak-net
    group_add:
      - "${DOCKER_GID}"
  #--------------------------------------------------------------------------
  # SERVICIO 'BACKUP' - Realiza copias de segurida