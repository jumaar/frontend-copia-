#include <Arduino.h>
#include "HX711.h"

// --- CONFIGURACIÓN DE PINES ---
// Asegúrate de que estos pines coincidan con tu hardware.
// Usaremos los pines 16 y 17 como en main_sensor_peso.cpp
const int HX711_DT = 16;
const int HX711_SCK = 17;

// --- OBJETO DE HARDWARE ---
HX711 scale;

// --- PESO CONOCIDO PARA CALIBRAR ---
// Usa un objeto cuyo peso conozcas con exactitud (ej. 1000g).
float peso_conocido_g = 1000.0;

void setup() {
  Serial.begin(115200);
  Serial.println("--- Programa de Calibración del HX711 ---");
  Serial.println("Iniciando la báscula...");

  scale.begin(HX711_DT, HX711_SCK);

  Serial.println("Báscula iniciada.");
  Serial.println("Por favor, asegúrate de que no haya nada sobre la báscula.");
  Serial.println("==> PRESIONA 'ENTER' EN EL MONITOR SERIAL PARA HACER LA TARA...");

  while (Serial.available() == 0) {
    // Espera a que el usuario envíe algo por el serial
  }
  while(Serial.available() > 0) { Serial.read(); } // Limpia completamente el buffer de entrada

  Serial.println("Realizando tara...");
  scale.tare(); // Pone la báscula a cero
  Serial.println("Tara completada.");

  Serial.println();
  Serial.print("Ahora, coloca el peso conocido de ");
  Serial.print(peso_conocido_g);
  Serial.println("g sobre la báscula.");
  Serial.println("Tienes 10 segundos para colocarlo...");

  delay(10000); // Pausa de 10 segundos para colocar el peso.

  Serial.println("\n==> TIEMPO TERMINADO. SI EL PESO ESTÁ LISTO, PRESIONA 'ENTER' PARA CONTINUAR...");

  while (Serial.available() == 0) {
    // Espera de nuevo
  }
  // No es necesario limpiar el buffer aquí, ya que el programa terminará.

  Serial.println("Calculando el factor de calibración...");

  // Obtener la lectura promedio del sensor (lectura cruda)
  long lectura_cruda = scale.get_value(10);

  // Calcular el factor de calibración
  float nuevo_factor = lectura_cruda / peso_conocido_g;

  Serial.println("--- ¡CALIBRACIÓN LISTA! ---");
  Serial.print("Lectura cruda obtenida: ");
  Serial.println(lectura_cruda);
  Serial.print("Tu nuevo CALIBRATION_FACTOR es: ");
  Serial.println(nuevo_factor, 4); // Imprimir con 4 decimales para mayor precisión
}

void loop() {
  // No se necesita nada en el loop para este programa
}