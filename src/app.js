import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import pinoHttp from 'pino-http';
import config from './config/index.js';
import logger from './utils/logger.js';
import { createSandbox } from './controllers/sandboxController.js';
import errorHandler from './middleware/errorHandler.js';
import creationLimiter from './middleware/rateLimiter.js';
import { validate, CreateSandboxSchema } from './middleware/validation.js';

const app = express();

// Middleware Setup
app.use(pinoHttp({ logger })); // HTTP request logging
app.use(helmet()); // Security headers

// CORS Configuration (Addresses "CORS Headers" issue)
// Uses configuration derived from environment variables
app.use(cors({
  origin: config.allowedOrigins,
  methods: ['POST', 'GET', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// Body Parser with limit tied to configuration (+1MB buffer for JSON overhead)
const payloadLimit = config.sandbox.maxFileSizeBytes + (1024 * 1024);
app.use(express.json({ limit: payloadLimit }));

// Routes
// Health Check
app.get('/api/health', (req, res) => {
  res.status(200).json({ status: 'OK' });
});

// Sandbox Creation Endpoint
app.post(
    '/api/sandbox/create', 
    creationLimiter, // 1. Apply Rate Limiting
    validate(CreateSandboxSchema), // 2. Apply Input Validation
    createSandbox // 3. Handle Request
);

// Centralized Error Handler (Must be the last middleware)
app.use(errorHandler);

export default app;
