#include <DHT.h>
#include <WiFi.h>
#include <HTTPClient.h>

// Wi-Fi credentials
const char* ssid = "Your SSID";
const char* password = "PASSWORD";

// Update backend server URL to include the port number
const char* serverUrl = "http://http/backend.com/data";

// DHT sensor settings
#define DHTPIN1 4    // DHT sensor 1 pin
#define DHTPIN2 5    // DHT sensor 2 pin
#define DHTTYPE DHT11
DHT dht1(DHTPIN1, DHTTYPE);
DHT dht2(DHTPIN2, DHTTYPE);

// Soil moisture sensors
const int soilSensorPins[10] = {36, 39, 34, 35, 32, 33, 25, 26, 27, 14};

// Light sensor
const int lightSensorPin = 12;

void setup() {
  Serial.begin(115200);
  
  // Initialize DHT sensors
  dht1.begin();
  dht2.begin();
  
  // Connect to Wi-Fi
  WiFi.begin(ssid, password);
  Serial.print("Connecting to Wi-Fi");
  while (WiFi.status() != WL_CONNECTED) {
    delay(500);
    Serial.print(".");
  }
  Serial.println(" connected");
}

void loop() {
  // Read soil moisture sensors
  String soilData = "";
  for (int i = 0; i < 10; i++) {
    int sensorValue = analogRead(soilSensorPins[i]);
    // Simple check to see if the sensor is connected
    if (sensorValue == 0 || sensorValue == 4095) { // ESP32 ADC range is 0-4095
      soilData += "Sensor" + String(i+1) + ": Not working, ";
    } else {
      soilData += "Sensor" + String(i+1) + ": " + String(sensorValue) + ", ";
    }
  }
  
  // Read DHT sensors
  String dhtData = "";
  // DHT1
  float temp1 = dht1.readTemperature();
  float hum1 = dht1.readHumidity();
  if (isnan(temp1) || isnan(hum1)) {
    dhtData += "{\"status\":\"Not working\"}";
  } else {
    dhtData += "{\"temp\":" + String(temp1) + ",\"hum\":" + String(hum1) + ",\"status\":\"OK\"}";
  }
  dhtData += ",";
  // DHT2
  float temp2 = dht2.readTemperature();
  float hum2 = dht2.readHumidity();
  if (isnan(temp2) || isnan(hum2)) {
    dhtData += "{\"status\":\"Not working\"}";
  } else {
    dhtData += "{\"temp\":" + String(temp2) + ",\"hum\":" + String(hum2) + ",\"status\":\"OK\"}";
  }
  
  // Read light sensor
  int lightValue = analogRead(lightSensorPin);
  String lightData;
  if (lightValue == 0 || lightValue == 4095) { // ESP32 ADC range is 0-4095
    lightData = "Light Sensor: Not working";
  } else {
    lightData = "Light Sensor: " + String(lightValue);
  }
  
  // Combine all data
  String sensorData = soilData + dhtData + lightData;
  
  // Print to Serial
  Serial.println(sensorData);
  
  // Send data to backend
  if(WiFi.status() == WL_CONNECTED){
    HTTPClient http;
    http.begin(serverUrl);
    http.addHeader("Content-Type", "application/json");
    
    // Create JSON payload
    String jsonPayload = "{";
    
    // Soil sensors
    jsonPayload += "\"soilSensors\":[";
    for (int i = 0; i < 10; i++) {
      int sensorValue = analogRead(soilSensorPins[i]);
      if (sensorValue == 0 || sensorValue == 4095) { // ESP32 ADC range is 0-4095
        jsonPayload += "\"Not working\"";
      } else {
        jsonPayload += String(sensorValue);
      }
      if (i < 9) jsonPayload += ",";
    }
    jsonPayload += "],";
    
    // DHT sensors
    jsonPayload += "\"dhtSensors\":[";
    // DHT1
    if (isnan(temp1) || isnan(hum1)) {
      jsonPayload += "{\"status\":\"Not working\"}";
    } else {
      jsonPayload += "{\"temp\":" + String(temp1) + ",\"hum\":" + String(hum1) + ",\"status\":\"OK\"}";
    }
    jsonPayload += ",";
    // DHT2
    if (isnan(temp2) || isnan(hum2)) {
      jsonPayload += "{\"status\":\"Not working\"}";
    } else {
      jsonPayload += "{\"temp\":" + String(temp2) + ",\"hum\":" + String(hum2) + ",\"status\":\"OK\"}";
    }
    jsonPayload += "],";
    
    // Light sensor
    if (lightValue == 0 || lightValue == 4095) { // ESP32 ADC range is 0-4095
      jsonPayload += "\"lightSensor\":\"Not working\"";
    } else {
      jsonPayload += "\"lightSensor\":" + String(lightValue);
    }
    
    jsonPayload += "}";
    
    // Debug: Print jsonPayload
    Serial.println("JSON Payload: " + jsonPayload);
    
    // Send POST request
    int httpResponseCode = http.POST(jsonPayload);
    
    if(httpResponseCode > 0){
      Serial.println("Data sent successfully. Response code: " + String(httpResponseCode));
    }
    else{
      Serial.println("Error sending data. HTTP response code: " + String(httpResponseCode));
      Serial.println("Error details: " + http.errorToString(httpResponseCode));
    }
    
    http.end();
  }
  else{
    Serial.println("Wi-Fi not connected");
  }
  
  delay(3000); // Wait for 3 seconds before next reading
}
