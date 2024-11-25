const express = require('express');
const bodyParser = require('body-parser');
const dataRoutes = require('./routes/dataRoutes');
const connectDB = require('./config/db');
const dotenv = require('dotenv');
const cors = require('cors');
const { Server } = require('socket.io');
const http = require('http');

dotenv.config();

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: 'http://localhost:5173',
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
  },
});

app.use(cors({
  origin: 'http://localhost:5173',
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
}));

// Connect to the database
connectDB();

// Middleware to parse JSON bodies
app.use(bodyParser.json());

// Use the data routes for '/data' endpoint
app.use('/data', dataRoutes);

// Socket.io connection
io.on('connection', (socket) => {
  console.log('a user connected');

  socket.on('disconnect', () => {
    console.log('user disconnected');
  });
});

// Emit data whenever new sensor data is saved
const SensorData = require('./models/SensorData');

const sensorDataSaveMiddleware = SensorData.watch().on('change', (change) => {
  if (change.operationType === 'insert') {
    const newData = change.fullDocument;
    io.emit('newSensorData', newData);
  }
});

// Define the port
const PORT = process.env.PORT || 5000;

// Start the server
server.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
