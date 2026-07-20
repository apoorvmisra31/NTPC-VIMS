const http = require('http');
const socketIO = require('socket.io');
const app = require('./app');
const connectDB = require('./config/db');
const config = require('./config/env');
const setupSocketHandlers = require('./sockets/socketHandler');

// Connect to MongoDB
connectDB();

// Create HTTP server
const server = http.createServer(app);

// Socket.IO setup
const io = socketIO(server, {
  cors: {
    origin: config.allowedOrigins,
    credentials: true,
  },
  pingTimeout: 60000,
  pingInterval: 25000,
  transports: ['websocket', 'polling'],
});

// Setup Socket.IO event handlers (plant monitoring, notifications, messaging)
setupSocketHandlers(io);

// Make io accessible to routes
app.set('io', io);

const PORT = config.port;

server.listen(PORT, () => {
  console.log(`
  ╔═══════════════════════════════════════════════════════════╗
  ║                                                           ║
  ║   🏭 NTPC VIMS+ Backend Server Running                    ║
  ║                                                           ║
  ║   Environment: ${config.env.padEnd(38)}    ║
  ║   Port:        ${String(PORT).padEnd(38)}    ║
  ║   MongoDB:     Connected                                  ║
  ║                                                           ║
  ║   API:         http://localhost:${PORT}/api               ║
  ║   Swagger:     http://localhost:${PORT}/api-docs          ║
  ║   Health:      http://localhost:${PORT}/health            ║
  ║                                                           ║
  ╚═══════════════════════════════════════════════════════════╝
  `);
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (err) => {
  console.error(`Error: ${err.message}`);
  server.close(() => process.exit(1));
});
