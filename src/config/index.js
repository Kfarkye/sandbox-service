import dotenv from 'dotenv';
dotenv.config();

const config = {
  port: process.env.PORT || 3001,
  env: process.env.NODE_ENV || 'development',
  vercel: {
    token: process.env.SANDBOX_VERCEL_TOKEN,
    teamId: process.env.SANDBOX_VERCEL_TEAM_ID,
    projectId: process.env.SANDBOX_VERCEL_PROJECT_ID,
  },
  sandbox: {
    // Vercel Sandbox API Configuration
    timeout: 300000, // 5 minutes for sandbox API operations
    ports: [5173, 3000], // Vercel allows max 2 ports (e.g., Vite, CRA)
    runtime: 'node22',
    resources: { vcpus: 4 },
    // Application Specific Limits
    serverReadyTimeout: 60000, // 60 seconds polling timeout for the dev server
    maxFileSizeBytes: 10 * 1024 * 1024, // 10MB total limit for project files
    maxFileCount: 100,
  },
  rateLimit: {
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 30, // Limit each IP to 30 creation requests per window
  },
  // Define allowed origins for CORS (e.g., export ALLOWED_ORIGINS=https://app.yoursite.com)
  // If not set, default to '*' (Wide open)
  allowedOrigins: process.env.ALLOWED_ORIGINS ? process.env.ALLOWED_ORIGINS.split(',') : '*'
};

// Fail fast validation
if (!config.vercel.token || !config.vercel.teamId || !config.vercel.projectId) {
  console.error('FATAL ERROR: Missing required Vercel environment variables (TOKEN, TEAM_ID, PROJECT_ID).');
  process.exit(1);
}

export default config;
