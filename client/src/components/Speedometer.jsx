import React from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer } from 'recharts';

const Speedometer = ({ id, label, value, max = 100, unit = '', onHide }) => {
  const isWorking = value !== "Not working";
  const normalizedValue = isWorking ? Math.min(Math.max(parseFloat(value), 0), max) : 0;
  const percentage = (normalizedValue / max) * 100;

  const data = [
    { name: 'value', value: percentage },
    { name: 'empty', value: 100 - percentage }
  ];

  const getColor = () => {
    if (!isWorking) return '#9CA3AF'; // Gray color for not working sensors
    if (label.startsWith('Soil')) {
      return percentage < 30 ? '#38B2AC' : percentage < 70 ? '#F6AD55' : '#E53E3E';
    }
    if (label.startsWith('DHT')) {
      if (label.includes('Temp')) {
        return value < 20 ? '#38A169' : value < 30 ? '#F6AD55' : '#E53E3E';
      }
      if (label.includes('Humidity')) {
        return value < 30 ? '#E53E3E' : value < 60 ? '#F6AD55' : '#3182CE';
      }
    }
    if (label === 'Light Sensor') {
      return percentage < 30 ? '#63B3ED' : percentage < 70 ? '#F6AD55' : '#ED8936';
    }
    return '#4299E1'; // Default Blue-500
  };

  return (
    <div className="speedometer bg-white p-4 rounded-lg shadow-md flex flex-col items-center w-full max-w-xs relative">
      <h3 className="text-lg font-medium mb-2 text-center">{label}</h3>
      <div className="w-full h-32 relative">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={data}
              cx="50%"
              cy="100%"
              startAngle={180}
              endAngle={0}
              innerRadius={60}
              outerRadius={80}
              paddingAngle={0}
              dataKey="value"
            >
              <Cell key="value" fill={getColor()} />
              <Cell key="empty" fill="#E5E7EB" />
            </Pie>
          </PieChart>
        </ResponsiveContainer>
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="text-2xl font-bold">
            {isWorking ? `${value.toFixed(1)}${unit}` : "Not working"}
          </span>
        </div>
      </div>
      <div className="mt-2 text-sm text-gray-600">
        {isWorking
          ? (label.startsWith('DHT') ? `Range: 0 - ${max}${unit}` : `${value.toFixed(1)} / ${max} ${unit}`)
          : "Sensor not connected"
        }
      </div>
      
      {/* Add a hide button */}
      <button
        onClick={() => onHide(id)}
        className="absolute top-2 right-2 w-8 h-8 flex items-center justify-center bg-gray-200 hover:bg-gray-300 rounded-full focus:outline-none transition-colors duration-200"
        aria-label="Hide sensor"
      >
        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
          <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
        </svg>
      </button>
    </div>
  );
};

export default Speedometer;
