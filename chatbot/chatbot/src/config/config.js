// -----------------------------
// Application Configuration
// -----------------------------

const PORT = process.env.PORT || 4000;
const NODE_ENV = process.env.NODE_ENV || 'development';

// LM Studio configuration
const LM_BASE_URL = process.env.LM_BASE_URL || 'https://5klclrqb-8080.asse.devtunnels.ms/v1';
const LM_API_KEY = process.env.LM_API_KEY || 'lm-studio';
const LM_MODEL = process.env.LM_MODEL || 'google/gemma-3n-e4b';
const LM_TEMPERATURE = parseFloat(process.env.LM_TEMPERATURE) || 0.8;

// Backend API configuration for chat persistence
const BACKEND_API_URL = process.env.BACKEND_API_URL || 'https://bcare.my.id';
const API_TOKEN = process.env.API_TOKEN || null; // Optional auth token

module.exports = {
  PORT,
  NODE_ENV,
  LM_BASE_URL,
  LM_API_KEY,
  LM_MODEL,
  LM_TEMPERATURE,
  BACKEND_API_URL,
  API_TOKEN
};
