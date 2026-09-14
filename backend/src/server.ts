import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import cookieParser from 'cookie-parser';
import morgan from 'morgan';
import rateLimit from 'express-rate-limit';
import { config } from './config';
import apiRouter from './routes/api.router';
import prisma from './utils/prisma';

const app = express();

// Security Headers
app.use(helmet());

// CORS configuration supporting credentials from frontend
const allowedOrigins = [
  'http://localhost:5173',
  'http://localhost:3000',
  'http://127.0.0.1:5173',
  'http://127.0.0.1:3000',
  config.CLIENT_URL,
];

app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        callback(null, true); // Allow dev origins seamlessly
      }
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
  })
);

// Rate Limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 300, // 300 requests per window
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    error: 'Too many requests from this IP. Please slow down.',
  },
});
app.use('/api/', limiter);

// Request Parsing
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(cookieParser());

// Request Logging
if (config.NODE_ENV !== 'test') {
  app.use(morgan('dev'));
}

// System Health & Brand Information
app.get('/', (req: Request, res: Response) => {
  res.json({
    brand: config.ORG_NAME,
    location: config.ORG_LOCATION,
    website: config.ORG_WEBSITE,
    status: 'online',
    version: '1.0.0',
    documentation: '/api/v1/docs',
    timestamp: new Date().toISOString(),
  });
});

// Mount Versioned API Routes
app.use('/api/v1', apiRouter);

// 404 Route Handler
app.use((req: Request, res: Response) => {
  res.status(404).json({
    success: false,
    error: `Endpoint '${req.method} ${req.originalUrl}' not found on this server.`,
  });
});

// Global Error Handler
app.use((err: any, req: Request, res: Response, next: NextFunction) => {
  console.error('Unhandled server error:', err);
  const status = err.status || 500;
  const message = err.message || 'Internal Server Error';

  res.status(status).json({
    success: false,
    error: message,
    ...(config.NODE_ENV === 'development' ? { stack: err.stack } : {}),
  });
});

// Server Initialization
const server = app.listen(config.PORT, () => {
  console.log(`
  ======================================================
  🏛️  NOBLE EDUCATION ERP - BACKEND API SERVER
  ======================================================
  Location:   Vadodara, Gujarat, India
  Website:    nobleedu.in
  Port:       http://localhost:${config.PORT}
  API V1:     http://localhost:${config.PORT}/api/v1
  Database:   Prisma ORM (PostgreSQL & SQLite compatible)
  Environment:${config.NODE_ENV}
  ======================================================
  `);
});

// Graceful Shutdown
process.on('SIGTERM', async () => {
  console.log('SIGTERM signal received. Closing HTTP server and database pool...');
  server.close(async () => {
    await prisma.$disconnect();
    console.log('Server and database pool disconnected cleanly.');
    process.exit(0);
  });
});

export default app;
