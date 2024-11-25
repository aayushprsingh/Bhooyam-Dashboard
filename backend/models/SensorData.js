const mongoose = require('mongoose');

const SensorDataSchema = new mongoose.Schema({
  soilSensors: [
    {
      type: String, // Can store numerical values as strings or "Not working"
      required: false,
    }
  ],
  dhtSensors: [
    {
      temp: {
        type: Number,
        required: false,
      },
      hum: {
        type: Number,
        required: false,
      },
      status: {
        type: String, // e.g., "OK" or "Not working"
        default: 'OK',
      },
    }
  ],
  lightSensor: {
    type: String, // Can store numerical value as string or "Not working"
    required: false,
  },
  timestamp: {
    type: Date,
    default: Date.now,
  },
});

module.exports = mongoose.model('SensorData', SensorDataSchema);
