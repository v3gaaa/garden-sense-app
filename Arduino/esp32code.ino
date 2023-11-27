#include <Arduino.h>
//Bibliotecas para la conexion con firebase
#include <WiFi.h>
#include <FirebaseESP32.h>
// Bibliotecas para el sensor PIR movimiento
#include <Adafruit_Sensor.h>
//Biblioteca sensor temperatura
#include <DHT.h>

// Provide the token generation process info.
#include <addons/TokenHelper.h>

// Provide the RTDB payload printing info and other helper functions.
#include <addons/RTDBHelper.h>

// Bibliotecas para la comunicacion con la APi
#include <ArduinoJson.h>

#include <HTTPClient.h>

/* 1. Define the WiFi credentials */
#define WIFI_SSID "TP-Link_4F18"
#define WIFI_PASSWORD "90729690"

/* 2. Define the API Key */
#define API_KEY "AIzaSyAt5_BrZyNPK2hoLvBXMDjeyAY9pOmNqsY"

/* 3. Define the RTDB URL */
#define DATABASE_URL "https://gardensense-cfe37-default-rtdb.firebaseio.com"

/* 4. Define the user Email and password that alreadey registerd or added in your project */
#define USER_EMAIL "svsm03@hotmail.com"
#define USER_PASSWORD "Tec_4_ever"

// Define el PIN para el sensor PIR movimiento
#define PIR_PIN 5

// Variables para el sensor PIR movimiento
int pirState = LOW;
int val = 0;

// Definición del PIN donde está conectado el sensor DHT de temperatura
#define DHT_PIN 18  // Pin D18 donde se conecta el sensor DHT
#define DHT_TYPE DHT11  // Cambia esto a DHT22 o DHT21 si estás utilizando un modelo de sensor DHT diferente
DHT dht(DHT_PIN, DHT_TYPE);

// Define objetos Firebase Data, Firebase Auth y Firebase Config
FirebaseData fbdo;
FirebaseAuth auth;
FirebaseConfig config;

unsigned long sendDataPrevMillis = 0;

unsigned long count = 0;


// Definir PIN para el LED de estado de la humedad de la planta
#define ledPin 21


void setup() {
  // Inicializa la comunicación serial a 115200 baudios para la depuración
  Serial.begin(115200);

  // Conecta al Wi-Fi utilizando las credenciales proporcionadas
  WiFi.begin(WIFI_SSID, WIFI_PASSWORD);
  Serial.print("Connecting to Wi-Fi");
  while (WiFi.status() != WL_CONNECTED) {
    Serial.print(".");
    delay(300);
  }
  Serial.println();
  Serial.print("Connected with IP: ");
  Serial.println(WiFi.localIP());
  Serial.println();

  // Imprime la versión del cliente Firebase
  Serial.printf("Firebase Client v%s\n\n", FIREBASE_CLIENT_VERSION);

  // Asigna la clave API requerida
  config.api_key = API_KEY;

  // Asigna las credenciales de inicio de sesión del usuario
  auth.user.email = USER_EMAIL;
  auth.user.password = USER_PASSWORD;

  // Asigna la URL de la base de datos en tiempo real requerida
  config.database_url = DATABASE_URL;

  // Asigna la función de devolución de llamada para la tarea de generación de tokens de larga duración
  config.token_status_callback = tokenStatusCallback; // Ver addons/TokenHelper.h

  // Controla la reconexión de Wi-Fi, establecer en 'false' si será controlada por tu código o una biblioteca de terceros
  Firebase.reconnectNetwork(true);

  // Configura el tamaño del búfer SSL (necesario desde la versión 4.4.x con BearSSL)
  fbdo.setBSSLBufferSize(4096 /* Tamaño del búfer Rx en bytes de 512 a 16384 */, 1024 /* Tamaño del búfer Tx en bytes de 512 a 16384 */);

  // Inicializa Firebase con la configuración y autenticación
  Firebase.begin(&config, &auth);

  // Establece la cantidad de dígitos decimales para números de punto flotante en Firebase
  Firebase.setDoubleDigits(5);

  // Configura el PIN del sensor PIR de movimiento como entrada
  pinMode(PIR_PIN, INPUT);

  // Inicializa el sensor DHT temperatura 
  dht.begin();
}



void obtenerDetallesPlanta() {
  // Realizar solicitud a la API para obtener detalles de la planta seleccionada
  HTTPClient http;
  http.begin("https://garden-sense-app-production.up.railway.app/plantas/seleccionada/enviar");  // Reemplaza con la URL correcta
  int httpCode = http.GET();

  if (httpCode == HTTP_CODE_OK) {
    // Parsear la respuesta JSON
    DynamicJsonDocument doc(1024);  // Tamaño adecuado dependiendo de la respuesta
    deserializeJson(doc, http.getString());

    // Obtener los detalles de la planta seleccionada
    plantaSeleccionada.nombre = doc["nombre"].as<String>();
    plantaSeleccionada.minhum = doc["minhum"];
    plantaSeleccionada.maxhum = doc["maxhum"];
  }

  http.end();
}


void loop() {
  // Firebase.ready() debe llamarse repetidamente para manejar tareas de autenticación

  if (Firebase.ready() && (millis() - sendDataPrevMillis > 1000 || sendDataPrevMillis == 0)) {
    sendDataPrevMillis = millis();

    obtenerDetallesPlanta();

    // Lee los datos de temperatura del sensor DHT
    float temperature = dht.readTemperature();
    float humidity = dht.readHumidity();  // Cambia a readHumidity() si también deseas la humedad

    // Lee el valor del sensor PIR movimiento
    val = digitalRead(PIR_PIN);

    // Envía el valor del sensor PIR a Firebase
    if (Firebase.setInt(fbdo, "/sensores/movimiento", val)) {
      Serial.printf("Valor del sensor PIR enviado a Firebase: %d\n", val);
    } else {
      Serial.println("Error al enviar el valor del sensor PIR a Firebase");
      Serial.println(fbdo.errorReason().c_str());
    }

    // Envía los datos de temperatura a Firebase si la lectura es válida
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

    // Envía los datos de humedad a Firebase si la lectura es válida
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


    // Comparar y controlar el LED
    if (humidity < plantaSeleccionada.minhum || humidity > plantaSeleccionada.maxhum) {
      // Encender el LED
      digitalWrite(ledPin, HIGH);
    } else {
      // Apagar el LED
      digitalWrite(ledPin, LOW);
    }

    Serial.println();

    count++;
  }
}