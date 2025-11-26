import logger from '../utils/logger.js';
import config from '../config/index.js';

const errorHandler = (err, req, res, next) => {
  // Logging is primarily handled by pino-http or the service layer, this is a fallback for unexpected errors.
  if (res.statusCode < 500) {
    logger.warn(`Client Error: ${err.message}`);
  } else {
    logger.error(`Server Error: ${err.message}`, { stack: err.stack });
  }

  let statusCode = 500;
  let message = err.message;

  // Map internal service errors to appropriate HTTP codes based on prefixes
  if (err.message.startsWith('Build_Failed')) {
    statusCode = 422; // Unprocessable Entity (Build succeeded but failed to run/install)
  } else if (err.message.startsWith('Server_Timeout')) {
    statusCode = 504; // Gateway Timeout
  } else if (err.message.startsWith('Vercel_API_Error')) {
    statusCode = 502; // Bad Gateway (Upstream Vercel API failure)
  } else if (err.message.startsWith('Invalid_Input') || err.message.startsWith('Security_Violation')) {
    statusCode = 400; // Bad Request
  }

  // Prevent leaking sensitive error details in production for generic 500 errors
  if (config.env === 'production' && statusCode === 500) {
    message = 'An unexpected server error occurred';
  }

  res.status(statusCode).json({
    success: false,
    error: message,
  });
};

export default errorHandler;
