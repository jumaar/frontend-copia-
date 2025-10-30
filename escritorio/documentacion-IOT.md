# Guía de Despliegue y Operación: Servidor IoT para Neveras Inteligentes

Este documento es la guía centralizada para instalar, desplegar y operar el software en el PC (host) que controla una nevera inteligente. El sistema operativo base es **Debian 13** (o compatible) y la aplicación se despliega como un conjunto de servicios contenerizados gestionados por **Docker Swarm**.

## INDICE
1.  **Sección 1: Creación del Servidor desde Cero**
    *   Instalación de Debian 13 y dependencias.
    *   Configuración de acceso remoto seguro con Cloudflare.
    *   Configuración de cámaras y entorno gráfico (Chromium).
2.  **Sección 2: Despliegue de la Aplicación con Docker Swarm**
    *   Inicialización de Swarm y creación de secretos.
    *   Despliegue de la pila de aplicación (`nevera`, `kiosko`).
    *   Despliegue de la pila de monitoreo (Portainer, Prometheus,Loki, etc.).
    *   Configuración de actualizaciones automáticas con Webhooks.
3.  **Sección 3: Operación y Mantenimiento Diario**
    *   Comandos esenciales para la gestión de los servicios.
    *   Revisión de logs y acceso a contenedores.
    *   Transferencia de archivos de auditoría.

---













## Sección 1: Creación del Servidor desde Cero

### 1.1. Preparación del Sistema Operativo (Debian 13)

1.  **Instalar Debian 13**: Realiza una instalación mínima del sistema.
2.  **Crear Usuario Administrador**: Evita usar `root` para las operaciones diarias.
    ```bash
    # Crear el usuario (ej. 'nevera1') y añadirlo al grupo 'sudo'
    sudo adduser nevera1
    sudo usermod -aG sudo nevera1
    ```
3.  **Crear Usuario para Kiosko (Sin Privilegios)**: Por seguridad, el navegador en modo kiosko se ejecutará con un usuario sin permisos de administrador.
    ```bash
    # Crear el usuario 'kiosko' sin contraseña y sin información personal
    sudo adduser --gecos "" --disabled-password kiosko
    ```

4.  **Asegurar SSH**: Limita el acceso SSH **solo al usuario administrador**.
    ```bash
    sudo nano /etc/ssh/sshd_config
    ```
    Asegúrate de que estas líneas estén configuradas para permitir el acceso únicamente a `nevera1`:
    ```ini
    PermitRootLogin no
    PasswordAuthentication yes
    AllowUsers nevera1
    ```
    Reinicia el servicio: `sudo systemctl restart sshd`.

5.  **Instalar Docker**: La aplicación se ejecuta en contenedores.
    ```bash
    # Instalar pre-requisitos
    sudo apt update && sudo apt install -y ca-certificates curl gnupg

    # Añadir el repositorio oficial de Docker
    sudo install -m 0755 -d /etc/apt/keyrings
    curl -fsSL https://download.docker.com/linux/debian/gpg | sudo gpg --dearmor -o /etc/apt/keyrings/docker.gpg
    sudo chmod a+r /etc/apt/keyrings/docker.gpg
    echo "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.gpg] https://download.docker.com/linux/debian $(. /etc/os-release && echo "$VERSION_CODENAME") stable" | sudo tee /etc/apt/sources.list.d/docker.list > /dev/null

    # Instalar Docker Engine y Compose
    sudo apt update && sudo apt install -y docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin

    # Permitir al usuario ejecutar Docker sin 'sudo'
    sudo usermod -aG docker $USER
    
    # Aplica la membresía al grupo (cierra sesión y vuelve a entrar, o usa newgrp)
    newgrp docker
    ```

### 1.2. Configuración de Acceso Remoto (Cloudflare Tunnel)

Exponemos el servicio SSH de forma segura sin abrir puertos en el router.

1.  **Instalar `cloudflared`**:
    ```bash
    sudo apt install -y cloudflared
    ```
2.  **Autenticar y Crear Túnel**:
    ```bash
    # Conecta el agente a tu cuenta de Cloudflare
    cloudflared tunnel login

    # Crea un túnel con un nombre descriptivo
    cloudflared tunnel create nevera1-tunnel
    ```
    > **Importante**: Anota el **UUID** del túnel que se genera.

