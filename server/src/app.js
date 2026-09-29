import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import resolveRouter from './routes/resolve.js';

export function createApp() {
  const app = express();
  if (process.env.TRUST_PROXY === '1') app.set('trust proxy', 1);

  app.use(helmet({ crossOriginResourcePolicy: false }));
  const allowedOrigins = (process.env.CLIENT_ORIGIN || '').split(',').map((x) => x.trim()).filter(Boolean);
  app.use(cors({
    origin: allowedOrigins.length
      ? (origin, callback) => {
          if (!origin || allowedOrigins.includes(origin)) return callback(null, true);
          return callback(new Error('CORS origin denied'));
        }
      : true
  }));
  app.use(express.json({ limit: '10kb' }));

  app.get('/api/health', (_req, res) => res.json({
    success: true,
    service: 'public-media-resolver-api',
    mode: 'direct-download'
  }));

  app.use('/api', rateLimit({ windowMs: 60_000, limit: 30, standardHeaders: 'draft-8', legacyHeaders: false }));
  app.use('/api/media', resolveRouter);

  app.use((err, _req, res, _next) => {
    console.error('[unhandled]', err);
    if (res.headersSent) return;
    res.status(500).json({ success: false, message: 'Internal server error.' });
  });

  return app;
}
