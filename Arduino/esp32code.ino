#include <Arduino.h>

// Librerias para la conexion a WiFi
#include <WiFi.h>

// Librerías para el sensor DHT de temperatura y humedad
#include <Adafruit_Sensor.h>
#include <DHT.h>

// Librerías de Firebase
#include <FirebaseESP32.h>
#include <addons/TokenHelper.h>
#include <addons/RTDBHelper.h>

// Libreías para realizar solicitudes HTTP y parsear JSON
#include <ArduinoJson.h>
#include <HTTPClient.h>

// Define las credenciales WiFi
#define WIFI_SSID "TP-Link_4F18"
#define WIFI_PASSWORD "90729690"

// Define la clave API de Firebase
#define API_KEY "AIzaSyAt5_BrZyNPK2hoLvBXMDjeyAY9pOmNqsY"

// Define la URL de la base de datos en tiempo real de Firebase
#define DATABASE_URL "https://gardensense-cfe37-default-rtdb.firebaseio.com"

// Define el email y la contraseña del usuario registrado en el proyecto
#define USER_EMAIL "svsm03@hotmail.com"
#define USER_PASSWORD "Tec_4_ever"

// Define el PIN para el sensor PIR de movimiento
#define PIR_PIN 5

// Define el PIN donde está conectado el sensor DHT de temperatura
#define DHT_PIN 18
#define DHT_TYPE DHT11

DHT dht(DHT_PIN, DHT_TYPE);

// Define objetos Firebase Data, Firebase Auth y Firebase Config
FirebaseData fbdo;
FirebaseAuth auth;
FirebaseConfig config;

unsigned long sendDataPrevMillis = 0;
unsigned long count = 0;

// Define los PIN para los actuadores
#define ledPin 2
#define buzzerPin 4
#define ledPin2 23

bool regar = false;

// Define la estructura para almacenar los detalles de la planta seleccionada
struct PlantaSeleccionada {
  String nombre;
  int minhum;
  int maxhum;
};

PlantaSeleccionada plantaSeleccionada;

void setup() {
  Serial.begin(115200);

  // Conéctate a Wi-Fi usando las credenciales proporcionadas
  WiFi.begin(WIFI_SSID, WIFI_PASSWORD);
  Serial.print("Conectando a Wi-Fi");
  while (WiFi.status() != WL_CONNECTED) {
    Serial.print(".");
    delay(300);
  }
  Serial.println();
  Serial.print("Conectado con IP: ");
  Serial.println(WiFi.localIP());
  Serial.println();

  // Imprime la versión del cliente Firebase
  Serial.printf("Firebase Client v%s\n\n", FIREBASE_CLIENT_VERSION);

  // Configura las credenciales y la URL de Firebase
  config.api_key = API_KEY;
  auth.user.email = USER_EMAIL;
  auth.user.password = USER_PASSWORD;
  config.database_url = DATABASE_URL;
  config.token_status_callback = tokenStatusCallback;

  // Permite la reconexión automática a Wi-Fi
  Firebase.reconnectNetwork(true);

  // Configura el tamaño del búfer SSL
  fbdo.setBSSLBufferSize(4096, 1024);

  // Inicializa Firebase con la configuración y autenticación
  Firebase.begin(&config, &auth);
  Firebase.setDoubleDigits(5);


  // Configura el PIN del sensor PIR de movimiento y el sensor DHT de temperatura y humedad
  pinMode(PIR_PIN, INPUT);
  dht.begin();


  // Configura los PIN de los actuadores
  pinMode(ledPin, OUTPUT);
  pinMode(buzzerPin, OUTPUT);
  pinMode(ledPin2, OUTPUT);
}

void obtenerDetallesPlanta() {
  // Realiza una solicitud a la API para obtener detalles de la planta seleccionada
  Serial.println("Obteniendo detalles de la planta seleccionada...");

  HTTPClient http;
  http.addHeader("Cache-Control", "no-cache, no-store, must-revalidate");
  http.begin("https://garden-sense-app-production.up.railway.app/plantas/seleccionada/enviar");

  int httpCode = http.GET();

  if (httpCode == HTTP_CODE_OK) {
    // Parsea la respuesta JSON
    DynamicJsonDocument doc(1024);
    deserializeJson(doc, http.getString());

    // Limpia la estructura antes de actualizar
    plantaSeleccionada = PlantaSeleccionada();

    // Obtiene los detalles de la planta seleccionada
    plantaSeleccionada.nombre = doc["nombre"].as<String>();
    plantaSeleccionada.minhum = doc["minhum"];
    plantaSeleccionada.maxhum = doc["maxhum"];
  } else {
    Serial.print("Error al obtener detalles de la planta. Código de respuesta: ");
    Serial.println(httpCode);
  }

  http.end();
}