3.  **Configurar el Túnel**:
    Crea el archivo `sudo nano /etc/cloudflared/config.yml` con este contenido, reemplazando `<UUID-DEL-TÚNEL>` y el `hostname`:
    ```yaml
    tunnel: <UUID-DEL-TÚNEL>
    credentials-file: /etc/cloudflared/<UUID-DEL-TÚNEL>.json
    
    ingress:
      - hostname: ssh-nevera1.lenstextil.com # Subdominio para SSH
        service: ssh://localhost:22
      - service: http_status:404 # Regla de seguridad por defecto
    ```
4.  **Mover Credenciales y Crear Ruta DNS**:
    ```bash
    # Mueve el archivo de credenciales (reemplaza <UUID> y el usuario)
    sudo mv /home/nevera1/.cloudflared/<UUID-DEL-TÚNEL>.json /etc/cloudflared/

    # Asocia el subdominio público con el túnel
    cloudflared tunnel route dns nevera1-tunnel ssh-nevera1.lenstextil.com
    ```
5.  **Activar como Servicio**:
    ```bash
    sudo cloudflared service install
    sudo systemctl enable --now cloudflared
    ```
    Para conectarte desde tu PC de administración, configura tu cliente SSH para usar `cloudflared` como proxy.

### 1.3. Configuración de Periféricos y Entorno Gráfico

#### 1.3.1 Configuración de Cámaras USB Idénticas

Para garantizar que las cámaras siempre sean reconocidas con el mismo nombre de dispositivo, incluso después de reiniciar, se usan **reglas `udev`**. Esto es crucial para que Docker pueda mapearlas correctamente al contenedor.

##### 1.3.1.1 Identificar Cámaras por Ruta de Hardware (Método para Debian 13)
Para garantizar una identificación estable de las cámaras en sistemas modernos como Debian 13, el método más robusto es usar la variable de entorno `ID_PATH`. Esta variable es creada por `udev` y representa la ruta física y persistente del puerto al que está conectado el dispositivo.

1.  **Instalar Herramientas**:
    Asegúrate de tener `v4l-utils` instalado para poder listar los dispositivos.
    ```bash
    sudo apt install -y v4l-utils
    ```

2.  **Obtener el `ID_PATH` de cada Cámara**:
    Con ambas cámaras conectadas, primero identifica sus descriptores (ej. `/dev/video0`, `/dev/video2`) con `v4l2-ctl --list-devices`. Luego, para cada descriptor, ejecuta el siguiente comando para obtener su `ID_PATH` único:

    ```bash
    # Ejemplo para la primera cámara, que es /dev/video0
    udevadm info --query=property --name=/dev/video0 | grep ID_PATH

    # Ejemplo para la segunda cámara, que es /dev/video2
    udevadm info --query=property --name=/dev/video2 | grep ID_PATH
    ```
    La salida te dará el identificador único para cada puerto. Anota estos valores. Serán similares a:
    ```
    ID_PATH=pci-0000:00:14.0-usb-0:1:1.0
    ID_PATH=pci-0000:00:14.0-usb-0:3:1.0
    ```

3.  **Crear la Regla `udev`**:
    Crea (o edita) el archivo de reglas `/etc/udev/rules.d/99-webcams.rules`. Pega el siguiente contenido, **sustituyendo los valores de `ENV{ID_PATH}`** por los que obtuviste en el paso anterior.

    ```
    # Cámara 1: Asigna el alias /dev/cam_nevera_0 usando su ruta de hardware estable
    SUBSYSTEM=="video4linux", ENV{ID_PATH}=="pci-0000:00:14.0-usb-0:1:1.0", KERNEL=="video*", ATTR{index}=="0", SYMLINK+="cam_nevera_0", GROUP="video", MODE="0666"
    
    # Cámara 2: Asigna el alias /dev/cam_nevera_1 usando su ruta de hardware estable
    SUBSYSTEM=="video4linux", ENV{ID_PATH}=="pci-0000:00:14.0-usb-0:3:1.0", KERNEL=="video*", ATTR{index}=="0", SYMLINK+="cam_nevera_1", GROUP="video", MODE="0666"
    ```
    *   `ENV{ID_PATH}`: Es la clave de esta regla. Hace coincidir el dispositivo con su puerto físico único.
    *   `ATTR{index}=="0"`: Asegura que la regla se aplique solo al dispositivo de captura de video y no a nodos de metadatos.

