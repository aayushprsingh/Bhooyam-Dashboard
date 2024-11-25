const express = require('express');
const router = express.Router();
const dataController = require('../controllers/dataController');

// Route to handle incoming sensor data (POST)
router.post('/', dataController.receiveData);

// Route to fetch sensor data with pagination and filters (GET)
router.get('/', dataController.getData);

// Route to export sensor data as CSV (GET)
router.get('/export', dataController.exportData);

module.exports = router;
