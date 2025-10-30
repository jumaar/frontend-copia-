#include <Arduino.h>

// --- LIBRERÍAS ---
#include <HX711.h>
#include <OneWire.h> // Librería para temperatura
#include <DallasTemperature.h>
#include <Preferences.h> // Librería para la memoria persistente
#include <WiFi.h> // Necesaria para controlar el módulo WiFi
#include <time.h> // Para manejar el timestamp

// --- CONFIGURACIÓN DE PINES (Según tu plano) ---
// Báscula
const int HX711_DT = 26;
const int HX711_SCK = 25;

// Sensores y Botones
const int PIN_SENSOR_PUERTA = 15;
const int PIN_BOTON_TARA = 27;
const int PIN_SENSOR_TEMP = 4;

// Buzzer para alarma de puerta abierta
const int PIN_BUZZER = 23;


// --- PARÁMETROS DE LÓGICA ---
const float CALIBRATION_FACTOR = 25.75; // ¡¡RECUERDA AJUSTAR ESTE VALOR!!
const long INTERVALO_LECTURA_TEMP = 30000; // 30 segundos
const float TEMP_MAX_OK = 4.0;
const float TEMP_MIN_OK = 0.5;

// Parámetros para alarma de puerta abierta
const long TIEMPO_ALARMA_SUAVE = 20000; // 20 segundos - alarma suave
const long TIEMPO_ALARMA_RAPIDA = 30000; // 30 segundos - alarma rápida
const long INTERVALO_BEEP_SUAVE = 1000; // 1 segundo entre beeps (suave)
const long INTERVALO_BEEP_RAPIDO = 300; // 0.3 segundos entre beeps (rápido)
const long DURACION_BEEP = 100; // 100ms de duración del beep

const float UMBRAL_CAMBIO_PESO = 150.0; // gramos
const long INTERVALO_ESTABILIDAD = 300; // ms
const float TOLERANCIA_ESTABILIDAD = 50.0; // gramos

const long INTERVALO_SINCRONIZACION = 3600000; // 1 hora en milisegundos
unsigned long ultimoTiempoSincronizacion = 0;


// --- OBJETOS DE HARDWARE ---
HX711 scale;
OneWire oneWire(PIN_SENSOR_TEMP);
DallasTemperature tempSensor(&oneWire);
Preferences preferences; // Objeto para manejar la memoria NVS

// --- VARIABLES PARA TARA PERSISTENTE ---
long tareOffset = 0; // Almacenará el offset de la báscula leído de la memoria
const char* PREF_TARE_KEY = "tareOffset"; // Clave para guardar el valor en memoria

// --- VARIABLES DE ESTADO Y GLOBALES ---
bool puertaAbierta = false;
float ultimoPesoConocido = 0;
float temperaturaActual = -127.0;
int statusActual = 4; // 1:OK, 2:FUERA_RANGO, 3:FALLA_SENSOR, 4:DESCONOCIDO

unsigned long ultimoTiempoLecturaTemp = 0;
unsigned long tiempoAperturaPuerta = 0; // Para controlar alarma de puerta abierta
bool alarmaActiva = false;
unsigned long ultimoBeep = 0; // Para controlar el timing de los beeps
bool estadoBuzzer = false; // Estado actual del buzzer (encendido/apagado)

volatile bool flagCambioDePuerta = false;
volatile bool flagHacerTara = false;

bool esperandoEstabilidad = false;
unsigned long tiempoInicioEstabilidad = 0;
float pesoPotencial = 0;

enum TimeSyncState { SYNC_IDLE, SYNC_WAITING_RESPONSE };
TimeSyncState timeSyncState = SYNC_IDLE;
unsigned long timeSyncRequestTimestamp = 0;
const long TIME_SYNC_TIMEOUT = 5000; // 5 segundos


// --- DECLARACIONES DE FUNCIONES ---
void procesarRespuestaDeHora();

