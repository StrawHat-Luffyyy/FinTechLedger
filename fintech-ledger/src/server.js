import express from 'express';
import dotenv from 'dotenv';
import yaml from 'yamljs';
import swaggerUi from 'swagger-ui-express';
import logger from './utils/logger.js';
import { connectDB } from './config/db.js';
import apiRoutes from './routes/api.js';
import authRoutes from './routes/authRoutes.js'; // Import Auth Routes
import { protect } from './middlewares/authMiddleware.js';
import { connectRedis } from './config/redis.js'; // Import Redis configuration

dotenv.config();

// Load Swagger Document
const swaggerDocument = yaml.load('./swagger.yaml');

const app = express();
const PORT = process.env.PORT || 3001;

app.use(express.json());

// Mount Swagger UI
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocument));

// Mount Routes
app.use('/auth', authRoutes);

// Protected Routes (Apply middleware)
app.use('/api', protect, apiRoutes);

// Global Error Handler
app.use((err, req, res, next) => {
  logger.error('Server Error:', err.stack);

  res.status(500).json({
    error: 'Internal Server Error',
    message: process.env.NODE_ENV === 'development' ? err.message : undefined,
  });
});

// Start the Server
const startServer = async () => {
  await connectDB();
  // Don't block server startup if Redis fails to connect
  connectRedis().catch((err) => {
    logger.warn(
      'Redis connection failed, continuing without Redis:',
      err.message
    );
  });
  app.listen(PORT, () => {
    logger.info(`Server running on http://localhost:${PORT}`);
    logger.info(`Docs available at http://localhost:${PORT}/api-docs`);
  });
};
startServer();
