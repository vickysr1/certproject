import cors from 'cors';
import express from 'express';
import helmet from 'helmet';
import morgan from 'morgan';
import { config } from './config.js';
import authRoutes from './routes/authRoutes.js';
import certificateRoutes from './routes/certificateRoutes.js';
import studentRoutes from './routes/studentRoutes.js';
import systemRoutes from './routes/systemRoutes.js';
import { errorHandler, notFoundHandler } from './middleware/errorHandler.js';

export function createApp() {
  const app = express();

  // Support multiple comma-separated origins: e.g.
  // FRONTEND_URL=https://your-app.vercel.app,http://localhost:3000
  const allowedOrigins = config.frontendUrl
    .split(',')
    .map((o) => o.trim())
    .filter(Boolean);

  app.use(helmet({ crossOriginResourcePolicy: false }));
  app.use(
    cors({
      origin: (origin, callback) => {
        // Allow requests with no origin (curl, mobile apps, same-origin)
        if (!origin) return callback(null, true);
        if (allowedOrigins.includes(origin)) return callback(null, true);
        callback(new Error(`CORS: ${origin} not in allow-list`));
      },
      credentials: false,
    }),
  );
  app.use(morgan('dev'));
  app.use(express.json({ limit: '2mb' }));
  app.use(express.urlencoded({ extended: true }));

  app.get('/api', (_req, res) => {
    res.json({
      name: config.appName,
      status: 'running',
    });
  });

  app.use('/api/auth', authRoutes);
  app.use('/api/students', studentRoutes);
  app.use('/api/certificates', certificateRoutes);
  app.use('/api/system', systemRoutes);

  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
}