// --- FUNCIÓN PARA OBTENER EL TIMESTAMP ---
String obtenerTimestamp() {
  struct timeval tv;
  gettimeofday(&tv, NULL);
  unsigned long long epoch_micros = (unsigned long long)tv.tv_sec * 1000000ULL + tv.tv_usec;
  char buffer[21];
  sprintf(buffer, "%llu", epoch_micros);
  return String(buffer);
}

// --- FUNCIÓN PARA SINCRONIZAR LA HORA ---
void sincronizarHoraBloqueante() {
  Serial.println("GET_TIME");
  unsigned long timeout = millis();
  while (Serial.available() == 0) {
    if (millis() - timeout > TIME_SYNC_TIMEOUT) { // Espera 5 segundos
      Serial.println("Error: No se recibió la hora del PC en el arranque.");
      return; // Sale de la función si no hay respuesta
    }
  }
  procesarRespuestaDeHora();
}

void procesarRespuestaDeHora() {
  String timestamp_str = Serial.readStringUntil('\n');
  if (timestamp_str.length() > 0) {
    unsigned long long epoch_micros = atoll(timestamp_str.c_str());
    time_t seconds = epoch_micros / 1000000ULL;
    suseconds_t microseconds = epoch_micros % 1000000ULL;
    struct timeval tv = { .tv_sec = (time_t)seconds, .tv_usec = microseconds };
    settimeofday(&tv, NULL);
    Serial.print("Reloj sincronizado a: ");
    Serial.println(obtenerTimestamp());
    timeSyncState = SYNC_IDLE;
  }
}


// --- FUNCIONES DE INTERRUPCIÓN (ISRs) ---
void IRAM_ATTR isr_Puerta() {
  static unsigned long last_interrupt_time = 0;
  unsigned long interrupt_time = millis();
  if (interrupt_time - last_interrupt_time > 200) {
    flagCambioDePuerta = true;
    last_interrupt_time = interrupt_time;
  }
}
void IRAM_ATTR isr_BotonTara() {
  flagHacerTara = true;
}

// ======================================================
// === FUNCIÓN DE CONFIGURACIÓN PRINCIPAL (SETUP) ===
// ======================================================
void setup() {
  Serial.begin(115200);
  
  // --- OPTIMIZACIÓN ---
  WiFi.mode(WIFI_OFF);
  btStop();
  Serial.println("WiFi y Bluetooth desactivados.");

  // --- SINCRONIZACIÓN DE HORA CON EL PC ---
  sincronizarHoraBloqueante(); // Realizar una sincronización bloqueante al inicio

  // --- INICIALIZACIÓN DE SENSORES Y BUZZER ---
  tempSensor.begin();
  
  pinMode(PIN_BUZZER, OUTPUT);
  digitalWrite(PIN_BUZZER, LOW); // Buzzer apagado inicialmente

  pinMode(PIN_SENSOR_PUERTA, INPUT_PULLUP);
  attachInterrupt(digitalPinToInterrupt(PIN_SENSOR_PUERTA), isr_Puerta, CHANGE);
  pinMode(PIN_BOTON_TARA, INPUT_PULLUP);
  attachInterrupt(digitalPinToInterrupt(PIN_BOTON_TARA), isr_BotonTara, FALLING);

  // --- INICIALIZACIÓN DE BÁSCULA ---
  scale.begin(HX711_DT, HX711_SCK);
  scale.set_scale(CALIBRATION_FACTOR);

  // --- CARGA DE TARA PERSISTENTE ---
  preferences.begin("nevera-app", false);
  tareOffset = preferences.getLong(PREF_TARE_KEY, 0);
  scale.set_offset(tareOffset);
  Serial.print("Offset de tara cargado de memoria: ");
  Serial.println(tareOffset);
  
  ultimoPesoConocido = scale.get_units(10);
  Serial.print("Peso inicial estabilizado: ");
  Serial.print(ultimoPesoConocido, 0);
  Serial.println(" g");

  // Forzar primera lectura y actualización de pantalla en el primer loop
  ultimoTiempoLecturaTemp = millis() - INTERVALO_LECTURA_TEMP; 

  Serial.println("--- Sistema de Nevera Inteligente Iniciado ---");
}


