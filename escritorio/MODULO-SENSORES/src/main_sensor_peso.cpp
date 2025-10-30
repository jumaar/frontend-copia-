#include <Arduino.h>
#include <HX711.h>
#include <Preferences.h>
#include <time.h> // Para manejar el timestamp

// --- CONFIGURACIÓN DE PINES ---
// HX711
const int HX711_DT = 16;
const int HX711_SCK = 17;

// Botón de tara
const int PIN_BOTON_TARA = 15;

// --- PARÁMETROS DE CALIBRACIÓN ---
const float CALIBRATION_FACTOR = 100.739; // ¡¡REEMPLAZA ESTE VALOR POR EL QUE OBTUVISTE EN LA CALIBRACIÓN!!
const float UMBRAL_CERO_ESTABLE = 5.0; // gramos. Si el peso está entre +/- este valor, se considera 0.

// Parámetros para sincronización de tiempo
const long INTERVALO_SINCRONIZACION = 3600000; // 1 hora en milisegundos
unsigned long ultimoTiempoSincronizacion = 0;

// --- OBJETOS DE HARDWARE ---
HX711 scale;
Preferences preferences;

// --- VARIABLES PARA TARA PERSISTENTE ---
long tareOffset = 0;
const char* PREF_TARE_KEY = "tareOffset";

// --- VARIABLES GLOBALES ---
volatile bool flagHacerTara = false;

enum TimeSyncState { SYNC_IDLE, SYNC_WAITING_RESPONSE };
TimeSyncState timeSyncState = SYNC_IDLE;
unsigned long timeSyncRequestTimestamp = 0;
const long TIME_SYNC_TIMEOUT = 5000; // 5 segundos

// --- FUNCIÓN DE INTERRUPCIÓN PARA EL BOTÓN DE TARA ---
void IRAM_ATTR isr_BotonTara() {
  flagHacerTara = true;
}

// --- FUNCIÓN PARA OBTENER EL TIMESTAMP UNIX ---
String obtenerTimestampUnix() {
  time_t rawtime;
  time(&rawtime);
  return String(rawtime);
}

// --- FUNCIÓN PARA SINCRONIZAR LA HORA ---
void sincronizarHora() {
  Serial.println("SYNC_TIME");
  timeSyncState = SYNC_WAITING_RESPONSE;
  timeSyncRequestTimestamp = millis();
  ultimoTiempoSincronizacion = millis();
}

// --- FUNCIÓN PARA PROCESAR LA RESPUESTA DE SINCRONIZACIÓN ---
void procesarRespuestaDeHora() {
  String respuesta = Serial.readStringUntil('\n');
  respuesta.trim(); // Eliminar espacios en blanco y caracteres de nueva línea
  
  if (respuesta == "SYNC_OK") {
    Serial.println("Reloj sincronizado correctamente");
    timeSyncState = SYNC_IDLE;
  } else {
    Serial.println("Error: Respuesta inesperada al sincronizar reloj");
    timeSyncState = SYNC_IDLE;
  }
}

// --- FUNCIÓN SETUP ---
void setup() {
  Serial.begin(9600);
  // Mensaje de inicio en formato JSON
  Serial.println("{\"status\":\"iniciando\"}");
  
  pinMode(PIN_BOTON_TARA, INPUT_PULLUP);
  attachInterrupt(digitalPinToInterrupt(PIN_BOTON_TARA), isr_BotonTara, FALLING);
  
  // Inicializar HX711
 scale.begin(HX711_DT, HX711_SCK);
  scale.set_scale(CALIBRATION_FACTOR);
  
  // Cargar tara persistente
  preferences.begin("sensor_peso", false);
 tareOffset = preferences.getLong(PREF_TARE_KEY, 0);
  scale.set_offset(tareOffset);
  Serial.print("Offset de tara cargado de memoria: ");
  Serial.println(tareOffset);
  
  // Mensaje de confirmación
  Serial.println("{\"status\":\"listo\"}");
  
  // Solicitar sincronización de hora al inicio
  sincronizarHora();
}

// --- FUNCIÓN LOOP ---
void loop() {
  // --- GESTIÓN DE SINCRONIZACIÓN DE HORA (NO BLOQUEANTE) ---
  if (timeSyncState == SYNC_IDLE && (millis() - ultimoTiempoSincronizacion >= INTERVALO_SINCRONIZACION)) {
    sincronizarHora();
  }

  if (timeSyncState == SYNC_WAITING_RESPONSE) {
    if (Serial.available() > 0) {
      procesarRespuestaDeHora();
    } else if (millis() - timeSyncRequestTimestamp > TIME_SYNC_TIMEOUT) {
      Serial.println("Error: No se recibió respuesta de sincronización de hora. Reintentando más tarde.");
      timeSyncState = SYNC_IDLE; // Vuelve al estado inactivo para reintentar después
    }
  }
  
  // Procesar evento de tara si se detecta
 if (flagHacerTara) {
    flagHacerTara = false;
    
    // Realizar tara
    tareOffset = scale.read_average(10);
    preferences.putLong(PREF_TARE_KEY, tareOffset);
    scale.set_offset(tareOffset);
    
    Serial.println(tareOffset);
 }
  
  // Leer peso actual
  float pesoActual = scale.get_units(5); // Usar lectura promediada para estabilidad
  
  // Aplicar la "zona muerta" para un cero estable
  if (abs(pesoActual) < UMBRAL_CERO_ESTABLE) {
    pesoActual = 0;
  }
  
  // Enviar peso en tiempo real por serial con formato: peso
  Serial.println((int)pesoActual);
  // Esperar un poco antes de la próxima lectura (para evitar sobrecarga del puerto serial)
  delay(300);
}