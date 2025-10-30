from flask import Flask, request, jsonify, abort, send_from_directory
import json
import os
from dotenv import load_dotenv
import datetime
import jwt
from functools import wraps
from flask_bcrypt import Bcrypt

# Cargar variables de entorno desde el archivo .env
load_dotenv()

# --- Configuración ---
# Directorio del script para rutas robustas
SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))

# Clave secreta para firmar los JWT. Se lee desde las variables de entorno.
JWT_SECRET = os.getenv('JWT_SECRET', "fallback-secret-key-if-env-is-missing")

# Nombre del archivo que actúa como nuestra base de datos de productos
DB_FILE = "products.json"
# Nombre del archivo que actúa como nuestra base de datos de neveras
FRIDGES_DB_FILE = "fridges_db.json"

# Crear la aplicación del servidor
app = Flask(__name__)
# Configurar la clave secreta para la app (usada por JWT y otras extensiones)
app.config['JWT_SECRET'] = JWT_SECRET
bcrypt = Bcrypt(app)

# --- Decorador de Autenticación (Guardia de Seguridad) ---
def token_required(f):
    @wraps(f)
    def decorated_function(*args, **kwargs):
        token = None
        auth_header = request.headers.get('Authorization')

        # Verifica que el token venga en la cabecera con el formato 'Bearer <token>'
        if auth_header and auth_header.startswith('Bearer '):
            token = auth_header.split(' ')[1]

        if not token:
            abort(401, description="Unauthorized: Token is missing or has an invalid format.")

        try:
            # Decodifica y valida el token (verifica firma y expiración)
            payload = jwt.decode(token, app.config['JWT_SECRET'], algorithms=["HS256"])
            token_fridge_id = payload['fridge_id']
            
            # Seguridad extra: el token solo debe dar acceso a los recursos de su propia nevera
            url_fridge_id = kwargs.get('fridge_id')
            if url_fridge_id and token_fridge_id != url_fridge_id.upper():
                abort(403, description="Forbidden: Token does not grant access to this resource.")

        except jwt.ExpiredSignatureError:
            abort(401, description="Unauthorized: Token has expired.")
        except jwt.InvalidTokenError:
            abort(401, description="Unauthorized: Token is invalid.")
        
        # Si todo está bien, permite que la petición continúe
        return f(*args, **kwargs)
    return decorated_function

# --- Rutas de la API ---

## 0. Ruta para que la nevera se autentique y obtenga un token (POST)
@app.route('/api/auth/login', methods=['POST'])
def login():
    """Autentica una nevera y devuelve un token JWT si las credenciales son correctas."""
    auth_data = request.json
    if not auth_data or not auth_data.get('fridgeId') or not auth_data.get('secret'):
        abort(401, description="Authentication failed: 'fridgeId' and 'secret' are required.")

    fridge_id = auth_data.get('fridgeId').upper()

    try:
        with open(FRIDGES_DB_FILE, 'r', encoding='utf-8') as f:
            fridges_db = json.load(f)
    except (FileNotFoundError, json.JSONDecodeError):
        print(f"*** ERROR: No se pudo cargar el archivo de neveras {FRIDGES_DB_FILE}")
        abort(500, description="Server configuration error.")

    fridge_data = fridges_db.get(fridge_id)

    if not fridge_data:
        print(f"    -> ❌ ACCESO DENEGADO. Nevera no encontrada: '{fridge_id}'")
        abort(401, description="Authentication failed: Invalid credentials.")

    # Compara el 'secret' enviado con el hash guardado en la BD
    if bcrypt.check_password_hash(fridge_data.get('secret_hash'), auth_data.get('secret')):
        # Si la contraseña es correcta, genera el token JWT
        print(f"    -> ✅ ACCESO CONCEDIDO. Generando token para '{fridge_id}'")
        token_payload = {
            'fridge_id': fridge_id,
            'iat': datetime.datetime.utcnow(), # Issued at
            'exp': datetime.datetime.utcnow() + datetime.timedelta(hours=24) # Expiration
        }
        token = jwt.encode(token_payload, app.config['JWT_SECRET'], algorithm="HS256")

        return jsonify({
            "access_token": token,
            "expires_in": 24 * 60 * 60 # 24 horas en segundos
        })

    print(f"    -> ❌ ACCESO DENEGADO. Contraseña incorrecta para '{fridge_id}'")
    abort(401, description="Authentication failed: Invalid credentials.")

## 1. Ruta para que la nevera envíe datos de eventos (POST)
# Escucha peticiones POST en la nueva ruta unificada: http://.../api/transactions/NEVERA-001-SANTAROSA
@app.route('/api/transactions/<fridge_id>', methods=['POST'])
@token_required
def recibir_transacciones_nevera(fridge_id):
    """Recibe y muestra los datos JSON enviados por la nevera."""
    # Normalizamos el ID a mayúsculas para que la lógica sea consistente.
    fridge_id_upper = fridge_id.upper()

    print(f">>> Lote de transacciones POST recibido para la nevera '{fridge_id_upper}' en /api/transactions/{fridge_id}:")
    
    datos = request.json
    # Imprime los datos recibidos en la terminal de forma ordenada
    print(json.dumps(datos, indent=4))
    
    # Responde a la nevera confirmando que se recibió
    return {"status": "lote de transacciones procesado"}, 200

