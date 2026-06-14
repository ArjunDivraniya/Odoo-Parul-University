require('dotenv').config();
const http = require('http');
const app = require('./src/app');
const prisma = require('./src/lib/prisma');
const { initSocket } = require('./src/lib/socket');

const PORT = process.env.PORT || 4001;

const server = http.createServer(app);

// Initialize Socket.io with the http server
initSocket(server);

server.listen(PORT, () => {
  console.log(`🚀 Server ready at http://localhost:${PORT}`);
  console.log(`📋 Health check: http://localhost:${PORT}/health`);
});

// Initialize WhatsApp Web Client
require('./src/services/whatsapp.service').initialize();

// ─── Graceful Shutdown ──────────────────────────────────────
const shutdown = async (signal) => {
  console.log(`\n⏳ ${signal} received. Shutting down gracefully...`);
  
  server.close(async () => {
    await prisma.$disconnect();
    console.log('✅ Server closed. Database disconnected.');
    process.exit(0);
  });

  // Force close after 10s
  setTimeout(() => {
    console.error('❌ Forced shutdown after timeout');
    process.exit(1);
  }, 10000);
};

process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT', () => shutdown('SIGINT'));

// Handle unhandled rejections
process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
});

process.on('uncaughtException', (error) => {
  console.error('Uncaught Exception:', error);
  shutdown('UNCAUGHT_EXCEPTION');
});
