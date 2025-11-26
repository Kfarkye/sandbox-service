import rateLimit from 'express-rate-limit';
import config from '../config/index.js';

const creationLimiter = rateLimit({
  windowMs: config.rateLimit.windowMs,
  max: config.rateLimit.max,
  standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
  legacyHeaders: false, // Disable the `X-RateLimit-*` headers
  message: { success: false, error: 'Too many requests, please try again later.' },
});

export default creationLimiter;