## 2. Ruta para que la nevera pida la "base de datos" (GET)
# Escucha peticiones GET en la nueva ruta unificada: http://.../api/products/NEVERA-001-SANTAROSA
@app.route('/api/products/<fridge_id>', methods=['GET'])
@token_required
def enviar_productos(fridge_id):
    """Lee el archivo products.json y lo devuelve a quien lo pida."""
    print(f">>> Petición GET para la base de datos de productos recibida para la nevera: {fridge_id}")
    
    try:
        with open(DB_FILE, 'r', encoding='utf-8') as f:
            data = json.load(f)
        # Devuelve el contenido del archivo como una respuesta JSON
        return jsonify(data)
    except FileNotFoundError:
        # Si el archivo no existe, envía un error claro
        print(f"*** ERROR: No se encontró el archivo {DB_FILE}")
        abort(404, description=f"El archivo {DB_FILE} no fue encontrado en el servidor.")

## 3. Ruta para que el kiosko pida la playlist de publicidad (GET)
# Escucha peticiones GET en la URL: http://.../api/playlist/NEVERA-001-SANTAROSA
@app.route('/api/playlist/<fridge_id>', methods=['GET'])
@token_required
def enviar_playlist(fridge_id):
    """
    Devuelve una lista de reproducción (playlist) de ejemplo para el kiosko.
    En un sistema real, esta lógica consultaría una base de datos.
    """
    # Normalizamos el ID a mayúsculas para que la lógica sea consistente.
    fridge_id_upper = fridge_id.upper()

    print(f">>> Petición GET para playlist recibida para la nevera: {fridge_id_upper} (original: '{fridge_id}')")

    # --- CAPA DE SEGURIDAD (AHORA MANEJADA POR EL DECORADOR @token_required) ---
    # --- LÓGICA DE NEGOCIO PERSONALIZADA ---
    # Aquí es donde usas el fridge_id para decidir qué mostrar.

    if fridge_id_upper == "NEVERA-001-SANTAROSA":
        # Esta nevera tiene una promoción especial de chorizos
        print(f"    -> Nevera '{fridge_id_upper}' tiene promoción de chorizos. Sirviendo playlist personalizada.")
        playlist_data = {
            "media": [
                {
                    "url": f"{request.host_url}local_media/4253351-uhd_4096_2160_25fps.mp4",
                    "type": "video",
                },
                {
                    "url": "https://cdn.pixabay.com/photo/2019/11/04/14/56/chorizo-4601353_1280.jpg",
                    "type": "image",
                    "duration_seconds": 20
                },
                {
                  
                    "url": "https://cdn.pixabay.com/photo/2018/10/12/10/30/piglet-3741877_1280.jpg",
                    "type": "image",
                     "duration_seconds": 20
                },
                {
                    "url": "https://cdn.pixabay.com/photo/2015/03/24/06/43/pork-687154_1280.jpg",
                    "type": "image",
                    "duration_seconds": 20
                }
            ]
        }
    elif fridge_id_upper == "NEVERA-002-SANTAROSA":
        # Esta nevera tiene una promoción de pollo
        print(f"    -> Nevera '{fridge_id_upper}' tiene promoción de pollo. Sirviendo playlist personalizada.")
        playlist_data = {
            "media": [
                {
                    # El kiosko necesita la URL completa, que construimos dinámicamente.
                    # Asegúrate de tener un archivo 'video.mp4' en tu carpeta.
                    "url": f"{request.host_url}local_media/4253351-uhd_4096_2160_25fps.mp4",
                    "type": "video",
                }
            ]
        }
    else:
        # Para cualquier otra nevera, mostramos la publicidad por defecto
        print(f"    -> Sirviendo playlist por defecto para la nevera '{fridge_id_upper}'.")
        playlist_data = {
            "media": [
                {
                    "url": "https://img.freepik.com/foto-gratis/vista-frontal-filetes-carne-cruda-tabla-cortar-madera-cuchillo-carnicero-sobre-fondo-negro_140725-88699.jpg",
                    "type": "image",
                    "duration_seconds": 15
                }
            ]
        }
    
    return jsonify(playlist_data)

## 4. Ruta para servir archivos estáticos locales (como el video de prueba)
@app.route('/local_media/<path:filename>')
def serve_local_media(filename):
    """Sirve un archivo desde la misma carpeta donde se ejecuta el servidor."""
    print(f">>> Petición GET para archivo local: {filename}")
    # Usamos SCRIPT_DIR para que la ruta sea siempre correcta, sin importar desde dónde se ejecute.
    return send_from_directory(SCRIPT_DIR, filename, as_attachment=False)



# --- Arranque del Servidor ---
if __name__ == '__main__':
    # Inicia el servidor en el puerto 8000, visible en tu red local
    app.run(host='0.0.0.0', port=8000, debug=True)