4.  **Aplicar las Reglas y Verificar**:
    Aplica los cambios y verifica que los enlaces simbólicos se hayan creado correctamente.
    ```bash
    sudo udevadm control --reload-rules
    sudo udevadm trigger
    ls -l /dev/cam*
    ```
    La salida debería mostrar `/dev/cam_nevera_0` y `/dev/cam_nevera_1` apuntando a sus respectivos dispositivos `/dev/videoX`.

---

##### 1.3.1.4  Opcional: Deshabilitar Cámara Integrada

En ocasiones, un PC puede tener una cámara web integrada que interfiere con la numeración de los dispositivos (`/dev/video0`, `/dev/video1`, etc.). Se puede crear una regla `udev` para deshabilitarla de forma segura.

1.  **Identificar la cámara a deshabilitar**:
    Usa `lsusb` para listar los dispositivos USB. Busca la línea de la cámara que quieres omitir.
    ```bash
    lsusb
    ```
    La salida será similar a: `Bus 001 Device 003: ID 174f:14ee Syntek Integrated Camera`. Los datos clave son el `idVendor` (`174f`) y el `idProduct` (`14ee`).

2.  **Crear la regla `udev` de deshabilitación**:
    Crea un nuevo archivo de reglas. El número `40` asegura que se ejecute antes que otras reglas de cámaras.
    ```bash
    sudo nano /etc/udev/rules.d/40-disable-internal-webcam.rules
    ```

3.  **Añadir el contenido de la regla**:
    Pega la siguiente línea, **reemplazando `idVendor` y `idProduct`** con los que encontraste en el paso anterior.
    ```
    ACTION=="add", ATTR{idVendor}=="174f", ATTR{idProduct}=="14ee", RUN+="/bin/sh -c 'echo 1 >/sys/$devpath/remove'"
    ```

4.  **Aplica las reglas** para que el cambio tenga efecto:
    ```bash
    sudo udevadm control --reload-rules
    sudo udevadm trigger
    ```
    Después de esto, la cámara integrada ya no debería aparecer como un dispositivo de video, dejando los índices libres para las cámaras USB.


#### 1.3.2.  **Instalación de Chromium y Gestor de Ventanas**: El contenedor del kiosko solo sirve la web; el anfitrión es responsable de mostrarla.
    ```bash
    sudo apt install -y chromium openbox xorg
    ```

3.  **Script de Arranque Automático del Kiosko (Usuario `kiosko`)**:
    Crea un script para que el usuario sin privilegios `kiosko` lance Chromium al iniciar su sesión gráfica.

    ```bash
    # Crea el archivo de sesión para el usuario 'kiosko'
    sudo nano /home/kiosk/.xsession
    ```
    Añade el siguiente contenido:
    ```bash
    # 1. Desactivar el salvapantallas y el modo de ahorro de energía del monitor.
    #    Esto es crucial para que la pantalla del kiosko nunca se apague.
    xset s off -dpms

    # 2. Iniciar el gestor de ventanas Openbox en segundo plano.
    #    El '&' al final es vital para que el script no se detenga aquí.
    openbox &

    # 3. Bucle infinito para mantener Chromium siempre abierto.
    #    Si el navegador falla o se cierra, este bucle lo volverá a lanzar.
    while true; do
    # Lanzamos Chromium en modo kiosko apuntando a una de las cámaras de Motion.
    # Las opciones adicionales ocultan barras de información y mensajes de error.
    chromium --lang=es-CO --kiosk --no-first-run --disable-infobars --disable-dev-tools --disable-features=Translate "http://localhost:5000"
    # Esperamos 5 segundos antes de reintentar si se cierra.
    sleep 5
    done
    ```
    Dale permisos de ejecución y asigna el propietario correcto:
    ```bash
    sudo chmod +x /home/kiosko/.xsession
    sudo chown kiosko:kiosko /home/kiosko/.xsession
    ```
    Finalmente, configura tu sistema para que inicie sesión automáticamente en el usuario **`kiosko`** (no `nevera1`) y ejecute la sesión X.

---




















## 2. Despliegue de la Aplicación con Docker Compose y GitHub Actions

Esta sección detalla cómo desplegar la aplicación y la pila de monitoreo utilizando **Docker Compose**. El proceso está automatizado a través de **GitHub Actions** para los despliegues continuos, pero también se explica la configuración inicial manual.