bool obtenerRiego() {
  // Realiza una solicitud a la API para obtener el estado del riego
  HTTPClient http;
  http.addHeader("Cache-Control", "no-cache, no-store, must-revalidate");
  http.begin("https://garden-sense-app-production.up.railway.app/riego");

  int httpCode = http.GET();

  if (httpCode == HTTP_CODE_OK) {
    String payload = http.getString();
    DynamicJsonDocument doc(1024);
    deserializeJson(doc, payload);

    if (doc.containsKey("riego")) {
      int estadoRiego = doc["riego"];

      // Lógica según el estado de riego obtenido
      if (estadoRiego == 1) {
        // El riego está habilitado
        return true;
      } else if (estadoRiego == 0) {
        // El riego está deshabilitado
        return false;
      } else {
        // Manejar otros casos si es necesario
        Serial.println("Respuesta inesperada del servidor: " + payload);
        return false;
      }
    } else {
      Serial.println("Respuesta inesperada del servidor: " + payload);
      return false;
    }
  } else {
    Serial.println("Error al realizar la solicitud. Código de respuesta: " + String(httpCode));
    return false;
  }

  http.end();
}

void regarPlanta() {
  // Realiza acciones después de regar la planta
  Serial.println("Regando planta");

  // Enciende el segundo LED durante el riego
  digitalWrite(ledPin2, HIGH);

  // Espera durante 1 segundo
  delay(1000);

  // Apaga el segundo LED después del riego
  digitalWrite(ledPin2, LOW);

  // Después de regar, actualiza el estado del riego en el servidor
  HTTPClient http;
  http.begin("https://garden-sense-app-production.up.railway.app/riego/set");

  // Prepara el cuerpo de la solicitud
  String requestBody = "{\"riego\": 0}";

  // Establece el tipo de contenido de la solicitud
  http.addHeader("Content-Type", "application/json");

  // Realiza la solicitud POST con el cuerpo de la solicitud
  int httpCode = http.POST(requestBody);

  if (httpCode == HTTP_CODE_OK) {
    Serial.println("Estado del riego actualizado correctamente después de regar la planta");
  } else {
    Serial.print("Error al actualizar el estado del riego. Código de respuesta: ");
    Serial.println(httpCode);
  }

  http.end();
}

void loop() {
  // Obtener detalles de la planta seleccionada y el estado de riego
  obtenerDetallesPlanta();
  regar = obtenerRiego();

  // Si el estado de riego es true, regar la planta
  if (regar) {
    regarPlanta();
  }

  // Leer datos del sensor DHT de temperatura y humedad
  float temperature = dht.readTemperature();
  float humidity = dht.readHumidity();

  // Leer el valor del sensor PIR movimiento
  int val = digitalRead(PIR_PIN);
  Serial.println("Valor sensor PIR " + String(val));

  // Comparar y controlar el LED según los valores de humedad de la planta seleccionada
  if (humidity < plantaSeleccionada.minhum || humidity > plantaSeleccionada.maxhum) {
    digitalWrite(ledPin, HIGH); // Enciende el LED
    Serial.println("Led encendido");
  } else {
    digitalWrite(ledPin, LOW); // Apaga el LED
  }

  // Hacer sonar el buzzer cuando se detecta movimiento
  if (val == 1) {
    tone(buzzerPin, 1000); // Frecuencia de 1000 Hz
    delay(500);            // Duración del sonido
    noTone(buzzerPin);     // Detener el sonido
  }

  // Enviar datos a Firebase si la conexión está lista y ha pasado el tiempo especificado
  if (Firebase.ready() && (millis() - sendDataPrevMillis > 3000 || sendDataPrevMillis == 0)) {
    sendDataPrevMillis = millis();

    // Enviar el valor del sensor PIR a Firebase
    if (Firebase.setInt(fbdo, "/sensores/movimiento", val)) {
      Serial.printf("Valor del sensor PIR enviado a Firebase: %d\n", val);
    } else {
      Serial.println("Error al enviar el valor del sensor PIR a Firebase");
      Serial.println(fbdo.errorReason().c_str());
    }

    // Enviar datos de temperatura a Firebase si la lectura es válida
    if (!isnan(temperature)) {
      if (Firebase.setFloat(fbdo, "/sensores/temperatura", temperature)) {
        Serial.printf("Temperatura enviada a Firebase: %.2f °C\n", temperature);
      } else {
        Serial.println("Error al enviar la temperatura a Firebase");
        Serial.println(fbdo.errorReason().c_str());
      }
    } else {
      Serial.println("Error al leer la temperatura del sensor DHT");
    }

    // Enviar datos de humedad a Firebase si la lectura es válida
    if (!isnan(humidity)) {
      if (Firebase.setFloat(fbdo, "/sensores/humedad", humidity)) {
        Serial.printf("Humedad enviada a Firebase: %.2f \n", humidity);
      } else {
        Serial.println("Error al enviar la humedad a Firebase");
        Serial.println(fbdo.errorReason().c_str());
      }
    } else {
      Serial.println("Error al leer la humedad del sensor DHT");
    }

    Serial.println();

    count++;
  }
}


