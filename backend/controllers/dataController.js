const SensorData = require('../models/SensorData');
const mongoose = require('mongoose');
const { Parser } = require('json2csv');
const moment = require('moment-timezone');

// @desc    Receive and store sensor data
// @route   POST /data
// @access  Public
exports.receiveData = async (req, res) => {
  try {
    // console.log('Received data:', req.body); // Log incoming data

    const { soilSensors, dhtSensors, lightSensor } = req.body;

    // Validate incoming data
    if (!soilSensors || !dhtSensors || !lightSensor) {
      return res.status(400).json({ error: 'Incomplete sensor data.' });
    }

    // Initialize a new SensorData instance
    const newSensorData = new SensorData({
      soilSensors,
      dhtSensors,
      lightSensor,
    });

    // Save to database
    await newSensorData.save();

    console.log('Sensor data saved successfully.');
    res.status(201).json({ message: 'Sensor data received and saved successfully.' });
  } catch (error) {
    console.error('Error receiving sensor data:', error.message);
    res.status(500).json({ error: 'Server error while receiving data.' });
  }
};

// @desc    Fetch sensor data with pagination and filters
// @route   GET /data
// @access  Public
exports.getData = async (req, res) => {
  try {
    const { page = 1, limit = 10, startDate, endDate } = req.query;

    // Build the query object
    let query = {};
    if (startDate || endDate) {
      query.timestamp = {};
      if (startDate) {
        query.timestamp.$gte = new Date(startDate);
      }
      if (endDate) {
        query.timestamp.$lte = new Date(endDate);
      }
    }

    // Count total documents matching the query
    const totalDocuments = await SensorData.countDocuments(query);

    // Calculate total pages
    const totalPages = Math.ceil(totalDocuments / limit);

    // Fetch the data with pagination and sorting
    const sensorData = await SensorData.find(query)
      .sort({ timestamp: -1 }) // Sort by latest first
      .skip((page - 1) * limit)
      .limit(parseInt(limit));

    res.status(200).json({
      items: sensorData,
      totalPages,
      currentPage: parseInt(page),
    });
  } catch (error) {
    console.error('Error fetching sensor data:', error.message);
    res.status(500).json({ error: 'Server error while fetching data.' });
  }
};

// @desc    Export sensor data as CSV
// @route   GET /data/export
// @access  Public
exports.exportData = async (req, res) => {
  try {
    const { startDate, endDate } = req.query;

    // Build the query object
    let query = {};
    if (startDate || endDate) {
      query.timestamp = {};
      if (startDate) {
        query.timestamp.$gte = new Date(startDate);
      }
      if (endDate) {
        query.timestamp.$lte = new Date(endDate);
      }
    }

    // Fetch all matching data
    const sensorData = await SensorData.find(query).sort({ timestamp: -1 });

    if (sensorData.length === 0) {
      return res.status(404).json({ error: 'No data available for the specified filters.' });
    }

    // Prepare data for CSV
    const fields = [
      'timestamp',
      ...sensorData[0].soilSensors.map((_, index) => `soilSensor${index + 1}`),
      ...sensorData[0].dhtSensors.map((_, index) => `dhtSensor${index + 1}_temp`),
      ...sensorData[0].dhtSensors.map((_, index) => `dhtSensor${index + 1}_hum`),
      'lightSensor',
    ];

    const opts = { fields };
    const parser = new Parser(opts);
    const csv = parser.parse(
      sensorData.map((entry) => ({
        timestamp: moment(entry.timestamp).tz('Asia/Kolkata').format('YYYY-MM-DD HH:mm:ss'),
        ...entry.soilSensors.reduce((acc, value, index) => {
          acc[`soilSensor${index + 1}`] = value;
          return acc;
        }, {}),
        ...entry.dhtSensors.reduce((acc, dht, index) => {
          acc[`dhtSensor${index + 1}_temp`] = dht.temp !== undefined ? dht.temp : 'Not working';
          acc[`dhtSensor${index + 1}_hum`] = dht.hum !== undefined ? dht.hum : 'Not working';
          return acc;
        }, {}),
        lightSensor: entry.lightSensor,
      }))
    );

    res.setHeader('Content-disposition', 'attachment; filename=sensor_data.csv');
    res.set('Content-Type', 'text/csv');
    res.status(200).send(csv);
  } catch (error) {
    console.error('Error exporting sensor data:', error.message);
    res.status(500).json({ error: 'Server error while exporting data.' });
  }
};
