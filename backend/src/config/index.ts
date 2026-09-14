import dotenv from 'dotenv';
dotenv.config();

export const config = {
  PORT: process.env.PORT ? parseInt(process.env.PORT, 10) : 5000,
  NODE_ENV: process.env.NODE_ENV || 'development',
  CLIENT_URL: process.env.CLIENT_URL || 'http://localhost:5173',
  JWT_ACCESS_SECRET: process.env.JWT_ACCESS_SECRET || 'noble_edu_access_secret_super_secure_key_2026_vadodara',
  JWT_REFRESH_SECRET: process.env.JWT_REFRESH_SECRET || 'noble_edu_refresh_secret_super_secure_key_2026_vadodara',
  JWT_ACCESS_EXPIRES_IN: process.env.JWT_ACCESS_EXPIRES_IN || '15m',
  JWT_REFRESH_EXPIRES_IN: process.env.JWT_REFRESH_EXPIRES_IN || '7d',
  ORG_NAME: process.env.ORG_NAME || 'Noble Education',
  ORG_LOCATION: process.env.ORG_LOCATION || 'Vadodara, Gujarat, India',
  ORG_WEBSITE: process.env.ORG_WEBSITE || 'nobleedu.in',
  MAX_LOGIN_ATTEMPTS: 5,
  LOCKOUT_DURATION_MINUTES: 15,
};