### Arquitectura de Despliegue

El sistema se gestiona con `docker-compose`, que orquesta los servicios definidos en los archivos `docker-compose.yml`.

*   **Ramas y Tags del Repositorio:**
    *   `develop`: Esta rama se utiliza para los entornos de **desarrollo y pruebas**. Un `push` a `develop` dispara una actualización automática en los servidores de staging.
    *   `main`: Es la rama principal que contiene el código estable. Los despliegues a producción no se hacen directamente desde un `push` a esta rama.
    *   **Tags (ej: `v1.0.0`)**: La creación de un **tag** en la rama `main` es lo que **dispara el despliegue automático** en los servidores de **producción** (las neveras reales). Este método asegura que solo versiones específicas y validadas lleguen al entorno final.

*   **Estructura de Stacks (Pilas):**
    El proyecto se divide en dos pilas de servicios, cada una gestionada por su propio archivo `docker-compose.yml`:
    1.  **Stack de Aplicación (`app`):** Contiene los servicios principales del negocio.
        *   `nevera`: El cerebro del sistema, procesa imágenes y lógica.
        *   `kiosko`: La interfaz de usuario web que se muestra en la pantalla.
        *   `backup`: Realiza copias de seguridad periódicas.
    2.  **Stack de Monitoreo (`monitoring`):** Servicios para observar la salud y el rendimiento del sistema.
        *   `prometheus`: Recolecta y almacena métricas.
        *   `promtail`: Envía logs a un sistema centralizado (Loki).
        *   `cadvisor`: Expone métricas de los contenedores.
        *   `node-exporter`: Expone métricas del hardware del servidor.

### 2.1. Configuración Inicial del Servidor (Primera Vez)

Este es el flujo de trabajo recomendado para configurar un nuevo servidor de producción desde cero.

> **⚠️ Requisito de Ruta de Instalación**
> Para asegurar la compatibilidad entre entornos y el correcto funcionamiento de los volúmenes de Docker, el proyecto **debe** ser clonado en la siguiente ruta absoluta tanto en el servidor de producción como en las máquinas de desarrollo:
> `/home/nevera1/vorak-imagenes-edge`

1.  **Clonar el Repositorio y Asignar Permisos:**
    Conéctate al servidor y clona el repositorio en la ruta correcta.

    ```bash
    # 1. Clona el repositorio en el home del usuario administrador
    git clone https://github.com/jumaar/vorak-imagenes-edge.git /home/nevera1/vorak-imagenes-edge

    # 2. Navega al directorio del proyecto
    cd /home/nevera1/vorak-imagenes-edge

    # 3. Asegúrate de que tu usuario es el propietario
    # (Reemplaza 'nevera1' si tu usuario es diferente)
    sudo chown -R nevera1:nevera1 .
    ```

2.  **Crear el Archivo `.env`:**
    Este archivo centraliza todas las variables de entorno para los servicios. Es fundamental que esté completo y correcto.
    ```bash
    # Navega al directorio raíz del proyecto
    cd /home/nevera1/vorak-imagenes-edge

    # Crea y edita el archivo .env
    nano .env
    ```
    Rellena todas las variables requeridas para producción (tokens, URLs, etc.).

3.  **Crear la Red de Docker:**
    Se necesita una red común para que los contenedores de las diferentes pilas (`app` y `monitoring`) puedan comunicarse entre sí.
    ```bash
    docker network create vorak-net
    ```

### 2.2. Despliegue Manual (o Primera Vez)

Aunque el despliegue está automatizado, la primera vez o para depuración, puedes lanzarlo manualmente. El script `redeploy.sh` se encarga de todo el proceso.

1.  **Dar Permisos de Ejecución al Script:**
    Solo necesitas hacer esto una vez.
    ```bash
    chmod +x redeploy.sh
    ```

2.  **Ejecutar el Despliegue:**
    Desde el directorio raíz del proyecto (`/home/nevera1/vorak-imagenes-edge`), ejecuta:
    ```bash
    ./redeploy.sh
    ```

    Este script realiza la siguiente secuencia de operaciones:
    1.  **Exporta las variables** del archivo `.env` para que estén disponibles en la sesión.
    2.  **Inicia sesión en el registro de contenedores de GitHub (GHCR)** para poder descargar las imágenes privadas.
    3.  **Levanta la pila de monitoreo** usando `docker-compose -f docker/monitoring/docker-compose.yml up -d`.
    4.  **Levanta la pila de la aplicación** usando `docker-compose -f docker/app/docker-compose.yml up -d`.

