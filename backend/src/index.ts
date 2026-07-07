import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';

import apiRoutes from './routes/api.routes';

// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env.PORT || 5001;

// Express Middlewares
app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Ensure uploads folder exists
const uploadsDir = path.join(__dirname, '../uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}
app.use('/uploads', express.static(uploadsDir));

// Mount API routes
app.use('/api', apiRoutes);

// Basic Health Check Route
app.get('/api/health', (req: Request, res: Response) => {

  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    service: 'Restaurant Discovery Intelligence Backend'
  });
});

// Central error handler
app.use((err: any, req: Request, res: Response, next: NextFunction) => {
  console.error('Unhandled Error:', err);
  res.status(err.status || 500).json({
    error: err.message || 'Internal Server Error',
    details: process.env.NODE_ENV === 'development' ? err.stack : undefined
  });
});

// Start Server
app.listen(PORT, () => {
  console.log(`🚀 RDI Backend running on http://localhost:${PORT}`);
});