// ======================================================
// === BUCLE PRINCIPAL (LOOP) --- CON TIMESTAMPS EN EVENTOS ===
// ======================================================
void loop() {
  // --- TAREA 0: GESTIÓN DE SINCRONIZACIÓN DE HORA (NO BLOQUEANTE) ---
  if (timeSyncState == SYNC_IDLE && (millis() - ultimoTiempoSincronizacion >= INTERVALO_SINCRONIZACION)) {
    Serial.println("GET_TIME");
    timeSyncState = SYNC_WAITING_RESPONSE;
    timeSyncRequestTimestamp = millis();
    ultimoTiempoSincronizacion = millis();
  }

  if (timeSyncState == SYNC_WAITING_RESPONSE) {
    if (Serial.available() > 0) {
      procesarRespuestaDeHora();
    } else if (millis() - timeSyncRequestTimestamp > TIME_SYNC_TIMEOUT) {
      Serial.println("Error: No se recibió la hora del PC. Reintentando más tarde.");
      timeSyncState = SYNC_IDLE; // Vuelve al estado inactivo para reintentar después
    }
  }
  // --- TAREA 1: GESTIÓN DE EVENTOS POR INTERRUPCIÓN ---
  if (flagHacerTara) {
    flagHacerTara = false;
    Serial.println("Realizando tara manual y guardando offset...");
    
    tareOffset = scale.read_average(20);
    preferences.putLong(PREF_TARE_KEY, tareOffset);
    scale.set_offset(tareOffset);
    
    ultimoPesoConocido = 0;
    Serial.print("{\"event\":\"tare_button\",\"message\":\"Tare offset saved\",\"timestamp\":");
    Serial.print(obtenerTimestamp());
    Serial.println("}");
  }
  
  if (flagCambioDePuerta) {
    flagCambioDePuerta = false;
    delay(50);
    bool estadoActualPuerta = digitalRead(PIN_SENSOR_PUERTA);

    if (estadoActualPuerta && !puertaAbierta) {
      puertaAbierta = true;
      tiempoAperturaPuerta = millis(); // Registrar tiempo de apertura
      alarmaActiva = false;
      estadoBuzzer = false;
      digitalWrite(PIN_BUZZER, LOW); // Asegurar que buzzer esté apagado
      ultimoPesoConocido = scale.get_units(10);
      
      Serial.print("{\"event\":\"door_change\",\"timestamp\":");
      Serial.print(obtenerTimestamp());
      Serial.print(",\"status\":\"open\",\"initial_weight_g\":");
      Serial.print(ultimoPesoConocido, 0);
      Serial.println("}");

    } else if (!estadoActualPuerta && puertaAbierta) {
      puertaAbierta = false;
      alarmaActiva = false;
      estadoBuzzer = false;
      digitalWrite(PIN_BUZZER, LOW); // Apagar buzzer al cerrar puerta
      esperandoEstabilidad = false;
      float pesoFinal = scale.get_units(10);
      ultimoPesoConocido = pesoFinal;

      Serial.print("{\"event\":\"door_change\",\"timestamp\":");
      Serial.print(obtenerTimestamp());
      Serial.print(",\"status\":\"closed\",\"final_weight_g\":");
      Serial.print(pesoFinal, 0);
      Serial.println("}");
    }
  }

  // --- TAREA 2: GESTIÓN DE ALARMA DE PUERTA ABIERTA CON OSCILACIÓN PROGRESIVA ---
  if (puertaAbierta) {
    unsigned long tiempoTranscurrido = millis() - tiempoAperturaPuerta;
    
    // Determinar el intervalo de beep según el tiempo transcurrido
    long intervaloActual = 0;
    if (tiempoTranscurrido >= TIEMPO_ALARMA_RAPIDA) {
      // Alarma rápida (después de 30 segundos)
      intervaloActual = INTERVALO_BEEP_RAPIDO;
      if (!alarmaActiva) {
        alarmaActiva = true;
      }
    } else if (tiempoTranscurrido >= TIEMPO_ALARMA_SUAVE) {
      // Alarma suave (después de 20 segundos)
      intervaloActual = INTERVALO_BEEP_SUAVE;
      if (!alarmaActiva) {
        alarmaActiva = true;
      }
    }
    
    // Gestionar la oscilación del buzzer si la alarma está activa
    if (alarmaActiva && intervaloActual > 0) {
      unsigned long tiempoActual = millis();
      
      if (estadoBuzzer) {
        // Buzzer está encendido, verificar si debe apagarse
        if (tiempoActual - ultimoBeep >= DURACION_BEEP) {
          digitalWrite(PIN_BUZZER, LOW);
          estadoBuzzer = false;
          ultimoBeep = tiempoActual;
        }
      } else {
        // Buzzer está apagado, verificar si debe encenderse
        if (tiempoActual - ultimoBeep >= intervaloActual) {
          digitalWrite(PIN_BUZZER, HIGH);
          estadoBuzzer = true;
          ultimoBeep = tiempoActual;
        }
      }
    }
  }

  // --- TAREA 3: MONITOREO DE PESO ACTIVO ---
  float pesoActual = scale.get_units(1);

  if (!esperandoEstabilidad) {
    if (abs(pesoActual - ultimoPesoConocido) >= UMBRAL_CAMBIO_PESO) {
      esperandoEstabilidad = true;
      tiempoInicioEstabilidad = millis();
      pesoPotencial = pesoActual;
    }
  } else {
    if (abs(pesoActual - pesoPotencial) <= TOLERANCIA_ESTABILIDAD) {
      if (millis() - tiempoInicioEstabilidad >= INTERVALO_ESTABILIDAD) {
        float cambioConfirmado = pesoPotencial - ultimoPesoConocido;
        
        String msg = R"({"event":"weight_change","timestamp":)";
        msg += obtenerTimestamp();
        msg += R"(,"change_g":)";
        msg += String(cambioConfirmado, 0);
        msg += "}";
        Serial.println(msg);

        ultimoPesoConocido = pesoPotencial;
        esperandoEstabilidad = false;
      }
    } else {
      esperandoEstabilidad = false;
    }
  }
  
  // --- TAREA 4: LECTURA PERIÓDICA DE TEMPERATURA Y ESTADO ---
  if (millis() - ultimoTiempoLecturaTemp >= INTERVALO_LECTURA_TEMP) {
    ultimoTiempoLecturaTemp = millis();
    
    tempSensor.requestTemperatures();
    float nuevaTemp = tempSensor.getTempCByIndex(0);

    if(nuevaTemp != DEVICE_DISCONNECTED_C) {
      temperaturaActual = nuevaTemp;
      if (temperaturaActual > TEMP_MAX_OK || temperaturaActual < TEMP_MIN_OK) {
        statusActual = 2; // Fuera de rango
      } else {
        statusActual = 1; // OK
      }
    } else {
      temperaturaActual = -127.0;
      statusActual = 3; // Falla de sensor
    }
    
    Serial.print("{\"event\":\"status_report\",\"timestamp\":");
    Serial.print(obtenerTimestamp());
    Serial.print(",\"door_open\":");
    Serial.print(puertaAbierta ? "true" : "false");
    Serial.print(",\"temperature_c\":");
    Serial.print(temperaturaActual, 2);
    Serial.print(",\"weight_kg\":");
    Serial.print(scale.get_units(5) / 1000.0, 3);
    Serial.print(",\"status_code\":");
    Serial.print(statusActual);
    Serial.println("}");
  }
}
