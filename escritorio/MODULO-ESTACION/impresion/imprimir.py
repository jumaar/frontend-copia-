import serial
import time
from PIL import Image, ImageDraw, ImageFont 

# --- CONFIGURACIÓN PARA USB-SERIAL ---
PUERTO_COM = "COM5"
VELOCIDAD_BAUD = 9600 # La velocidad que usa el driver de COM5
# -------------------------------------

# --- PARÁMETROS DE LA ETIQUETA ---
ANCHO_DOTS = 320 # 40mm
ALTO_DOTS = 240  # 30mm
ANCHO_BYTES = ANCHO_DOTS // 8 # ¡Siempre 8!
# --------------------------------

# --- 1. Crear la imagen en memoria (Sin cambios) ---
print("Creando imagen bitmap para 4 líneas...")

img = Image.new('1', (ANCHO_DOTS, ALTO_DOTS), 255)
d = ImageDraw.Draw(img)

NUEVO_TAMANO = 20
try:
    font = ImageFont.truetype("arial.ttf", NUEVO_TAMANO)
except IOError:
    font = ImageFont.load_default()

x_pos = 10 
y_pos = 10
linea_alto = NUEVO_TAMANO + 5 

d.text((x_pos, y_pos), "Linea 1: Producto A", font=font, fill=0)
y_pos += linea_alto
d.text((x_pos, y_pos), "Linea 2: $15.000", font=font, fill=0)
y_pos += linea_alto 
d.text((x_pos, y_pos), "Linea 3: Lote: 456B", font=font, fill=0)
y_pos += linea_alto 
d.text((x_pos, y_pos), "Linea 4: Vence: 30/10/25", font=font, fill=0)

datos_bitmap = img.tobytes()

# --- 2. Enviar los comandos a la impresora ---
try:
    print(f"Conectando a {PUERTO_COM} a {VELOCIDAD_BAUD} baud...")
    
    ser = serial.Serial(
        port=PUERTO_COM,
        baudrate=VELOCIDAD_BAUD,
        bytesize=8,
        parity='N',
        stopbits=1,
        timeout=1,
        # --- ¡LA SOLUCIÓN A LA DEMORA! ---
        # Esta es la señal de "despertador" que COM5 necesita
        dsrdtr=True 
        # ----------------------------------
    )
    
    print("¡Conexión exitosa!")
    
    ser.write(b"CLS\n")
    ser.write(b"SIZE 40 mm, 30 mm\n")
    ser.write(b"GAP 0, 0\n")
    ser.write(b"DENSITY 15\n") 

    print("Enviando comando BITMAP...")
    
    # El ajuste de margen que encontramos
    X_OFFSET = -30 
    comando_header = f"BITMAP {X_OFFSET}, 0, {ANCHO_BYTES}, {ALTO_DOTS}, 0, ".encode('ascii')
    
    ser.write(comando_header)
    ser.write(datos_bitmap)
    ser.write(b"\n") 

    ser.write(b"PRINT 1\n") # Aquí está tu comando de "1 hoja"
    
    print("Comandos enviados.")
    
    ser.flush() # Forzamos la salida de datos
    print("¡Buffer vacío!")

    time.sleep(1) 
    ser.close()
    
    print("Puerto cerrado. ¡Impresión INMEDIATA en COM5!")

except Exception as e:
    print(f"Ocurrió un error: {e}")