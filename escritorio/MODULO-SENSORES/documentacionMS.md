
# MODULO DE SENSORES NEVERA - Versión 0.2
Módulo de Sensores para Nevera IoT
Descripción General
Este firmware convierte una placa ESP32 en un concentrador de sensores (Sensor Hub) para una nevera inteligente. Su función es leer datos de sensores de puerta, temperatura y peso, y transmitirlos como eventos en formato JSON a un dispositivo anfitrión (PC/Raspberry Pi) a través de una conexión serie (USB).

# COMPONENTES DE HARDWARE
1x Microcontrolador: 1x ESP32 Dev Module
4x Celdas de Carga de Barra (20kg)
1x Módulo Amplificador HX711
1x Sensor Magnético de Puerta
1x Sensor de Temperatura DS18B20 (a prueba de agua)
1x Buzzer/Pito (para alarma de puerta abierta)
1x Botón Pulsador (para la función de Tara)
1x Resistencia de 4.7kΩ (pull-up para el DS18B20)

# Plano de Conexiones (Pinout)
Pin ESP32	Componente	    Uso Específico
GPIO 4	    Sen.Temp    	Línea de Datos
GPIO 15	    Sen.Puerta	    Lectura de Estado
GPIO 27	    Botón de Tara	Disparador de Tara
GPIO 26	    Módulo HX711	Datos (DT)
GPIO 25	    Módulo HX711	Reloj (SCK)
GPIO 23	    Buzzer/Pito	    Alarma de Puerta Abierta

Conecta el buzzer/pito en el pin GPIO 23 del ESP32

Terminal positivo (+) del buzzer → GPIO 23
Terminal negativo (-) del buzzer → GND








## TAREAS  --> V 0.2

nota: en este apartado se colocan ideas y posibles mejoras a futuro , cuando se coloca una queda pendiente, si la tarea se realiza esta se elinina de aca y se implementa inmediatamente en la docuentacion si la mejora fuera positiva.( si esta vacio no hay nada pendiente)

- Tarea fija: En que version de este modulo estamos para git?  -> 0.2

(No hay tareas pendientes)






# Protocolo de Comunicación
Baud Rate: 115200
Formato: JSON
Delimitador: Cada mensaje JSON se envía como una sola línea y termina con un carácter de nueva línea (\n).

# Tipos de Mensajes JSON

1. Reporte de Estado (status_report)
Enviado periódicamente (cada 30 segundos) para dar un estado general del sistema.

JSON

{"event":"status_report","timestamp":1757007000123456,"door_open":false,"temperature_c":2.10,"weight_kg":85.451,"status_code":1}



### Códigos de Estado (status_code)

*   **1: OK**
    *   Indica que todos los sistemas funcionan correctamente y la temperatura está dentro del rango normal (entre 0.5°C y 4.0°C).
    *   `{"event":"status_report", ... ,"temperature_c":2.5, ... ,"status_code":1}`

*   **2: FUERA_RANGO (Temperatura Anormal)**
    *   Indica que la temperatura de la nevera está por encima del máximo permitido o por debajo del mínimo.
    *   `{"event":"status_report", ... ,"temperature_c":8.2, ... ,"status_code":2}`

*   **3: FALLA_SENSOR (Fallo del Sensor de Temperatura)**
    *   Indica que no se pudo leer el sensor de temperatura. El valor de `temperature_c` será anómalo (ej. -127.0).
    *   `{"event":"status_report", ... ,"temperature_c":-127.0, ... ,"status_code":3}`

*   **4: DESCONOCIDO (Default)**
    *   Estado inicial antes de la primera lectura de temperatura o si ocurre una condición no definida.
    *   `{"event":"status_report", ... ,"status_code":4}`

2. Evento de Puerta (door_change)
Enviado en el instante en que la puerta se abre o se cierra.

Al abrir:
JSON
{"event":"door_change","timestamp":1757007015123456,"status":"open","initial_weight_g":85451}

Al cerrar:
JSON
{"event":"door_change","timestamp":1757007025678910,"status":"closed","final_weight_g":84931}

3. Evento de Cambio de Peso (weight_change)
Enviado cada vez que se detecta un cambio de peso significativo y estable, independientemente del estado de la puerta.
JSON
{"event":"weight_change","timestamp":1757007022112233,"change_g":-520}

4. Evento de Tara (tare_button)
Enviado cuando se presiona el botón de tara manual.
JSON
{"event":"tare_button","message":"Tare offset saved","timestamp":1757006990987654}
Configuración y Uso

5. Evento de Alarma de Puerta (door_alarm)
Enviado cuando la puerta permanece abierta por más de 20 segundos (alarma suave) y 30 segundos (alarma rápida).
 

# Librerías Arduino:
El firmware requiere las siguientes librerías:
HX711 bogdan necula v 0.7.5
OneWire jim studt v 2.3.8
DallasTemperature miles burton v 4.0.5


# Calibración:
Antes del despliegue final, el valor de CALIBRATION_FACTOR en el código debe ser ajustado con un peso conocido para asegurar la precisión de la báscula.


# Sincronización de Hora:
se envia la hora cruda y el sistema de open door activa un proceso de sincronización y normalizacion con la hora del pc que controla la nevera. asi el timestamp de los sensores se traduce a la hora del pc controlador


# Sistema de Alarma de Puerta Abierta:
El buzzer conectado al GPIO 23 tiene un comportamiento progresivo:
- **20 segundos**: Inicia alarma suave con beeps lentos (1 beep cada 1 segundo, duración 100ms)
- **30 segundos**: Cambia a alarma rápida con beeps urgentes (1 beep cada 0.3 segundos, duración 100ms)
- La alarma se desactiva automáticamente al cerrar la puerta