### 2.3. Proceso de Actualización Automática (GitHub Actions)

El sistema está configurado para un ciclo de Integración y Despliegue Continuo (CI/CD).

1.  **Activación (Trigger):** Un `git push` a las ramas `main` o `develop` activa el workflow correspondiente en GitHub Actions.
2.  **Construcción de Imágenes:** GitHub Actions construye las nuevas imágenes de Docker para los servicios que hayan cambiado.
3.  **Publicación de Imágenes:** Las nuevas imágenes se publican en el registro de contenedores de GitHub (GHCR).
4.  **Conexión y Despliegue Remoto:**
    *   La acción de GitHub se conecta de forma segura al servidor de la nevera a través de SSH.
    *   Una vez en el servidor, ejecuta los siguientes comandos:
        *   `git pull`: Para sincronizar el código fuente, incluyendo los `docker-compose.yml`.
        *   `./redeploy.sh`: Ejecuta el mismo script de despliegue, que se encarga de descargar las nuevas imágenes (`docker-compose pull`) y reiniciar los servicios con la nueva configuración (`docker-compose up -d`).

Este flujo asegura que cualquier cambio en el código se refleje automáticamente en el entorno correspondiente (producción o desarrollo) sin intervención manual.


































### 3. Comandos de Gestión

Para gestionar los servicios desplegados, puedes usar los siguientes comandos:

```bash
# Listar todos los stacks activos
docker ps -a

# Ver los servicios de un stack específico y su estado
cd /home/nevera1/vorak-imagenes-edge/docker/app/ && docker-compose ps
cd /home/nevera1/vorak-imagenes-edge/docker/monitoring/ && docker-compose ps

# Ver los logs de los servicios

# --- Logs por Stack (desde el directorio del proyecto) ---
# Ver logs de la aplicación en tiempo real
docker-compose -f docker/app/docker-compose.yml logs -f

# Ver logs del monitoreo en tiempo real
docker-compose -f docker/monitoring/docker-compose.yml logs -f

# --- Logs por Servicio Individual ---
docker logs -f nevera
docker logs -f kiosko
docker logs -f backup

# Para detener los servicios (esto no borra los volúmenes de datos)
cd /home/nevera1/vorak-imagenes-edge/
docker-compose -f docker/app/docker-compose.yml down
docker-compose -f docker/monitoring/docker-compose.yml down
---

# 3. Transferencia de Archivos (Auditoría)

Para copiar las imágenes de sesiones de baja confianza desde la nevera a tu PC de administración para su revisión.

1.  **Comando `ssh`**: Ejecuta este comando en tu PC local.
    ```bash
    conectarse al servidor 
     ``ssh nevera1@ssh-nevera1.lenstextil.com`

    
    revisar el estado del servidor
    `systemctl status`

    
2.  **Comando `scp`**: Ejecuta este comando en tu PC local.
    ```bash
    # Copia la carpeta 'review_queue' completa a tu directorio actual para revisar las imagenes de transaciones low 
    scp -r nevera1@ssh-nevera1.lenstextil.com:/home/nevera1/vorak-imagenes-edge/review_queue/ .
    ```

3.  **Actualizar Archivos de Configuración**: Para copiar un archivo `.env` actualizado a la nevera:
    ```bash
    # Desde tu PC local
    scp ./mi_nuevo.env nevera1@ssh-nevera1.lenstextil.com:/home/nevera1/vorak-imagenes-edge/.env
    ```
    > **Importante**: Después de actualizar el archivo `.env` en el servidor, debes ejecutar `./redeploy.sh` para que los servicios tomen los nuevos valores. Si el despliegue es automático, basta con hacer `push` de los cambios.
```bash
### Conexión SSH Directa
```bash
ssh nevera1@ssh-nevera1.lenstextil.com
```

Para ver la interfaz del kiosko (puerto 5000) en tu navegador local:
```bash
ssh -L 5000:localhost:5000 nevera1@ssh-nevera1.lenstextil.com
```
Luego, abre `http://localhost:5000` en tu navegador.
