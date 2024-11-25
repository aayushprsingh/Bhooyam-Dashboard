import React from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

const SensorLineChart = ({ data }) => {
  // Transform data to be compatible with Recharts
  const formattedData = data.map((entry) => ({
    time: new Date(entry.timestamp).toLocaleString(),
    ...entry.soilSensors.reduce((acc, value, index) => {
      acc[`Soil${index + 1}`] = value !== 'Not working' ? parseInt(value, 10) : null;
      return acc;
    }, {}),
    ...entry.dhtSensors.reduce((acc, dht, index) => {
      acc[`DHT${index + 1} Temp`] = dht.status === 'OK' ? dht.temp : null;
      acc[`DHT${index + 1} Hum`] = dht.status === 'OK' ? dht.hum : null;
      return acc;
    }, {}),
    Light: entry.lightSensor !== 'Not working' ? parseInt(entry.lightSensor, 10) : null,
  }));

  // Determine the keys for lines dynamically
  const lineKeys = Object.keys(formattedData[0] || {}).filter((key) => key !== 'time');

  // Color mapping for different sensor types
  const getColor = (key) => {
    if (key.startsWith('Soil')) {
      return '#4299E1'; // Blue-500
    }
    if (key.startsWith('DHT') && key.endsWith('Temp')) {
      return '#38B2AC'; // Teal-400
    }
    if (key.startsWith('DHT') && key.endsWith('Hum')) {
      return '#F6AD55'; // Orange-400
    }
    if (key === 'Light') {
      return '#ED8936'; // Orange-500
    }
    return '#8884d8'; // Default
  };

  return (
    <div className="line-chart bg-white p-6 rounded-lg shadow-md">
      <h3 className="text-xl font-semibold mb-4 text-center">Sensor Data Overview</h3>
      {formattedData.length > 0 ? (
        <ResponsiveContainer width="100%" height={400}>
          <LineChart
            data={formattedData}
            margin={{
              top: 20, right: 30, left: 20, bottom: 10,
            }}
          >
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="time" tick={{ fontSize: 12 }} />
            <YAxis />
            <Tooltip />
            <Legend />
            {lineKeys.map((key, index) => (
              <Line
                key={index}
                type="monotone"
                dataKey={key}
                stroke={getColor(key)}
                strokeWidth={2}
                dot={{ r: 3 }}
                activeDot={{ r: 6 }}
              />
            ))}
          </LineChart>
        </ResponsiveContainer>
      ) : (
        <p className="text-center text-gray-500">No data available for the selected range.</p>
      )}
    </div>
  );
};

export default SensorLineChart;
