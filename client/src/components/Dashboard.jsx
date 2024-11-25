import React, { useEffect, useState } from "react";
import { fetchSensorData } from "../services/api";
import Speedometer from "./Speedometer";
import SensorLineChart from "./SensorLineChart";
import Pagination from "./Pagination";
import Filter from "./Filter";
import DownloadCSV from "./DownloadCSV";

const Dashboard = () => {
  const [sensorData, setSensorData] = useState([]);
  const [averageData, setAverageData] = useState({
    soilSensors: {},
    dhtSensors: {},
    lightSensor: 0,
  });
  const [currentPage, setCurrentPage] = useState(1);
  const [dataPerPage] = useState(10);
  const [filters, setFilters] = useState({ startDate: null, endDate: null });
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [hiddenSensors, setHiddenSensors] = useState([]);

  useEffect(() => {
    loadSensorData();
  }, [currentPage, filters]);

  const loadSensorData = async () => {
    setLoading(true);
    setError(null);
    try {
      const startDate = filters.startDate
        ? filters.startDate.toISOString()
        : undefined;
      const endDate = filters.endDate
        ? filters.endDate.toISOString()
        : undefined;

      const data = await fetchSensorData(
        currentPage,
        dataPerPage,
        startDate,
        endDate
      );
      setSensorData(data.items);
      setTotalPages(data.totalPages);

      // Calculate averages
      const averages = calculateAverages(data.items);
      setAverageData(averages);
    } catch (error) {
      console.error("Error fetching sensor data:", error);
      setError("Failed to load sensor data.");
    } finally {
      setLoading(false);
    }
  };

  const calculateAverages = (data) => {
    const totalSoil = {};
    const totalDHTTemp = {};
    const totalDHTHum = {};
    const countSoil = {};
    const countDHT = {};
    let totalLight = 0;
    let countLight = 0;

    data.forEach((entry) => {
      // Soil Sensors
      entry.soilSensors.forEach((value, index) => {
        if (value !== "Not working") {
          if (!totalSoil[index]) totalSoil[index] = 0;
          if (!countSoil[index]) countSoil[index] = 0;
          totalSoil[index] += parseInt(value, 10);
          countSoil[index] += 1;
        }
      });

      // DHT Sensors
      entry.dhtSensors.forEach((dht, index) => {
        if (dht.status === "OK") {
          if (!totalDHTTemp[index]) totalDHTTemp[index] = 0;
          if (!totalDHTHum[index]) totalDHTHum[index] = 0;
          if (!countDHT[index]) countDHT[index] = 0;
          totalDHTTemp[index] += dht.temp;
          totalDHTHum[index] += dht.hum;
          countDHT[index] += 1;
        }
      });

      // Light Sensor
      if (entry.lightSensor !== "Not working") {
        totalLight += parseInt(entry.lightSensor, 10);
        countLight += 1;
      }
    });

    const averages = {
      soilSensors: {},
      dhtSensors: {},
      lightSensor: countLight > 0 ? (totalLight / countLight).toFixed(2) : 0,
    };

    // Calculate Soil Averages
    for (let index in totalSoil) {
      const avgValue = totalSoil[index] / countSoil[index];
      averages.soilSensors[index] = ((avgValue / 4095) * 100).toFixed(2);
    }

    // Calculate DHT Averages
    for (let index in totalDHTTemp) {
      averages.dhtSensors[index] = {
        temp: (totalDHTTemp[index] / countDHT[index]).toFixed(2),
        hum: (totalDHTHum[index] / countDHT[index]).toFixed(2),
      };
    }

    // Calculate Light Sensor Average and convert to percentage
    if (countLight > 0) {
      const avgLight = totalLight / countLight;
      // Convert to percentage (assuming 0-4095 range for ESP32 ADC)
      averages.lightSensor = ((avgLight / 4095) * 100).toFixed(2);
    }

    return averages;
  };

  const handlePageChange = (pageNumber) => {
    setCurrentPage(pageNumber);
  };

  const handleFilter = (start, end) => {
    setFilters({ startDate: start, endDate: end });
    setCurrentPage(1);
  };

  // Define maximum values for each sensor type
  const maxValues = {
    soil: 100, // Adjust based on your soil moisture sensor's range
    temperature: 100, // Adjust based on expected maximum temperature
    humidity: 100, // Humidity is always 0-100%
    light: 100, // Adjust based on your light sensor's range
  };

  const handleHideSensor = (sensorId) => {
    setHiddenSensors((prev) => [...prev, sensorId]);
  };

  const handleUnhideSensor = (sensorId) => {
    setHiddenSensors((prev) => prev.filter((id) => id !== sensorId));
  };

  const handleUnhideAll = () => {
    setHiddenSensors([]);
  };

  return (
    <div className="dashboard container mx-auto p-4">
      <h1 className="text-4xl font-bold mb-8 text-center">Sensor Dashboard</h1>

      <div className="flex flex-col md:flex-row justify-between items-center mb-8 space-y-4 md:space-y-0">
        <Filter onFilter={handleFilter} />
        <DownloadCSV filters={filters} />
      </div>

      {loading ? (
        <p className="text-center text-blue-500">Loading data...</p>
      ) : error ? (
        <p className="text-center text-red-500">{error}</p>
      ) : (
        <>
          <div className="speedometers mb-12">
            <h2 className="text-2xl font-semibold mb-6 text-center">
              Average 1-Day Data
            </h2>

            {/* Add unhide buttons */}
            {hiddenSensors.length > 0 && (
              <div className="mb-8">
                <h3 className="text-xl font-semibold mb-4">Hidden Sensors</h3>
                <div className="flex flex-wrap gap-2">
                  {hiddenSensors.map((sensorId) => (
                    <button
                      key={sensorId}
                      onClick={() => handleUnhideSensor(sensorId)}
                      className="px-3 py-1 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors duration-200 text-sm"
                    >
                      Unhide {sensorId.replace("-", " ")}
                    </button>
                  ))}
                  <button
                    onClick={handleUnhideAll}
                    className="px-3 py-1 bg-green-500 text-white rounded hover:bg-green-600 transition-colors duration-200 text-sm"
                  >
                    Unhide All
                  </button>
                </div>
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {Object.entries(averageData.soilSensors).map(([key, value]) => (
                !hiddenSensors.includes(`soil-${parseInt(key) + 1}`) && (
                  <Speedometer
                    key={`soil-${parseInt(key) + 1}`}
                    id={`soil-${parseInt(key) + 1}`}
                    label={`Soil Sensor ${parseInt(key) + 1}`}
                    value={value === "Not working" ? "Not working" : parseFloat(value)}
                    max={maxValues.soil}
                    unit="%"
                    onHide={handleHideSensor}
                  />
                )
              ))}
              {Object.entries(averageData.dhtSensors).map(([key, value]) => (
                <React.Fragment key={`dht-${parseInt(key) + 1}`}>
                  {!hiddenSensors.includes(`dht-temp-${parseInt(key) + 1}`) && (
                    <Speedometer
                      key={`dht-temp-${parseInt(key) + 1}`}
                      id={`dht-temp-${parseInt(key) + 1}`}
                      label={`DHT${parseInt(key) + 1} Temp`}
                      value={value.temp === "Not working" ? "Not working" : parseFloat(value.temp)}
                      max={maxValues.temperature}
                      unit="°C"
                      onHide={handleHideSensor}
                    />
                  )}
                  {!hiddenSensors.includes(`dht-hum-${parseInt(key) + 1}`) && (
                    <Speedometer
                      key={`dht-hum-${parseInt(key) + 1}`}
                      id={`dht-hum-${parseInt(key) + 1}`}
                      label={`DHT${parseInt(key) + 1} Humidity`}
                      value={value.hum === "Not working" ? "Not working" : parseFloat(value.hum)}
                      max={maxValues.humidity}
                      unit="%"
                      onHide={handleHideSensor}
                    />
                  )}
                </React.Fragment>
              ))}
              {!hiddenSensors.includes("light-sensor") && (
                <Speedometer
                  key="light-sensor"
                  id="light-sensor"
                  label="Light Sensor"
                  value={averageData.lightSensor === "Not working" ? "Not working" : parseFloat(averageData.lightSensor)}
                  max={maxValues.light}
                  unit="%"
                  onHide={handleHideSensor}
                />
              )}
            </div>
          </div>

          <div className="charts mb-12">
            <h2 className="text-2xl font-semibold mb-6 text-center">
              Sensor Data Charts
            </h2>
            <SensorLineChart data={sensorData} />
          </div>

          <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            onPageChange={handlePageChange}
          />
        </>
      )}
    </div>
  );
};

export default Dashboard;
